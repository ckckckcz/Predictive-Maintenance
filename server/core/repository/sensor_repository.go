package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/greenfields/server/core/models"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ─── Interface ───────────────────────────────────────────────────────────────

type SensorRepository interface {
	Create(ctx context.Context, r *models.SensorReading) (*models.SensorReading, error)
	ListByMachine(ctx context.Context, machineID uuid.UUID, limit int) ([]*models.SensorReading, error)
	GetLatestByMachine(ctx context.Context, machineID uuid.UUID) (*models.SensorReading, error)
	GetAnomalies(ctx context.Context, machineID uuid.UUID, since time.Time) ([]*models.SensorReading, error)
}

// ─── Implementation ──────────────────────────────────────────────────────────

type sensorRepository struct {
	pool *pgxpool.Pool
}

func NewSensorRepository(pool *pgxpool.Pool) SensorRepository {
	return &sensorRepository{pool: pool}
}

// ─── Queries ─────────────────────────────────────────────────────────────────

const (
	queryCreateSensorReading = `
		INSERT INTO sensor_readings (machine_id, temperature, vibration, pressure, rpm, efficiency, is_anomaly)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, machine_id, temperature, vibration, pressure, rpm, efficiency, is_anomaly, read_at`

	queryListSensorByMachine = `
		SELECT id, machine_id, temperature, vibration, pressure, rpm, efficiency, is_anomaly, read_at
		FROM sensor_readings
		WHERE machine_id = $1
		ORDER BY read_at DESC
		LIMIT $2`

	queryGetLatestSensor = `
		SELECT id, machine_id, temperature, vibration, pressure, rpm, efficiency, is_anomaly, read_at
		FROM sensor_readings
		WHERE machine_id = $1
		ORDER BY read_at DESC
		LIMIT 1`

	queryGetSensorAnomalies = `
		SELECT id, machine_id, temperature, vibration, pressure, rpm, efficiency, is_anomaly, read_at
		FROM sensor_readings
		WHERE machine_id = $1 AND is_anomaly = true AND read_at >= $2
		ORDER BY read_at DESC`
)

// ─── Methods ─────────────────────────────────────────────────────────────────

func (r *sensorRepository) Create(ctx context.Context, reading *models.SensorReading) (*models.SensorReading, error) {
	row := r.pool.QueryRow(ctx, queryCreateSensorReading,
		reading.MachineID,
		reading.Temperature,
		reading.Vibration,
		reading.Pressure,
		reading.RPM,
		reading.Efficiency,
		reading.IsAnomaly,
	)
	return scanSensorReading(row)
}

func (r *sensorRepository) ListByMachine(ctx context.Context, machineID uuid.UUID, limit int) ([]*models.SensorReading, error) {
	rows, err := r.pool.Query(ctx, queryListSensorByMachine, machineID, limit)
	if err != nil {
		return nil, fmt.Errorf("sensor: list: %w", err)
	}
	defer rows.Close()

	var readings []*models.SensorReading
	for rows.Next() {
		sr, err := scanSensorReading(rows)
		if err != nil {
			return nil, err
		}
		readings = append(readings, sr)
	}
	return readings, rows.Err()
}

func (r *sensorRepository) GetLatestByMachine(ctx context.Context, machineID uuid.UUID) (*models.SensorReading, error) {
	row := r.pool.QueryRow(ctx, queryGetLatestSensor, machineID)
	return scanSensorReading(row)
}

func (r *sensorRepository) GetAnomalies(ctx context.Context, machineID uuid.UUID, since time.Time) ([]*models.SensorReading, error) {
	rows, err := r.pool.Query(ctx, queryGetSensorAnomalies, machineID, since)
	if err != nil {
		return nil, fmt.Errorf("sensor: anomalies: %w", err)
	}
	defer rows.Close()

	var readings []*models.SensorReading
	for rows.Next() {
		sr, err := scanSensorReading(rows)
		if err != nil {
			return nil, err
		}
		readings = append(readings, sr)
	}
	return readings, rows.Err()
}

// ─── Scanner ─────────────────────────────────────────────────────────────────

func scanSensorReading(row rowScanner) (*models.SensorReading, error) {
	var sr models.SensorReading
	var temp, vib, press, eff pgtype.Float8
	var rpm pgtype.Int4

	err := row.Scan(
		&sr.ID, &sr.MachineID,
		&temp, &vib, &press, &rpm, &eff,
		&sr.IsAnomaly, &sr.ReadAt,
	)
	if err != nil {
		return nil, fmt.Errorf("sensor: scan: %w", err)
	}

	if temp.Valid {
		sr.Temperature = &temp.Float64
	}
	if vib.Valid {
		sr.Vibration = &vib.Float64
	}
	if press.Valid {
		sr.Pressure = &press.Float64
	}
	if rpm.Valid {
		v := int(rpm.Int32)
		sr.RPM = &v
	}
	if eff.Valid {
		sr.Efficiency = &eff.Float64
	}
	return &sr, nil
}
