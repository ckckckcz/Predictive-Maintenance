package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/greenfields/server/core/models"
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
	Update(ctx context.Context, id uuid.UUID, req *models.UpdateMachineRequest) (*models.Machine, error)
	Delete(ctx context.Context, id uuid.UUID) error
	MechanicExistsByEmail(ctx context.Context, email string) (bool, error)
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
		WITH inserted AS (
			INSERT INTO machines (name, code, type, location, mechanic_id)
			VALUES ($1, $2, $3, $4, $5)
			RETURNING id, name, code, type, location, status, mechanic_id, created_at
		)
		SELECT i.id, i.name, i.code, i.type, i.location, i.status, i.mechanic_id, i.created_at,
		       mec.name, mec.email, mec.phone, mec.specialization
		FROM inserted i
		LEFT JOIN mechanics mec ON i.mechanic_id = mec.id`

	queryFindMachineByID = `
		SELECT m.id, m.name, m.code, m.type, m.location, m.status, m.mechanic_id, m.created_at,
		       mec.name, mec.email, mec.phone, mec.specialization
		FROM machines m
		LEFT JOIN mechanics mec ON m.mechanic_id = mec.id
		WHERE m.id = $1`

	queryFindMachineByCode = `
		SELECT m.id, m.name, m.code, m.type, m.location, m.status, m.mechanic_id, m.created_at,
		       mec.name, mec.email, mec.phone, mec.specialization
		FROM machines m
		LEFT JOIN mechanics mec ON m.mechanic_id = mec.id
		WHERE m.code = $1`

	queryListMachines = `
		SELECT m.id, m.name, m.code, m.type, m.location, m.status, m.mechanic_id, m.created_at,
		       mec.name, mec.email, mec.phone, mec.specialization
		FROM machines m
		LEFT JOIN mechanics mec ON m.mechanic_id = mec.id
		ORDER BY m.created_at ASC`

	queryUpdateMachineStatus = `UPDATE machines SET status=$2 WHERE id=$1`

	queryUpdateMachine = `
		WITH updated AS (
			UPDATE machines
			SET name = $1, code = $2, type = $3, location = $4, mechanic_id = $5
			WHERE id = $6
			RETURNING id, name, code, type, location, status, mechanic_id, created_at
		)
		SELECT u.id, u.name, u.code, u.type, u.location, u.status, u.mechanic_id, u.created_at,
		       mec.name, mec.email, mec.phone, mec.specialization
		FROM updated u
		LEFT JOIN mechanics mec ON u.mechanic_id = mec.id`
)

// ─── Methods ─────────────────────────────────────────────────────────────────

func (r *machineRepository) Create(ctx context.Context, req *models.CreateMachineRequest) (*models.Machine, error) {
	row := r.pool.QueryRow(ctx, queryCreateMachine,
		req.Name, req.Code, req.Type, req.Location, req.MechanicID,
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

func (r *machineRepository) Update(ctx context.Context, id uuid.UUID, req *models.UpdateMachineRequest) (*models.Machine, error) {
	row := r.pool.QueryRow(ctx, queryUpdateMachine,
		req.Name, req.Code, req.Type, req.Location, req.MechanicID, id,
	)
	return scanMachine(row)
}

func (r *machineRepository) Delete(ctx context.Context, id uuid.UUID) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// 1. Delete audit logs referencing incidents of this machine
	_, err = tx.Exec(ctx, `
		DELETE FROM audit_logs
		WHERE incident_id IN (SELECT id FROM incidents WHERE machine_id = $1)
	`, id)
	if err != nil {
		return err
	}

	// 2. Delete incidents of this machine
	_, err = tx.Exec(ctx, `DELETE FROM incidents WHERE machine_id = $1`, id)
	if err != nil {
		return err
	}

	// 3. Delete sensor readings of this machine
	_, err = tx.Exec(ctx, `DELETE FROM sensor_readings WHERE machine_id = $1`, id)
	if err != nil {
		return err
	}

	// 4. Delete the machine
	_, err = tx.Exec(ctx, `DELETE FROM machines WHERE id = $1`, id)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// ─── Scanner ─────────────────────────────────────────────────────────────────

func scanMachine(row rowScanner) (*models.Machine, error) {
	var m models.Machine
	var location pgtype.Text
	var mechanicID pgtype.UUID
	var mecName pgtype.Text
	var mecEmail pgtype.Text
	var mecPhone pgtype.Text
	var mecSpec pgtype.Text

	err := row.Scan(
		&m.ID, &m.Name, &m.Code, &m.Type, &location, &m.Status, &mechanicID, &m.CreatedAt,
		&mecName, &mecEmail, &mecPhone, &mecSpec,
	)
	if err != nil {
		return nil, fmt.Errorf("machine: scan: %w", err)
	}
	if location.Valid {
		m.Location = &location.String
	}
	if mechanicID.Valid {
		uid := uuid.UUID(mechanicID.Bytes)
		m.MechanicID = &uid
		if mecName.Valid {
			m.Mechanic = &models.Mechanic{
				ID:             uid,
				Name:           mecName.String,
				Email:          mecEmail.String,
				Phone:          mecPhone.String,
				Specialization: mecSpec.String,
			}
		}
	}
	return &m, nil
}

func (r *machineRepository) MechanicExistsByEmail(ctx context.Context, email string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM mechanics WHERE email = $1)", email).Scan(&exists)
	return exists, err
}
