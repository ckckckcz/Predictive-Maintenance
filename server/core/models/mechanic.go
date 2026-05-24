package models

import (
	"time"

	"github.com/google/uuid"
)

// Mechanic represents a record in the mechanics table.
type Mechanic struct {
	ID             uuid.UUID `json:"id"`
	Name           string    `json:"name"`
	Email          string    `json:"email"`
	Phone          string    `json:"phone"`
	Specialization string    `json:"specialization"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// CreateMechanicRequest is the DTO payload for creating a new mechanic.
type CreateMechanicRequest struct {
	Name           string `json:"name"           binding:"required,min=2,max=100"`
	Email          string `json:"email"          binding:"required,email,max=100"`
	Phone          string `json:"phone"          binding:"required,min=5,max=20"`
	Specialization string `json:"specialization" binding:"required,min=2,max=100"`
}

// UpdateMechanicRequest is the DTO payload for updating an existing mechanic.
type UpdateMechanicRequest struct {
	Name           string `json:"name"           binding:"required,min=2,max=100"`
	Email          string `json:"email"          binding:"required,email,max=100"`
	Phone          string `json:"phone"          binding:"required,min=5,max=20"`
	Specialization string `json:"specialization" binding:"required,min=2,max=100"`
}
