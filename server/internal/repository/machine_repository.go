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

type MachineRepository interface {
	Create(ctx context.Context, req *models.CreateMachineRequest) (*models.Machine, error)
	FindByID(ctx context.Context, id uuid.UUID) (*models.Machine, error)
	FindByCode(ctx context.Context, code string) (*models.Machine, error)
	List(ctx context.Context) ([]*models.Machine, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, status models.MachineStatus) error
}

// ─── Implementation ──────────────────────────────────────────────────────────

type machineRepository struct {
	pool *pgxpool.Pool
}

func NewMachineRepository(pool *pgxpool.Pool) MachineRepository {
	return &machineRepository{pool: pool}
}

// ─── Queries ─────────────────────────────────────────────────────────────────

const (
	queryCreateMachine = `
		INSERT INTO machines (name, code, type, location)
		VALUES ($1, $2, $3, $4)
		RETURNING id, name, code, type, location, status, created_at`

	queryFindMachineByID = `
		SELECT id, name, code, type, location, status, created_at
		FROM machines WHERE id = $1`

	queryFindMachineByCode = `
		SELECT id, name, code, type, location, status, created_at
		FROM machines WHERE code = $1`

	queryListMachines = `
		SELECT id, name, code, type, location, status, created_at
		FROM machines ORDER BY created_at ASC`

	queryUpdateMachineStatus = `UPDATE machines SET status=$2 WHERE id=$1`
)

// ─── Methods ─────────────────────────────────────────────────────────────────

func (r *machineRepository) Create(ctx context.Context, req *models.CreateMachineRequest) (*models.Machine, error) {
	row := r.pool.QueryRow(ctx, queryCreateMachine,
		req.Name, req.Code, req.Type, req.Location,
	)
	return scanMachine(row)
}

func (r *machineRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.Machine, error) {
	row := r.pool.QueryRow(ctx, queryFindMachineByID, id)
	m, err := scanMachine(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.ErrNotFound
		}
		return nil, err
	}
	return m, nil
}

func (r *machineRepository) FindByCode(ctx context.Context, code string) (*models.Machine, error) {
	row := r.pool.QueryRow(ctx, queryFindMachineByCode, code)
	m, err := scanMachine(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.ErrNotFound
		}
		return nil, err
	}
	return m, nil
}

func (r *machineRepository) List(ctx context.Context) ([]*models.Machine, error) {
	rows, err := r.pool.Query(ctx, queryListMachines)
	if err != nil {
		return nil, fmt.Errorf("machine: list: %w", err)
	}
	defer rows.Close()

	var machines []*models.Machine
	for rows.Next() {
		m, err := scanMachine(rows)
		if err != nil {
			return nil, err
		}
		machines = append(machines, m)
	}
	return machines, rows.Err()
}

func (r *machineRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status models.MachineStatus) error {
	_, err := r.pool.Exec(ctx, queryUpdateMachineStatus, id, string(status))
	return err
}

// ─── Scanner ─────────────────────────────────────────────────────────────────

func scanMachine(row rowScanner) (*models.Machine, error) {
	var m models.Machine
	var location pgtype.Text

	err := row.Scan(
		&m.ID, &m.Name, &m.Code, &m.Type, &location, &m.Status, &m.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("machine: scan: %w", err)
	}
	if location.Valid {
		m.Location = &location.String
	}
	return &m, nil
}
