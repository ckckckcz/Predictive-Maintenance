package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/greenfields/server/core/models"
	"github.com/greenfields/server/pkg/utils"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type MechanicRepository interface {
	Create(ctx context.Context, req *models.CreateMechanicRequest) (*models.Mechanic, error)
	FindByID(ctx context.Context, id uuid.UUID) (*models.Mechanic, error)
	FindByEmail(ctx context.Context, email string) (*models.Mechanic, error)
	List(ctx context.Context) ([]*models.Mechanic, error)
	Update(ctx context.Context, id uuid.UUID, req *models.UpdateMechanicRequest) (*models.Mechanic, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type mechanicRepository struct {
	pool *pgxpool.Pool
}

func NewMechanicRepository(pool *pgxpool.Pool) MechanicRepository {
	return &mechanicRepository{pool: pool}
}

func (r *mechanicRepository) Create(ctx context.Context, req *models.CreateMechanicRequest) (*models.Mechanic, error) {
	var m models.Mechanic
	err := r.pool.QueryRow(ctx, `
		INSERT INTO mechanics (name, email, phone, specialization)
		VALUES ($1, $2, $3, $4)
		RETURNING id, name, email, phone, specialization, created_at, updated_at
	`, req.Name, req.Email, req.Phone, req.Specialization).Scan(
		&m.ID, &m.Name, &m.Email, &m.Phone, &m.Specialization, &m.CreatedAt, &m.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("mechanic: create: %w", err)
	}
	return &m, nil
}

func (r *mechanicRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.Mechanic, error) {
	var m models.Mechanic
	err := r.pool.QueryRow(ctx, `
		SELECT id, name, email, phone, specialization, created_at, updated_at
		FROM mechanics WHERE id = $1
	`, id).Scan(&m.ID, &m.Name, &m.Email, &m.Phone, &m.Specialization, &m.CreatedAt, &m.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.ErrNotFound
		}
		return nil, fmt.Errorf("mechanic: find by id: %w", err)
	}
	return &m, nil
}

func (r *mechanicRepository) FindByEmail(ctx context.Context, email string) (*models.Mechanic, error) {
	var m models.Mechanic
	err := r.pool.QueryRow(ctx, `
		SELECT id, name, email, phone, specialization, created_at, updated_at
		FROM mechanics WHERE email = $1
	`, email).Scan(&m.ID, &m.Name, &m.Email, &m.Phone, &m.Specialization, &m.CreatedAt, &m.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.ErrNotFound
		}
		return nil, fmt.Errorf("mechanic: find by email: %w", err)
	}
	return &m, nil
}

func (r *mechanicRepository) List(ctx context.Context) ([]*models.Mechanic, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, name, email, phone, specialization, created_at, updated_at
		FROM mechanics ORDER BY name ASC
	`)
	if err != nil {
		return nil, fmt.Errorf("mechanic: list: %w", err)
	}
	defer rows.Close()

	var list []*models.Mechanic
	for rows.Next() {
		var m models.Mechanic
		if err := rows.Scan(&m.ID, &m.Name, &m.Email, &m.Phone, &m.Specialization, &m.CreatedAt, &m.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, &m)
	}
	return list, rows.Err()
}

func (r *mechanicRepository) Update(ctx context.Context, id uuid.UUID, req *models.UpdateMechanicRequest) (*models.Mechanic, error) {
	var m models.Mechanic
	err := r.pool.QueryRow(ctx, `
		UPDATE mechanics
		SET name = $1, email = $2, phone = $3, specialization = $4, updated_at = NOW()
		WHERE id = $5
		RETURNING id, name, email, phone, specialization, created_at, updated_at
	`, req.Name, req.Email, req.Phone, req.Specialization, id).Scan(
		&m.ID, &m.Name, &m.Email, &m.Phone, &m.Specialization, &m.CreatedAt, &m.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.ErrNotFound
		}
		return nil, fmt.Errorf("mechanic: update: %w", err)
	}
	return &m, nil
}

func (r *mechanicRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, "DELETE FROM mechanics WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("mechanic: delete: %w", err)
	}
	return nil
}
