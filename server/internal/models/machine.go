package models

import (
	"time"

	"github.com/google/uuid"
)

// ─── Domain types ────────────────────────────────────────────────────────────

type MachineStatus string

const (
	MachineStatusActive      MachineStatus = "ACTIVE"
	MachineStatusInactive    MachineStatus = "INACTIVE"
	MachineStatusMaintenance MachineStatus = "MAINTENANCE"
)

// Machine represents a record in the machines table.
type Machine struct {
	ID        uuid.UUID     `json:"id"`
	Name      string        `json:"name"`
	Code      string        `json:"code"`
	Type      string        `json:"type"`
	Location  *string       `json:"location"`
	Status    MachineStatus `json:"status"`
	CreatedAt time.Time     `json:"created_at"`
}

// ─── Request DTOs ─────────────────────────────────────────────────────────────

type CreateMachineRequest struct {
	Name     string  `json:"name"     binding:"required,min=2,max=100"`
	Code     string  `json:"code"     binding:"required,min=2,max=50"`
	Type     string  `json:"type"     binding:"required,min=2,max=50"`
	Location *string `json:"location"`
}

type UpdateMachineStatusRequest struct {
	Status MachineStatus `json:"status" binding:"required,oneof=ACTIVE INACTIVE MAINTENANCE"`
}

type UpdateMachineRequest struct {
	Name     string  `json:"name"     binding:"required,min=2,max=100"`
	Code     string  `json:"code"     binding:"required,min=2,max=50"`
	Type     string  `json:"type"     binding:"required,min=2,max=50"`
	Location *string `json:"location"`
}

