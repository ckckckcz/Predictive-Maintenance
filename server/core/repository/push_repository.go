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

type PushRepository interface {
	UpsertWeb(ctx context.Context, userID uuid.UUID, req *models.SubscribeWebRequest) (*models.PushSubscription, error)
	UpsertExpo(ctx context.Context, userID uuid.UUID, req *models.SubscribeExpoRequest) (*models.PushSubscription, error)
	FindByUserID(ctx context.Context, userID uuid.UUID) ([]*models.PushSubscription, error)
	FindAllByRole(ctx context.Context, role models.UserRole) ([]*models.PushSubscription, error)
	Delete(ctx context.Context, id, userID uuid.UUID) error
}

// ─── Implementation ──────────────────────────────────────────────────────────

type pushRepository struct {
	pool *pgxpool.Pool
}

func NewPushRepository(pool *pgxpool.Pool) PushRepository {
	return &pushRepository{pool: pool}
}

// ─── Queries ─────────────────────────────────────────────────────────────────

const (
	// Upsert web push: one subscription per (user_id, device_type='WEB')
	queryUpsertWebPush = `
		INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth_key, device_type)
		VALUES ($1, $2, $3, $4, 'WEB')
		ON CONFLICT (user_id, device_type)
		DO UPDATE SET endpoint=$2, p256dh=$3, auth_key=$4
		RETURNING id, user_id, endpoint, p256dh, auth_key, expo_token, device_type, created_at`

	// Upsert expo push: one subscription per (user_id, device_type='MOBILE')
	queryUpsertExpoPush = `
		INSERT INTO push_subscriptions (user_id, expo_token, device_type)
		VALUES ($1, $2, 'MOBILE')
		ON CONFLICT (user_id, device_type)
		DO UPDATE SET expo_token=$2
		RETURNING id, user_id, endpoint, p256dh, auth_key, expo_token, device_type, created_at`

	queryFindPushByUserID = `
		SELECT id, user_id, endpoint, p256dh, auth_key, expo_token, device_type, created_at
		FROM push_subscriptions WHERE user_id = $1`

	// Find all subscriptions for users with a specific role (JOIN to users)
	queryFindPushByRole = `
		SELECT ps.id, ps.user_id, ps.endpoint, ps.p256dh, ps.auth_key, ps.expo_token, ps.device_type, ps.created_at
		FROM push_subscriptions ps
		JOIN users u ON ps.user_id = u.id
		WHERE u.role = $1 AND u.is_active = true`

	queryDeletePush = `DELETE FROM push_subscriptions WHERE id=$1 AND user_id=$2`
)

// ─── Methods ─────────────────────────────────────────────────────────────────

func (r *pushRepository) UpsertWeb(ctx context.Context, userID uuid.UUID, req *models.SubscribeWebRequest) (*models.PushSubscription, error) {
	row := r.pool.QueryRow(ctx, queryUpsertWebPush,
		userID, req.Endpoint, req.P256dh, req.AuthKey,
	)
	return scanPushSubscription(row)
}

func (r *pushRepository) UpsertExpo(ctx context.Context, userID uuid.UUID, req *models.SubscribeExpoRequest) (*models.PushSubscription, error) {
	row := r.pool.QueryRow(ctx, queryUpsertExpoPush, userID, req.ExpoToken)
	return scanPushSubscription(row)
}

func (r *pushRepository) FindByUserID(ctx context.Context, userID uuid.UUID) ([]*models.PushSubscription, error) {
	rows, err := r.pool.Query(ctx, queryFindPushByUserID, userID)
	if err != nil {
		return nil, fmt.Errorf("push: find by user: %w", err)
	}
	defer rows.Close()
	return scanPushRows(rows)
}

func (r *pushRepository) FindAllByRole(ctx context.Context, role models.UserRole) ([]*models.PushSubscription, error) {
	rows, err := r.pool.Query(ctx, queryFindPushByRole, string(role))
	if err != nil {
		return nil, fmt.Errorf("push: find by role: %w", err)
	}
	defer rows.Close()
	return scanPushRows(rows)
}

func (r *pushRepository) Delete(ctx context.Context, id, userID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, queryDeletePush, id, userID)
	return err
}

// ─── Scanners ────────────────────────────────────────────────────────────────

func scanPushSubscription(row rowScanner) (*models.PushSubscription, error) {
	var ps models.PushSubscription
	var endpoint, p256dh, authKey, expoToken pgtype.Text

	err := row.Scan(
		&ps.ID, &ps.UserID,
		&endpoint, &p256dh, &authKey, &expoToken,
		&ps.DeviceType, &ps.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("push: scan: %w", err)
	}
	if endpoint.Valid {
		ps.Endpoint = &endpoint.String
	}
	if p256dh.Valid {
		ps.P256dh = &p256dh.String
	}
	if authKey.Valid {
		ps.AuthKey = &authKey.String
	}
	if expoToken.Valid {
		ps.ExpoToken = &expoToken.String
	}
	return &ps, nil
}

func scanPushRows(rows interface {
	Next() bool
	Scan(dest ...any) error
	Err() error
}) ([]*models.PushSubscription, error) {
	var subs []*models.PushSubscription
	for rows.Next() {
		sub, err := scanPushSubscription(rows)
		if err != nil {
			return nil, err
		}
		subs = append(subs, sub)
	}
	return subs, rows.Err()
}
