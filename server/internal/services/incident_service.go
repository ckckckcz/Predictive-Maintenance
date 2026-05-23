package services

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/greenfields/server/internal/models"
	"github.com/greenfields/server/internal/repository"
	"github.com/greenfields/server/pkg/utils"
)

// IncidentService orchestrates the full incident lifecycle:
type IncidentService struct {
	incidents repository.IncidentRepository
	audits    repository.AuditRepository
	notifier  *NotificationService
}

func NewIncidentService(
	incidents repository.IncidentRepository,
	audits repository.AuditRepository,
	notifier *NotificationService,
) *IncidentService {
	return &IncidentService{
		incidents: incidents,
		audits:    audits,
		notifier:  notifier,
	}
}

// CreateIncident creates a manual incident and records an audit log.
func (s *IncidentService) CreateIncident(
	ctx context.Context,
	req *models.CreateIncidentRequest,
	actorID uuid.UUID,
	actorIP string,
) (*models.Incident, error) {
	incident := &models.Incident{
		MachineID:   req.MachineID,
		ReadingID:   req.ReadingID,
		Title:       req.Title,
		Description: req.Description,
		Severity:    req.Severity,
		Status:      models.StatusOpen,
		RiskScore:   req.RiskScore,
		ImageURL:    req.ImageURL,
	}

	saved, err := s.incidents.Create(ctx, incident)
	if err != nil {
		return nil, fmt.Errorf("incident: create: %w", err)
	}

	newVal := fmt.Sprintf("severity=%s, risk_score=%d", saved.Severity, saved.RiskScore)
	s.writeAudit(ctx, &saved.ID, &actorID, models.ActionIncidentCreated, nil, &newVal, actorIP)

	// Notify all subscribers (async, best-effort)
	go func() {
		payload := &models.NotificationPayload{
			Title: fmt.Sprintf("🚨 Insiden Baru: %s", saved.Severity),
			Body:  saved.Title,
			Data:  map[string]string{"incident_id": saved.ID.String()},
		}
		_ = s.notifier.BroadcastToAll(context.Background(), payload)
	}()

	return saved, nil
}

// ListIncidents returns paginated incidents with optional filters.
func (s *IncidentService) ListIncidents(ctx context.Context, f models.IncidentFilter) ([]*models.IncidentWithDetails, int64, error) {
	return s.incidents.List(ctx, f)
}

// GetIncident returns a single incident with machine and user details.
func (s *IncidentService) GetIncident(ctx context.Context, id uuid.UUID) (*models.IncidentWithDetails, error) {
	inc, err := s.incidents.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return inc, nil
}

// AcknowledgeIncident transitions OPEN → IN_PROGRESS and records the actor.
func (s *IncidentService) AcknowledgeIncident(
	ctx context.Context,
	id, actorID uuid.UUID,
	actorIP string,
) error {
	inc, err := s.incidents.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if inc.Status != models.StatusOpen {
		return fmt.Errorf("%w: only OPEN incidents can be acknowledged", utils.ErrBadRequest)
	}

	if err := s.incidents.Acknowledge(ctx, id, actorID); err != nil {
		return fmt.Errorf("incident: acknowledge: %w", err)
	}

	old := string(models.StatusOpen)
	newV := string(models.StatusInProgress)
	s.writeAudit(ctx, &id, &actorID, models.ActionIncidentAcknowledged, &old, &newV, actorIP)
	return nil
}

// ResolveIncident transitions → RESOLVED and records the actor.
func (s *IncidentService) ResolveIncident(
	ctx context.Context,
	id, actorID uuid.UUID,
	actorIP string,
) error {
	inc, err := s.incidents.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if inc.Status == models.StatusResolved {
		return fmt.Errorf("%w: incident is already resolved", utils.ErrBadRequest)
	}

	if err := s.incidents.Resolve(ctx, id, actorID); err != nil {
		return fmt.Errorf("incident: resolve: %w", err)
	}

	old := string(inc.Status)
	newV := string(models.StatusResolved)
	s.writeAudit(ctx, &id, &actorID, models.ActionIncidentResolved, &old, &newV, actorIP)
	return nil
}

// DeleteIncident soft-deletes an incident (SUPERVISOR only enforced at handler).
func (s *IncidentService) DeleteIncident(
	ctx context.Context,
	id, actorID uuid.UUID,
	actorIP string,
) error {
	if _, err := s.incidents.FindByID(ctx, id); err != nil {
		return err
	}

	if err := s.incidents.SoftDelete(ctx, id); err != nil {
		return fmt.Errorf("incident: delete: %w", err)
	}

	s.writeAudit(ctx, &id, &actorID, models.ActionIncidentDeleted, nil, nil, actorIP)
	return nil
}

// GetStats returns aggregate counts for the dashboard.
func (s *IncidentService) GetStats(ctx context.Context) (*models.IncidentStats, error) {
	return s.incidents.GetStats(ctx)
}

// CreateReply adds a message thread response and optionally updates incident status.
func (s *IncidentService) CreateReply(
	ctx context.Context,
	incidentID uuid.UUID,
	message string,
	actorID uuid.UUID,
	actorIP string,
	newStatus *models.IncidentStatus,
) (*models.IncidentReply, error) {
	inc, err := s.incidents.FindByID(ctx, incidentID)
	if err != nil {
		return nil, err
	}

	reply := &models.IncidentReply{
		IncidentID: incidentID,
		UserID:     actorID,
		Message:    message,
	}

	saved, err := s.incidents.CreateReply(ctx, reply)
	if err != nil {
		return nil, fmt.Errorf("service: reply create: %w", err)
	}

	// Update status if requested and changed
	if newStatus != nil && *newStatus != inc.Status {
		if err := s.incidents.UpdateStatus(ctx, incidentID, *newStatus, actorID); err != nil {
			return nil, fmt.Errorf("service: update status: %w", err)
		}

		oldVal := string(inc.Status)
		newVal := string(*newStatus)
		var auditAction models.AuditAction
		if *newStatus == models.StatusInProgress {
			auditAction = models.ActionIncidentAcknowledged
		} else if *newStatus == models.StatusResolved {
			auditAction = models.ActionIncidentResolved
		} else {
			auditAction = models.ActionIncidentAcknowledged
		}
		s.writeAudit(ctx, &incidentID, &actorID, auditAction, &oldVal, &newVal, actorIP)

		// Broadcast status change notify (async)
		go func() {
			payload := &models.NotificationPayload{
				Title: fmt.Sprintf("⚠️ Status Insiden Diperbarui: %s", *newStatus),
				Body:  fmt.Sprintf("Insiden \"%s\" diubah statusnya menjadi %s", inc.Title, *newStatus),
				Data:  map[string]string{"incident_id": incidentID.String()},
			}
			_ = s.notifier.BroadcastToAll(context.Background(), payload)
		}()
	} else {
		// Broadcast reply notification to all subscribers
		go func() {
			payload := &models.NotificationPayload{
				Title: fmt.Sprintf("💬 Balasan Baru pada Insiden"),
				Body:  fmt.Sprintf("%s: %s", saved.UserName, saved.Message),
				Data:  map[string]string{"incident_id": incidentID.String()},
			}
			_ = s.notifier.BroadcastToAll(context.Background(), payload)
		}()
	}

	return saved, nil
}

// ListReplies returns all replies in order of creation.
func (s *IncidentService) ListReplies(ctx context.Context, incidentID uuid.UUID) ([]*models.IncidentReply, error) {
	return s.incidents.ListReplies(ctx, incidentID)
}

// ─── Private helpers ─────────────────────────────────────────────────────────

// writeAudit persists an audit log entry, logging on failure rather than propagating.
func (s *IncidentService) writeAudit(
	ctx context.Context,
	incidentID, userID *uuid.UUID,
	action models.AuditAction,
	oldVal, newVal *string,
	ip string,
) {
	log := &models.AuditLog{
		IncidentID: incidentID,
		UserID:     userID,
		Action:     action,
		OldValue:   oldVal,
		NewValue:   newVal,
		IPAddress:  &ip,
	}
	if _, err := s.audits.Create(ctx, log); err != nil {
		fmt.Printf("incident: warning: audit log failed: %v\n", err)
	}
}
