package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/greenfields/server/internal/models"
	"github.com/greenfields/server/pkg/utils"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ─── Interface ───────────────────────────────────────────────────────────────

type UserRepository interface {
	Create(ctx context.Context, req *models.RegisterRequest, hashedPassword string) (*models.User, error)
	FindByEmail(ctx context.Context, email string) (*models.User, error)
	FindByID(ctx context.Context, id uuid.UUID) (*models.User, error)
	List(ctx context.Context) ([]*models.User, error)
	Update(ctx context.Context, id uuid.UUID, req *models.UpdateUserRequest) (*models.User, error)
	UpdateProfile(ctx context.Context, id uuid.UUID, req *models.UpdateProfileRequest) (*models.User, error)
	UpdatePassword(ctx context.Context, id uuid.UUID, hashedPassword string) error
	Deactivate(ctx context.Context, id uuid.UUID) error
}

// ─── Implementation ──────────────────────────────────────────────────────────

type userRepository struct {
	pool *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) UserRepository {
	return &userRepository{pool: pool}
}

// ─── Queries ─────────────────────────────────────────────────────────────────

const (
	queryCreateUser = `
		INSERT INTO users (name, email, password, role, phone)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, name, email, password, role, phone, is_active, created_at, updated_at`

	queryFindUserByEmail = `
		SELECT id, name, email, password, role, phone, is_active, created_at, updated_at
		FROM users WHERE email = $1`

	queryFindUserByID = `
		SELECT id, name, email, password, role, phone, is_active, created_at, updated_at
		FROM users WHERE id = $1`

	queryListUsers = `
		SELECT id, name, email, password, role, phone, is_active, created_at, updated_at
		FROM users ORDER BY created_at DESC`

	queryUpdateUser = `
		UPDATE users SET name=$2, role=$3, phone=$4, is_active=$5
		WHERE id=$1
		RETURNING id, name, email, password, role, phone, is_active, created_at, updated_at`

	queryUpdateProfile = `
		UPDATE users SET name=$2, phone=$3
		WHERE id=$1
		RETURNING id, name, email, password, role, phone, is_active, created_at, updated_at`

	queryUpdatePassword = `UPDATE users SET password=$2 WHERE id=$1`

	queryDeactivateUser = `UPDATE users SET is_active=false WHERE id=$1`
)

// ─── Methods ─────────────────────────────────────────────────────────────────

func (r *userRepository) Create(ctx context.Context, req *models.RegisterRequest, hashedPassword string) (*models.User, error) {
	row := r.pool.QueryRow(ctx, queryCreateUser,
		req.Name, req.Email, hashedPassword, req.Role, req.Phone,
	)
	return scanUser(row)
}

func (r *userRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	row := r.pool.QueryRow(ctx, queryFindUserByEmail, email)
	u, err := scanUser(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.ErrNotFound
		}
		return nil, err
	}
	return u, nil
}

func (r *userRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	row := r.pool.QueryRow(ctx, queryFindUserByID, id)
	u, err := scanUser(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.ErrNotFound
		}
		return nil, err
	}
	return u, nil
}

func (r *userRepository) List(ctx context.Context) ([]*models.User, error) {
	rows, err := r.pool.Query(ctx, queryListUsers)
	if err != nil {
		return nil, fmt.Errorf("user: list: %w", err)
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		u, err := scanUser(rows)
		if err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}

func (r *userRepository) Update(ctx context.Context, id uuid.UUID, req *models.UpdateUserRequest) (*models.User, error) {
	row := r.pool.QueryRow(ctx, queryUpdateUser,
		id, req.Name, req.Role, req.Phone, req.IsActive,
	)
	u, err := scanUser(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.ErrNotFound
		}
		return nil, err
	}
	return u, nil
}

func (r *userRepository) UpdateProfile(ctx context.Context, id uuid.UUID, req *models.UpdateProfileRequest) (*models.User, error) {
	row := r.pool.QueryRow(ctx, queryUpdateProfile, id, req.Name, req.Phone)
	u, err := scanUser(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.ErrNotFound
		}
		return nil, err
	}
	return u, nil
}

func (r *userRepository) UpdatePassword(ctx context.Context, id uuid.UUID, hashedPassword string) error {
	_, err := r.pool.Exec(ctx, queryUpdatePassword, id, hashedPassword)
	return err
}

func (r *userRepository) Deactivate(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, queryDeactivateUser, id)
	return err
}

// ─── Scanner ─────────────────────────────────────────────────────────────────

// scanUser scans a single row (from QueryRow or rows.Scan) into a User.
// Uses pgtype.Text for nullable phone field.
type rowScanner interface {
	Scan(dest ...any) error
}

func scanUser(row rowScanner) (*models.User, error) {
	var u models.User
	var phone pgtype.Text

	err := row.Scan(
		&u.ID, &u.Name, &u.Email, &u.Password,
		&u.Role, &phone, &u.IsActive, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("user: scan: %w", err)
	}
	if phone.Valid {
		u.Phone = &phone.String
	}
	return &u, nil
}
