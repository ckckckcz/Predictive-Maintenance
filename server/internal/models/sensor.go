package models

import (
	"time"

	"github.com/google/uuid"
)

// Nullable sensor fields use pointer types so JSON outputs null when absent.
type SensorReading struct {
	ID          uuid.UUID `json:"id"`
	MachineID   uuid.UUID `json:"machine_id"`
	Temperature *float64  `json:"temperature"` // °C
	Vibration   *float64  `json:"vibration"`   // Hz
	Pressure    *float64  `json:"pressure"`    // Bar
	RPM         *int      `json:"rpm"`
	Efficiency  *float64  `json:"efficiency"` // %
	IsAnomaly   bool      `json:"is_anomaly"`
	ReadAt      time.Time `json:"read_at"`
}

// ─── Anomaly detection thresholds ────────────────────────────────────────────

const (
	TempMax       float64 = 90.0  // °C
	TempMin       float64 = -10.0 // °C
	VibrationMax  float64 = 50.0  // Hz
	PressureMax   float64 = 10.0  // Bar
	PressureMin   float64 = 0.0   // Bar
	RPMMax        int     = 5000
	RPMMin        int     = 0
	EfficiencyMin float64 = 20.0 // %
)

// ─── Request / Response DTOs ─────────────────────────────────────────────────

type CreateSensorReadingRequest struct {
	MachineID   uuid.UUID `json:"machine_id"   binding:"required"`
	Temperature *float64  `json:"temperature"`
	Vibration   *float64  `json:"vibration"`
	Pressure    *float64  `json:"pressure"`
	RPM         *int      `json:"rpm"`
	Efficiency  *float64  `json:"efficiency"`
}

type SensorIngestionResult struct {
	Reading  *SensorReading `json:"reading"`
	Incident *Incident      `json:"incident,omitempty"`
}
