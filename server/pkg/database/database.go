package database

import (
	"context"
	"fmt"

	"github.com/greenfields/server/pkg/config"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// NewPool creates a *pgxpool.Pool configured for Supabase.
//
// Supabase Transaction Pooler (port 6543) runs PgBouncer in transaction mode,
// which does NOT support prepared statements. We explicitly set
// QueryExecModeSimpleProtocol so every query uses the simple wire protocol —
// compatible with both the transaction pooler AND the session pooler.
func NewPool(ctx context.Context, cfg config.DatabaseConfig) (*pgxpool.Pool, error) {
	poolCfg, err := pgxpool.ParseConfig(cfg.URL)
	if err != nil {
		return nil, fmt.Errorf("database: parse DSN: %w", err)
	}

	// ── Supabase compatibility: disable extended query protocol ──────────────
	// This is required when using the Transaction Pooler (port 6543).
	poolCfg.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol

	// ── Pool sizing ──────────────────────────────────────────────────────────
	poolCfg.MaxConns = cfg.MaxConns
	poolCfg.MinConns = cfg.MinConns
	poolCfg.MaxConnLifetime = cfg.MaxConnLifetime
	poolCfg.MaxConnIdleTime = cfg.MaxConnIdleTime

	// ── Create pool ──────────────────────────────────────────────────────────
	pool, err := pgxpool.NewWithConfig(ctx, poolCfg)
	if err != nil {
		return nil, fmt.Errorf("database: create pool: %w", err)
	}

	// ── Verify connectivity ──────────────────────────────────────────────────
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("database: ping failed (check DATABASE_URL and Supabase network access): %w", err)
	}

	return pool, nil
}
