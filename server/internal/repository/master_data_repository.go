package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/greenfields/server/internal/models"
	"github.com/greenfields/server/pkg/utils"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type MasterDataRepository interface {
	// Areas
	ListAreas(ctx context.Context) ([]*models.Area, error)
	FindAreaByID(ctx context.Context, id uuid.UUID) (*models.Area, error)
	FindAreaByCode(ctx context.Context, code string) (*models.Area, error)
	CreateArea(ctx context.Context, req *models.CreateMasterDataRequest) (*models.Area, error)
	UpdateArea(ctx context.Context, id uuid.UUID, req *models.UpdateMasterDataRequest) (*models.Area, error)
	DeleteArea(ctx context.Context, id uuid.UUID) error

	// Lines
	ListLines(ctx context.Context) ([]*models.Line, error)
	FindLineByID(ctx context.Context, id uuid.UUID) (*models.Line, error)
	FindLineByCode(ctx context.Context, code string) (*models.Line, error)
	CreateLine(ctx context.Context, req *models.CreateMasterDataRequest) (*models.Line, error)
	UpdateLine(ctx context.Context, id uuid.UUID, req *models.UpdateMasterDataRequest) (*models.Line, error)
	DeleteLine(ctx context.Context, id uuid.UUID) error

	// MachineTypes
	ListMachineTypes(ctx context.Context) ([]*models.MachineType, error)
	FindMachineTypeByID(ctx context.Context, id uuid.UUID) (*models.MachineType, error)
	FindMachineTypeByCode(ctx context.Context, code string) (*models.MachineType, error)
	CreateMachineType(ctx context.Context, req *models.CreateMasterDataRequest) (*models.MachineType, error)
	UpdateMachineType(ctx context.Context, id uuid.UUID, req *models.UpdateMasterDataRequest) (*models.MachineType, error)
	DeleteMachineType(ctx context.Context, id uuid.UUID) error
}

type masterDataRepository struct {
	pool *pgxpool.Pool
}

func NewMasterDataRepository(pool *pgxpool.Pool) MasterDataRepository {
	return &masterDataRepository{pool: pool}
}

// ─── Areas ───────────────────────────────────────────────────────────────────

func (r *masterDataRepository) ListAreas(ctx context.Context) ([]*models.Area, error) {
	rows, err := r.pool.Query(ctx, "SELECT id, name, code, created_at, updated_at FROM areas ORDER BY name ASC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*models.Area
	for rows.Next() {
		var a models.Area
		if err := rows.Scan(&a.ID, &a.Name, &a.Code, &a.CreatedAt, &a.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, &a)
	}
	return list, rows.Err()
}

func (r *masterDataRepository) FindAreaByID(ctx context.Context, id uuid.UUID) (*models.Area, error) {
	var a models.Area
	err := r.pool.QueryRow(ctx, "SELECT id, name, code, created_at, updated_at FROM areas WHERE id = $1", id).
		Scan(&a.ID, &a.Name, &a.Code, &a.CreatedAt, &a.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.ErrNotFound
		}
		return nil, err
	}
	return &a, nil
}

func (r *masterDataRepository) FindAreaByCode(ctx context.Context, code string) (*models.Area, error) {
	var a models.Area
	err := r.pool.QueryRow(ctx, "SELECT id, name, code, created_at, updated_at FROM areas WHERE code = $1", code).
		Scan(&a.ID, &a.Name, &a.Code, &a.CreatedAt, &a.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.ErrNotFound
		}
		return nil, err
	}
	return &a, nil
}

func (r *masterDataRepository) CreateArea(ctx context.Context, req *models.CreateMasterDataRequest) (*models.Area, error) {
	var a models.Area
	err := r.pool.QueryRow(ctx, "INSERT INTO areas (name, code) VALUES ($1, $2) RETURNING id, name, code, created_at, updated_at",
		req.Name, req.Code,
	).Scan(&a.ID, &a.Name, &a.Code, &a.CreatedAt, &a.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *masterDataRepository) UpdateArea(ctx context.Context, id uuid.UUID, req *models.UpdateMasterDataRequest) (*models.Area, error) {
	var a models.Area
	err := r.pool.QueryRow(ctx, "UPDATE areas SET name = $1, code = $2, updated_at = NOW() WHERE id = $3 RETURNING id, name, code, created_at, updated_at",
		req.Name, req.Code, id,
	).Scan(&a.ID, &a.Name, &a.Code, &a.CreatedAt, &a.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.ErrNotFound
		}
		return nil, err
	}
	return &a, nil
}

func (r *masterDataRepository) DeleteArea(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, "DELETE FROM areas WHERE id = $1", id)
	return err
}

// ─── Lines ───────────────────────────────────────────────────────────────────

func (r *masterDataRepository) ListLines(ctx context.Context) ([]*models.Line, error) {
	rows, err := r.pool.Query(ctx, "SELECT id, name, code, created_at, updated_at FROM lines ORDER BY name ASC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*models.Line
	for rows.Next() {
		var l models.Line
		if err := rows.Scan(&l.ID, &l.Name, &l.Code, &l.CreatedAt, &l.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, &l)
	}
	return list, rows.Err()
}

func (r *masterDataRepository) FindLineByID(ctx context.Context, id uuid.UUID) (*models.Line, error) {
	var l models.Line
	err := r.pool.QueryRow(ctx, "SELECT id, name, code, created_at, updated_at FROM lines WHERE id = $1", id).
		Scan(&l.ID, &l.Name, &l.Code, &l.CreatedAt, &l.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.ErrNotFound
		}
		return nil, err
	}
	return &l, nil
}

func (r *masterDataRepository) FindLineByCode(ctx context.Context, code string) (*models.Line, error) {
	var l models.Line
	err := r.pool.QueryRow(ctx, "SELECT id, name, code, created_at, updated_at FROM lines WHERE code = $1", code).
		Scan(&l.ID, &l.Name, &l.Code, &l.CreatedAt, &l.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.ErrNotFound
		}
		return nil, err
	}
	return &l, nil
}

func (r *masterDataRepository) CreateLine(ctx context.Context, req *models.CreateMasterDataRequest) (*models.Line, error) {
	var l models.Line
	err := r.pool.QueryRow(ctx, "INSERT INTO lines (name, code) VALUES ($1, $2) RETURNING id, name, code, created_at, updated_at",
		req.Name, req.Code,
	).Scan(&l.ID, &l.Name, &l.Code, &l.CreatedAt, &l.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &l, nil
}

func (r *masterDataRepository) UpdateLine(ctx context.Context, id uuid.UUID, req *models.UpdateMasterDataRequest) (*models.Line, error) {
	var l models.Line
	err := r.pool.QueryRow(ctx, "UPDATE lines SET name = $1, code = $2, updated_at = NOW() WHERE id = $3 RETURNING id, name, code, created_at, updated_at",
		req.Name, req.Code, id,
	).Scan(&l.ID, &l.Name, &l.Code, &l.CreatedAt, &l.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.ErrNotFound
		}
		return nil, err
	}
	return &l, nil
}

func (r *masterDataRepository) DeleteLine(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, "DELETE FROM lines WHERE id = $1", id)
	return err
}

// ─── MachineTypes ─────────────────────────────────────────────────────────────

func (r *masterDataRepository) ListMachineTypes(ctx context.Context) ([]*models.MachineType, error) {
	rows, err := r.pool.Query(ctx, "SELECT id, name, code, created_at, updated_at FROM machine_types ORDER BY name ASC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*models.MachineType
	for rows.Next() {
		var mt models.MachineType
		if err := rows.Scan(&mt.ID, &mt.Name, &mt.Code, &mt.CreatedAt, &mt.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, &mt)
	}
	return list, rows.Err()
}

func (r *masterDataRepository) FindMachineTypeByID(ctx context.Context, id uuid.UUID) (*models.MachineType, error) {
	var mt models.MachineType
	err := r.pool.QueryRow(ctx, "SELECT id, name, code, created_at, updated_at FROM machine_types WHERE id = $1", id).
		Scan(&mt.ID, &mt.Name, &mt.Code, &mt.CreatedAt, &mt.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.ErrNotFound
		}
		return nil, err
	}
	return &mt, nil
}

func (r *masterDataRepository) FindMachineTypeByCode(ctx context.Context, code string) (*models.MachineType, error) {
	var mt models.MachineType
	err := r.pool.QueryRow(ctx, "SELECT id, name, code, created_at, updated_at FROM machine_types WHERE code = $1", code).
		Scan(&mt.ID, &mt.Name, &mt.Code, &mt.CreatedAt, &mt.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.ErrNotFound
		}
		return nil, err
	}
	return &mt, nil
}

func (r *masterDataRepository) CreateMachineType(ctx context.Context, req *models.CreateMasterDataRequest) (*models.MachineType, error) {
	var mt models.MachineType
	err := r.pool.QueryRow(ctx, "INSERT INTO machine_types (name, code) VALUES ($1, $2) RETURNING id, name, code, created_at, updated_at",
		req.Name, req.Code,
	).Scan(&mt.ID, &mt.Name, &mt.Code, &mt.CreatedAt, &mt.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &mt, nil
}

func (r *masterDataRepository) UpdateMachineType(ctx context.Context, id uuid.UUID, req *models.UpdateMasterDataRequest) (*models.MachineType, error) {
	var mt models.MachineType
	err := r.pool.QueryRow(ctx, "UPDATE machine_types SET name = $1, code = $2, updated_at = NOW() WHERE id = $3 RETURNING id, name, code, created_at, updated_at",
		req.Name, req.Code, id,
	).Scan(&mt.ID, &mt.Name, &mt.Code, &mt.CreatedAt, &mt.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.ErrNotFound
		}
		return nil, err
	}
	return &mt, nil
}

func (r *masterDataRepository) DeleteMachineType(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, "DELETE FROM machine_types WHERE id = $1", id)
	return err
}
