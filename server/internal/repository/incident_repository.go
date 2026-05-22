package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/greenfields/server/internal/models"
	"github.com/greenfields/server/pkg/utils"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ─── Interface ───────────────────────────────────────────────────────────────

type IncidentRepository interface {
	Create(ctx context.Context, i *models.Incident) (*models.Incident, error)
	FindByID(ctx context.Context, id uuid.UUID) (*models.IncidentWithDetails, error)
	List(ctx context.Context, f models.IncidentFilter) ([]*models.IncidentWithDetails, int64, error)
	Acknowledge(ctx context.Context, id, userID uuid.UUID) error
	Resolve(ctx context.Context, id, userID uuid.UUID) error
	SoftDelete(ctx context.Context, id uuid.UUID) error
	GetStats(ctx context.Context) (*models.IncidentStats, error)
}

// ─── Implementation ──────────────────────────────────────────────────────────

type incidentRepository struct {
	pool *pgxpool.Pool
}

func NewIncidentRepository(pool *pgxpool.Pool) IncidentRepository {
	return &incidentRepository{pool: pool}
}

// ─── Queries ─────────────────────────────────────────────────────────────────

const (
	queryCreateIncident = `
		INSERT INTO incidents (machine_id, reading_id, title, description, severity, status, risk_score)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, machine_id, reading_id, title, description, severity, status, risk_score,
		          acknowledged_by, acknowledged_at, resolved_by, resolved_at, deleted_at, created_at, updated_at`

	queryFindIncidentByID = `
		SELECT i.id, i.machine_id, i.reading_id, i.title, i.description, i.severity, i.status,
		       i.risk_score, i.acknowledged_by, i.acknowledged_at, i.resolved_by, i.resolved_at,
		       i.deleted_at, i.created_at, i.updated_at,
		       m.name AS machine_name, m.code AS machine_code,
		       u1.name AS acknowledged_by_name, u2.name AS resolved_by_name
		FROM incidents i
		LEFT JOIN machines m  ON i.machine_id = m.id
		LEFT JOIN users u1    ON i.acknowledged_by = u1.id
		LEFT JOIN users u2    ON i.resolved_by = u2.id
		WHERE i.id = $1 AND i.deleted_at IS NULL`

	queryAcknowledgeIncident = `
		UPDATE incidents
		SET status = 'IN_PROGRESS', acknowledged_by = $2, acknowledged_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL`

	queryResolveIncident = `
		UPDATE incidents
		SET status = 'RESOLVED', resolved_by = $2, resolved_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL`

	querySoftDeleteIncident = `
		UPDATE incidents SET deleted_at = NOW() WHERE id = $1`

	queryIncidentStats = `
		SELECT
		    COUNT(*)                                         AS total,
		    COUNT(*) FILTER (WHERE status = 'OPEN')         AS open,
		    COUNT(*) FILTER (WHERE status = 'IN_PROGRESS')  AS in_progress,
		    COUNT(*) FILTER (WHERE status = 'RESOLVED')     AS resolved,
		    COUNT(*) FILTER (WHERE severity = 'CRITICAL')   AS critical,
		    COUNT(*) FILTER (WHERE severity = 'HIGH')       AS high,
		    COUNT(*) FILTER (WHERE severity = 'MEDIUM')     AS medium,
		    COUNT(*) FILTER (WHERE severity = 'LOW')        AS low
		FROM incidents WHERE deleted_at IS NULL`
)

// ─── Methods ─────────────────────────────────────────────────────────────────

func (r *incidentRepository) Create(ctx context.Context, i *models.Incident) (*models.Incident, error) {
	row := r.pool.QueryRow(ctx, queryCreateIncident,
		i.MachineID, i.ReadingID, i.Title, i.Description,
		i.Severity, i.Status, i.RiskScore,
	)
	return scanIncident(row)
}

func (r *incidentRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.IncidentWithDetails, error) {
	row := r.pool.QueryRow(ctx, queryFindIncidentByID, id)
	inc, err := scanIncidentWithDetails(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.ErrNotFound
		}
		return nil, err
	}
	return inc, nil
}

// List builds a dynamic query based on filter fields and returns paginated results.
func (r *incidentRepository) List(ctx context.Context, f models.IncidentFilter) ([]*models.IncidentWithDetails, int64, error) {
	where, args := buildIncidentWhere(f)

	// Count query
	countSQL := fmt.Sprintf(`SELECT COUNT(*) FROM incidents i %s`, where)
	var total int64
	if err := r.pool.QueryRow(ctx, countSQL, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("incident: count: %w", err)
	}

	// Data query — add LIMIT / OFFSET after the dynamic args
	argIdx := len(args) + 1
	listSQL := fmt.Sprintf(`
		SELECT i.id, i.machine_id, i.reading_id, i.title, i.description, i.severity, i.status,
		       i.risk_score, i.acknowledged_by, i.acknowledged_at, i.resolved_by, i.resolved_at,
		       i.deleted_at, i.created_at, i.updated_at,
		       m.name AS machine_name, m.code AS machine_code,
		       u1.name AS acknowledged_by_name, u2.name AS resolved_by_name
		FROM incidents i
		LEFT JOIN machines m ON i.machine_id = m.id
		LEFT JOIN users u1   ON i.acknowledged_by = u1.id
		LEFT JOIN users u2   ON i.resolved_by = u2.id
		%s
		ORDER BY i.created_at DESC
		LIMIT $%d OFFSET $%d`, where, argIdx, argIdx+1)

	args = append(args, f.Limit, f.Offset)
	rows, err := r.pool.Query(ctx, listSQL, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("incident: list: %w", err)
	}
	defer rows.Close()

	var incidents []*models.IncidentWithDetails
	for rows.Next() {
		inc, err := scanIncidentWithDetails(rows)
		if err != nil {
			return nil, 0, err
		}
		incidents = append(incidents, inc)
	}
	return incidents, total, rows.Err()
}

func (r *incidentRepository) Acknowledge(ctx context.Context, id, userID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, queryAcknowledgeIncident, id, userID)
	return err
}

func (r *incidentRepository) Resolve(ctx context.Context, id, userID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, queryResolveIncident, id, userID)
	return err
}

func (r *incidentRepository) SoftDelete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, querySoftDeleteIncident, id)
	return err
}

func (r *incidentRepository) GetStats(ctx context.Context) (*models.IncidentStats, error) {
	var s models.IncidentStats
	err := r.pool.QueryRow(ctx, queryIncidentStats).Scan(
		&s.Total, &s.Open, &s.InProgress, &s.Resolved,
		&s.Critical, &s.High, &s.Medium, &s.Low,
	)
	if err != nil {
		return nil, fmt.Errorf("incident: stats: %w", err)
	}
	return &s, nil
}

// ─── Dynamic WHERE builder ───────────────────────────────────────────────────

func buildIncidentWhere(f models.IncidentFilter) (string, []interface{}) {
	conds := []string{"i.deleted_at IS NULL"}
	args := []interface{}{}
	idx := 1

	if f.MachineID != "" {
		conds = append(conds, fmt.Sprintf("i.machine_id = $%d", idx))
		args = append(args, f.MachineID)
		idx++
	}
	if f.Severity != "" {
		conds = append(conds, fmt.Sprintf("i.severity = $%d", idx))
		args = append(args, f.Severity)
		idx++
	}
	if f.Status != "" {
		conds = append(conds, fmt.Sprintf("i.status = $%d", idx))
		args = append(args, f.Status)
		idx++
	}

	return "WHERE " + strings.Join(conds, " AND "), args
}

// ─── Scanners ────────────────────────────────────────────────────────────────

func scanIncident(row rowScanner) (*models.Incident, error) {
	var i models.Incident
	var readingID, acknowledgedBy, resolvedBy pgtype.UUID
	var acknowledgedAt, resolvedAt, deletedAt pgtype.Timestamptz
	var description pgtype.Text

	err := row.Scan(
		&i.ID, &i.MachineID, &readingID, &i.Title, &description,
		&i.Severity, &i.Status, &i.RiskScore,
		&acknowledgedBy, &acknowledgedAt, &resolvedBy, &resolvedAt,
		&deletedAt, &i.CreatedAt, &i.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("incident: scan: %w", err)
	}

	i.ReadingID = nullableUUID(readingID)
	i.AcknowledgedBy = nullableUUID(acknowledgedBy)
	i.AcknowledgedAt = nullableTime(acknowledgedAt)
	i.ResolvedBy = nullableUUID(resolvedBy)
	i.ResolvedAt = nullableTime(resolvedAt)
	i.DeletedAt = nullableTime(deletedAt)
	if description.Valid {
		i.Description = &description.String
	}
	return &i, nil
}

func scanIncidentWithDetails(row rowScanner) (*models.IncidentWithDetails, error) {
	var iwd models.IncidentWithDetails
	var readingID, acknowledgedBy, resolvedBy pgtype.UUID
	var acknowledgedAt, resolvedAt, deletedAt pgtype.Timestamptz
	var description, acknowledgedByName, resolvedByName pgtype.Text

	err := row.Scan(
		&iwd.ID, &iwd.MachineID, &readingID, &iwd.Title, &description,
		&iwd.Severity, &iwd.Status, &iwd.RiskScore,
		&acknowledgedBy, &acknowledgedAt, &resolvedBy, &resolvedAt,
		&deletedAt, &iwd.CreatedAt, &iwd.UpdatedAt,
		&iwd.MachineName, &iwd.MachineCode,
		&acknowledgedByName, &resolvedByName,
	)
	if err != nil {
		return nil, fmt.Errorf("incident: scan details: %w", err)
	}

	iwd.ReadingID = nullableUUID(readingID)
	iwd.AcknowledgedBy = nullableUUID(acknowledgedBy)
	iwd.AcknowledgedAt = nullableTime(acknowledgedAt)
	iwd.ResolvedBy = nullableUUID(resolvedBy)
	iwd.ResolvedAt = nullableTime(resolvedAt)
	iwd.DeletedAt = nullableTime(deletedAt)
	if description.Valid {
		iwd.Description = &description.String
	}
	if acknowledgedByName.Valid {
		iwd.AcknowledgedByName = &acknowledgedByName.String
	}
	if resolvedByName.Valid {
		iwd.ResolvedByName = &resolvedByName.String
	}
	return &iwd, nil
}

// ─── pgtype conversion helpers ───────────────────────────────────────────────

func nullableUUID(u pgtype.UUID) *uuid.UUID {
	if !u.Valid {
		return nil
	}
	id := uuid.UUID(u.Bytes)
	return &id
}

func nullableTime(t pgtype.Timestamptz) *time.Time {
	if !t.Valid {
		return nil
	}
	return &t.Time
}
