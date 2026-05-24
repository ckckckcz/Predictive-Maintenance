package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/greenfields/server/core/models"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ─── Interface ───────────────────────────────────────────────────────────────

type AIAnalysisRepository interface {
	Save(ctx context.Context, a *models.AIAnalysis) (*models.AIAnalysis, error)
	GetLatestByMachine(ctx context.Context, machineID uuid.UUID) (*models.AIAnalysis, error)
	GetLatestByMachineIfFresh(ctx context.Context, machineID uuid.UUID, maxAge time.Duration) (*models.AIAnalysis, error)
}

// ─── Implementation ──────────────────────────────────────────────────────────

type aiAnalysisRepository struct {
	pool *pgxpool.Pool
}

func NewAIAnalysisRepository(pool *pgxpool.Pool) AIAnalysisRepository {
	return &aiAnalysisRepository{pool: pool}
}

// ─── Queries ─────────────────────────────────────────────────────────────────

const (
	querySaveAIAnalysis = `
		INSERT INTO ai_analyses (
			machine_id, risk_level, risk_score, health_percentage,
			trend, prediction, recommendation, estimated_failure_hours, urgent, analyzed_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
		RETURNING id, machine_id, risk_level, risk_score, health_percentage,
		          trend, prediction, recommendation, estimated_failure_hours, urgent, analyzed_at`

	queryGetLatestAIAnalysis = `
		SELECT id, machine_id, risk_level, risk_score, health_percentage,
		       trend, prediction, recommendation, estimated_failure_hours, urgent, analyzed_at
		FROM ai_analyses
		WHERE machine_id = $1
		ORDER BY analyzed_at DESC
		LIMIT 1`
)

// ─── Methods ─────────────────────────────────────────────────────────────────

func (r *aiAnalysisRepository) Save(ctx context.Context, a *models.AIAnalysis) (*models.AIAnalysis, error) {
	row := r.pool.QueryRow(ctx, querySaveAIAnalysis,
		a.MachineID,
		a.RiskLevel,
		a.RiskScore,
		a.HealthPercentage,
		a.Trend,
		a.Prediction,
		a.Recommendation,
		a.EstimatedFailureHours,
		a.Urgent,
	)
	return scanAIAnalysis(row)
}

func (r *aiAnalysisRepository) GetLatestByMachine(ctx context.Context, machineID uuid.UUID) (*models.AIAnalysis, error) {
	row := r.pool.QueryRow(ctx, queryGetLatestAIAnalysis, machineID)
	a, err := scanAIAnalysis(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil // no analysis exists yet — not an error
		}
		return nil, err
	}
	return a, nil
}

// GetLatestByMachineIfFresh returns the cached analysis only if it was produced within maxAge.
// Returns (nil, nil) when no fresh analysis exists.
func (r *aiAnalysisRepository) GetLatestByMachineIfFresh(ctx context.Context, machineID uuid.UUID, maxAge time.Duration) (*models.AIAnalysis, error) {
	a, err := r.GetLatestByMachine(ctx, machineID)
	if err != nil || a == nil {
		return nil, err
	}
	if time.Since(a.AnalyzedAt) > maxAge {
		return nil, nil // stale — caller should re-analyse
	}
	return a, nil
}

// ─── Scanner ─────────────────────────────────────────────────────────────────

func scanAIAnalysis(row rowScanner) (*models.AIAnalysis, error) {
	var a models.AIAnalysis
	var failureHours pgtype.Int4

	err := row.Scan(
		&a.ID, &a.MachineID,
		&a.RiskLevel, &a.RiskScore, &a.HealthPercentage,
		&a.Trend, &a.Prediction, &a.Recommendation,
		&failureHours, &a.Urgent, &a.AnalyzedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("ai_analysis: scan: %w", err)
	}
	if failureHours.Valid {
		v := int(failureHours.Int32)
		a.EstimatedFailureHours = &v
	}
	return &a, nil
}
