package models

import (
	"time"

	"github.com/google/uuid"
)

// ─── Domain types ────────────────────────────────────────────────────────────

type IncidentSeverity string
type IncidentStatus string

const (
	SeverityLow      IncidentSeverity = "LOW"
	SeverityMedium   IncidentSeverity = "MEDIUM"
	SeverityHigh     IncidentSeverity = "HIGH"
	SeverityCritical IncidentSeverity = "CRITICAL"

	StatusOpen       IncidentStatus = "OPEN"
	StatusInProgress IncidentStatus = "IN_PROGRESS"
	StatusResolved   IncidentStatus = "RESOLVED"
)

// Incident represents a record in the incidents table.
type Incident struct {
	ID             uuid.UUID        `json:"id"`
	MachineID      uuid.UUID        `json:"machine_id"`
	ReadingID      *uuid.UUID       `json:"reading_id"`
	Title          string           `json:"title"`
	Description    *string          `json:"description"`
	Severity       IncidentSeverity `json:"severity"`
	Status         IncidentStatus   `json:"status"`
	RiskScore      int              `json:"risk_score"`
	AcknowledgedBy *uuid.UUID       `json:"acknowledged_by"`
	AcknowledgedAt *time.Time       `json:"acknowledged_at"`
	ResolvedBy     *uuid.UUID       `json:"resolved_by"`
	ResolvedAt     *time.Time       `json:"resolved_at"`
	DeletedAt      *time.Time       `json:"deleted_at,omitempty"`
	CreatedAt      time.Time        `json:"created_at"`
	UpdatedAt      time.Time        `json:"updated_at"`
}

// IncidentWithDetails enriches an Incident with joined machine and user names.
type IncidentWithDetails struct {
	Incident
	MachineName          string  `json:"machine_name"`
	MachineCode          string  `json:"machine_code"`
	AcknowledgedByName   *string `json:"acknowledged_by_name"`
	ResolvedByName       *string `json:"resolved_by_name"`
}

// IncidentStats aggregates incident counts for the dashboard.
type IncidentStats struct {
	Total      int64 `json:"total"`
	Open       int64 `json:"open"`
	InProgress int64 `json:"in_progress"`
	Resolved   int64 `json:"resolved"`
	Critical   int64 `json:"critical"`
	High       int64 `json:"high"`
	Medium     int64 `json:"medium"`
	Low        int64 `json:"low"`
}

// ─── Request / Response DTOs ─────────────────────────────────────────────────

type CreateIncidentRequest struct {
	MachineID   uuid.UUID        `json:"machine_id"  binding:"required"`
	ReadingID   *uuid.UUID       `json:"reading_id"`
	Title       string           `json:"title"       binding:"required,min=5,max=200"`
	Description *string          `json:"description"`
	Severity    IncidentSeverity `json:"severity"    binding:"required,oneof=LOW MEDIUM HIGH CRITICAL"`
	RiskScore   int              `json:"risk_score"  binding:"min=0,max=100"`
}

type IncidentFilter struct {
	MachineID string
	Severity  string
	Status    string
	Page      int
	Limit     int
	Offset    int
}
