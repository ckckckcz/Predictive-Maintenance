package models

import (
	"time"

	"github.com/google/uuid"
)

// ─── Domain types ────────────────────────────────────────────────────────────

type UserRole string

const (
	RoleSupervisor UserRole = "SUPERVISOR"
	RoleOperator   UserRole = "OPERATOR"
)

type User struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Password  string    `json:"-"`
	Role      UserRole  `json:"role"`
	Phone     *string   `json:"phone"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type UserPublic struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Role      UserRole  `json:"role"`
	Phone     *string   `json:"phone"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (u *User) ToPublic() *UserPublic {
	return &UserPublic{
		ID:        u.ID,
		Name:      u.Name,
		Email:     u.Email,
		Role:      u.Role,
		Phone:     u.Phone,
		IsActive:  u.IsActive,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}

// ─── Request / Response DTOs ─────────────────────────────────────────────────

type LoginRequest struct {
	Email    string `json:"email"    binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginResponse struct {
	AccessToken  string      `json:"access_token"`
	RefreshToken string      `json:"refresh_token"`
	User         *UserPublic `json:"user"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type RegisterRequest struct {
	Name     string   `json:"name"     binding:"required,min=2,max=100"`
	Email    string   `json:"email"    binding:"required,email"`
	Password string   `json:"password" binding:"required,min=8"`
	Role     UserRole `json:"role"     binding:"required,oneof=SUPERVISOR OPERATOR"`
	Phone    *string  `json:"phone"`
}

type UpdateProfileRequest struct {
	Name  string  `json:"name"  binding:"required,min=2,max=100"`
	Phone *string `json:"phone"`
}

type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=8"`
}

type UpdateUserRequest struct {
	Name     string   `json:"name"      binding:"required,min=2,max=100"`
	Role     UserRole `json:"role"      binding:"required,oneof=SUPERVISOR OPERATOR"`
	Phone    *string  `json:"phone"`
	IsActive bool     `json:"is_active"`
}
