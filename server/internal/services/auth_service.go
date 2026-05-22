package services

import (
	"context"
	"fmt"
	"log"

	"github.com/google/uuid"
	"github.com/greenfields/server/internal/models"
	"github.com/greenfields/server/internal/repository"
	"github.com/greenfields/server/pkg/config"
	"github.com/greenfields/server/pkg/utils"
	"golang.org/x/crypto/bcrypt"
)

// AuthService handles authentication and user profile management.
type AuthService struct {
	users repository.UserRepository
	cfg   *config.Config
}

func NewAuthService(users repository.UserRepository, cfg *config.Config) *AuthService {
	return &AuthService{users: users, cfg: cfg}
}

// Login verifies credentials and returns a JWT token pair.
func (s *AuthService) Login(ctx context.Context, req *models.LoginRequest) (*models.LoginResponse, error) {
	log.Printf("[LOGIN DEBUG] Checking credentials for email: %q", req.Email)
	user, err := s.users.FindByEmail(ctx, req.Email)
	if err != nil {
		log.Printf("[LOGIN DEBUG] User with email %q not found in DB: %v", req.Email, err)
		return nil, utils.ErrUnauthorized
	}

	if !user.IsActive {
		log.Printf("[LOGIN DEBUG] User %q is found but marked as inactive", req.Email)
		return nil, fmt.Errorf("%w: account is deactivated", utils.ErrUnauthorized)
	}

	log.Printf("[LOGIN DEBUG] User found. Comparing password hash. Password length sent: %d", len(req.Password))
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		log.Printf("[LOGIN DEBUG] Password comparison failed for %q: %v", req.Email, err)
		return nil, utils.ErrUnauthorized
	}

	log.Printf("[LOGIN DEBUG] Login successful for user %q", req.Email)
	return s.buildTokenPair(user)
}

// Register creates a new user. Only SUPERVISOR can call this (enforced at handler level).
func (s *AuthService) Register(ctx context.Context, req *models.RegisterRequest) (*models.UserPublic, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	if err != nil {
		return nil, fmt.Errorf("auth: hash password: %w", err)
	}

	user, err := s.users.Create(ctx, req, string(hashed))
	if err != nil {
		return nil, fmt.Errorf("%w: email already registered", utils.ErrConflict)
	}
	return user.ToPublic(), nil
}

// RefreshToken validates a refresh token and issues a new token pair.
func (s *AuthService) RefreshToken(ctx context.Context, req *models.RefreshTokenRequest) (*models.LoginResponse, error) {
	userIDStr, err := utils.ParseRefreshToken(req.RefreshToken, s.cfg.JWT.Secret)
	if err != nil {
		return nil, utils.ErrUnauthorized
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, utils.ErrUnauthorized
	}

	user, err := s.users.FindByID(ctx, userID)
	if err != nil || !user.IsActive {
		return nil, utils.ErrUnauthorized
	}

	return s.buildTokenPair(user)
}

// GetProfile returns the public profile of the authenticated user.
func (s *AuthService) GetProfile(ctx context.Context, userID uuid.UUID) (*models.UserPublic, error) {
	user, err := s.users.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	return user.ToPublic(), nil
}

// UpdateProfile updates name and phone of the authenticated user.
func (s *AuthService) UpdateProfile(ctx context.Context, userID uuid.UUID, req *models.UpdateProfileRequest) (*models.UserPublic, error) {
	user, err := s.users.UpdateProfile(ctx, userID, req)
	if err != nil {
		return nil, err
	}
	return user.ToPublic(), nil
}

// ChangePassword verifies the old password and sets the new one.
func (s *AuthService) ChangePassword(ctx context.Context, userID uuid.UUID, req *models.ChangePasswordRequest) error {
	user, err := s.users.FindByID(ctx, userID)
	if err != nil {
		return err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.OldPassword)); err != nil {
		return fmt.Errorf("%w: incorrect current password", utils.ErrBadRequest)
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), 12)
	if err != nil {
		return fmt.Errorf("auth: hash new password: %w", err)
	}

	return s.users.UpdatePassword(ctx, userID, string(hashed))
}

// ─── Private helpers ─────────────────────────────────────────────────────────

func (s *AuthService) buildTokenPair(user *models.User) (*models.LoginResponse, error) {
	accessToken, err := utils.GenerateAccessToken(
		user.ID.String(), string(user.Role),
		s.cfg.JWT.Secret, s.cfg.JWT.AccessExpires,
	)
	if err != nil {
		return nil, fmt.Errorf("auth: generate access token: %w", err)
	}

	refreshToken, err := utils.GenerateRefreshToken(
		user.ID.String(),
		s.cfg.JWT.Secret, s.cfg.JWT.RefreshExpires,
	)
	if err != nil {
		return nil, fmt.Errorf("auth: generate refresh token: %w", err)
	}

	return &models.LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         user.ToPublic(),
	}, nil
}
