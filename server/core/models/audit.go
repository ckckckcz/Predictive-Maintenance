package models

import (
	"time"

	"github.com/google/uuid"
)

// AuditAction enumerates all tracked actions in the system.
type AuditAction string

const (
	ActionIncidentCreated      AuditAction = "INCIDENT_CREATED"
	ActionStatusUpdated        AuditAction = "STATUS_UPDATED"
	ActionIncidentAcknowledged AuditAction = "INCIDENT_ACKNOWLEDGED"
	ActionIncidentResolved     AuditAction = "INCIDENT_RESOLVED"
	ActionIncidentDeleted      AuditAction = "INCIDENT_DELETED"
	ActionUserCreated          AuditAction = "USER_CREATED"
	ActionUserUpdated          AuditAction = "USER_UPDATED"
	ActionUserDeactivated      AuditAction = "USER_DEACTIVATED"
)

// AuditLog represents a record in the audit_logs table.
type AuditLog struct {
	ID         uuid.UUID   `json:"id"`
	IncidentID *uuid.UUID  `json:"incident_id"`
	UserID     *uuid.UUID  `json:"user_id"`
	Action     AuditAction `json:"action"`
	OldValue   *string     `json:"old_value"`
	NewValue   *string     `json:"new_value"`
	IPAddress  *string     `json:"ip_address"`
	CreatedAt  time.Time   `json:"created_at"`
}

// AuditLogWithActor enriches AuditLog with the actor's name.
type AuditLogWithActor struct {
	AuditLog
	ActorName *string `json:"actor_name"`
}

// AuditFilter holds optional filters for listing audit logs.
type AuditFilter struct {
	IncidentID string
	UserID     string
	Page       int
	Limit      int
	Offset     int
}
