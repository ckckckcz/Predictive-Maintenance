package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/greenfields/server/core/models"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ─── Interface ───────────────────────────────────────────────────────────────

type AuditRepository interface {
	Create(ctx context.Context, log *models.AuditLog) (*models.AuditLog, error)
	ListByIncident(ctx context.Context, incidentID uuid.UUID, page, limit int) ([]*models.AuditLogWithActor, int64, error)
	ListAll(ctx context.Context, f models.AuditFilter) ([]*models.AuditLogWithActor, int64, error)
}

// ─── Implementation ──────────────────────────────────────────────────────────

type auditRepository struct {
	pool *pgxpool.Pool
}

func NewAuditRepository(pool *pgxpool.Pool) AuditRepository {
	return &auditRepository{pool: pool}
}

// ─── Queries ─────────────────────────────────────────────────────────────────

const (
	queryCreateAuditLog = `
		INSERT INTO audit_logs (incident_id, user_id, action, old_value, new_value, ip_address)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, incident_id, user_id, action, old_value, new_value, ip_address, created_at`

	queryCountAuditByIncident = `SELECT COUNT(*) FROM audit_logs WHERE incident_id = $1`

	queryListAuditByIncident = `
		SELECT al.id, al.incident_id, al.user_id, al.action,
		       al.old_value, al.new_value, al.ip_address, al.created_at,
		       u.name AS actor_name
		FROM audit_logs al
		LEFT JOIN users u ON al.user_id = u.id
		WHERE al.incident_id = $1
		ORDER BY al.created_at DESC
		LIMIT $2 OFFSET $3`

	queryCountAuditAll = `SELECT COUNT(*) FROM audit_logs`

	queryListAuditAll = `
		SELECT al.id, al.incident_id, al.user_id, al.action,
		       al.old_value, al.new_value, al.ip_address, al.created_at,
		       u.name AS actor_name
		FROM audit_logs al
		LEFT JOIN users u ON al.user_id = u.id
		ORDER BY al.created_at DESC
		LIMIT $1 OFFSET $2`
)

// ─── Methods ─────────────────────────────────────────────────────────────────

func (r *auditRepository) Create(ctx context.Context, log *models.AuditLog) (*models.AuditLog, error) {
	row := r.pool.QueryRow(ctx, queryCreateAuditLog,
		log.IncidentID, log.UserID, log.Action,
		log.OldValue, log.NewValue, log.IPAddress,
	)
	return scanAuditLog(row)
}

func (r *auditRepository) ListByIncident(ctx context.Context, incidentID uuid.UUID, page, limit int) ([]*models.AuditLogWithActor, int64, error) {
	offset := (page - 1) * limit

	var total int64
	if err := r.pool.QueryRow(ctx, queryCountAuditByIncident, incidentID).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("audit: count by incident: %w", err)
	}

	rows, err := r.pool.Query(ctx, queryListAuditByIncident, incidentID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("audit: list by incident: %w", err)
	}
	defer rows.Close()

	return scanAuditRows(rows, total)
}

func (r *auditRepository) ListAll(ctx context.Context, f models.AuditFilter) ([]*models.AuditLogWithActor, int64, error) {
	var total int64
	if err := r.pool.QueryRow(ctx, queryCountAuditAll).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("audit: count all: %w", err)
	}

	rows, err := r.pool.Query(ctx, queryListAuditAll, f.Limit, f.Offset)
	if err != nil {
		return nil, 0, fmt.Errorf("audit: list all: %w", err)
	}
	defer rows.Close()

	return scanAuditRows(rows, total)
}

// ─── Scanners ────────────────────────────────────────────────────────────────

func scanAuditLog(row rowScanner) (*models.AuditLog, error) {
	var al models.AuditLog
	var incidentID, userID pgtype.UUID
	var oldVal, newVal, ipAddr pgtype.Text

	err := row.Scan(
		&al.ID, &incidentID, &userID, &al.Action,
		&oldVal, &newVal, &ipAddr, &al.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("audit: scan: %w", err)
	}
	al.IncidentID = nullableUUID(incidentID)
	al.UserID = nullableUUID(userID)
	if oldVal.Valid {
		al.OldValue = &oldVal.String
	}
	if newVal.Valid {
		al.NewValue = &newVal.String
	}
	if ipAddr.Valid {
		al.IPAddress = &ipAddr.String
	}
	return &al, nil
}

func scanAuditWithActor(row rowScanner) (*models.AuditLogWithActor, error) {
	var ala models.AuditLogWithActor
	var incidentID, userID pgtype.UUID
	var oldVal, newVal, ipAddr, actorName pgtype.Text

	err := row.Scan(
		&ala.ID, &incidentID, &userID, &ala.Action,
		&oldVal, &newVal, &ipAddr, &ala.CreatedAt,
		&actorName,
	)
	if err != nil {
		return nil, fmt.Errorf("audit: scan with actor: %w", err)
	}
	ala.IncidentID = nullableUUID(incidentID)
	ala.UserID = nullableUUID(userID)
	if oldVal.Valid {
		ala.OldValue = &oldVal.String
	}
	if newVal.Valid {
		ala.NewValue = &newVal.String
	}
	if ipAddr.Valid {
		ala.IPAddress = &ipAddr.String
	}
	if actorName.Valid {
		ala.ActorName = &actorName.String
	}
	return &ala, nil
}

func scanAuditRows(rows interface {
	Next() bool
	Err() error
}, total int64) ([]*models.AuditLogWithActor, int64, error) {
	type scanner interface {
		Scan(dest ...any) error
	}

	pgRows, ok := rows.(interface {
		Next() bool
		Err() error
		Scan(dest ...any) error
	})
	if !ok {
		return nil, 0, fmt.Errorf("audit: unexpected rows type")
	}

	var logs []*models.AuditLogWithActor
	for pgRows.Next() {
		al, err := scanAuditWithActor(pgRows)
		if err != nil {
			return nil, 0, err
		}
		logs = append(logs, al)
	}
	return logs, total, pgRows.Err()
}
