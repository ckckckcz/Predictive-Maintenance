package services

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/greenfields/server/internal/models"
	"github.com/greenfields/server/internal/repository"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SensorService struct {
	pool      *pgxpool.Pool
	sensors   repository.SensorRepository
	machines  repository.MachineRepository
	incidents repository.IncidentRepository
	audits    repository.AuditRepository
	notifier  *NotificationService
}

func NewSensorService(
	pool *pgxpool.Pool,
	sensors repository.SensorRepository,
	machines repository.MachineRepository,
	incidents repository.IncidentRepository,
	audits repository.AuditRepository,
	notifier *NotificationService,
) *SensorService {
	return &SensorService{
		pool:      pool,
		sensors:   sensors,
		machines:  machines,
		incidents: incidents,
		audits:    audits,
		notifier:  notifier,
	}
}

// IngestReading persists a sensor reading, detects anomalies, and auto-creates
// an Incident with audit trail and push notification when an anomaly is found.
func (s *SensorService) IngestReading(ctx context.Context, req *models.CreateSensorReadingRequest) (*models.SensorIngestionResult, error) {
	machine, err := s.machines.FindByID(ctx, req.MachineID)
	if err != nil {
		return nil, fmt.Errorf("sensor: machine not found: %w", err)
	}

	anomaly, anomalyReasons, severity := detectAnomaly(machine.Code, req)
	reading := &models.SensorReading{
		MachineID:   req.MachineID,
		Temperature: req.Temperature,
		Vibration:   req.Vibration,
		Pressure:    req.Pressure,
		RPM:         req.RPM,
		Efficiency:  req.Efficiency,
		IsAnomaly:   anomaly,
	}

	saved, err := s.sensors.Create(ctx, reading)
	if err != nil {
		return nil, fmt.Errorf("sensor: save reading: %w", err)
	}

	result := &models.SensorIngestionResult{Reading: saved}

	if anomaly {
		incident, err := s.createAnomalyIncident(ctx, saved, machine, anomalyReasons, severity)
		if err != nil {
			fmt.Printf("sensor: warning: failed to create anomaly incident: %v\n", err)
		} else {
			result.Incident = incident
		}
	}

	return result, nil
}

func (s *SensorService) GetLatestReading(ctx context.Context, machineID uuid.UUID) (*models.SensorReading, error) {
	return s.sensors.GetLatestByMachine(ctx, machineID)
}

func (s *SensorService) GetHistory(ctx context.Context, machineID uuid.UUID, limit int) ([]*models.SensorReading, error) {
	if limit <= 0 || limit > 500 {
		limit = 50
	}
	return s.sensors.ListByMachine(ctx, machineID, limit)
}

// CalculateRiskScore calculates the incident risk score based on severity base score and modifiers.
func (s *SensorService) CalculateRiskScore(ctx context.Context, machineID uuid.UUID, severity models.IncidentSeverity, createdAt time.Time, status models.IncidentStatus) (int, error) {
	var baseScore int
	switch severity {
	case models.SeverityCritical:
		baseScore = 90
	case models.SeverityHigh:
		baseScore = 60
	case models.SeverityMedium:
		baseScore = 30
	case models.SeverityLow:
		baseScore = 10
	default:
		baseScore = 10
	}

	// Modifier 1: +10 if unhandled (OPEN) > 2 hours
	var openModifier int
	if status == models.StatusOpen && time.Since(createdAt) > 2*time.Hour {
		openModifier = 10
	}

	// Modifier 2: +10 if same area incident >= 3 in a week
	var areaModifier int
	var location string
	err := s.pool.QueryRow(ctx, "SELECT location FROM machines WHERE id = $1", machineID).Scan(&location)
	if err == nil && location != "" {
		var count int
		err = s.pool.QueryRow(ctx, `
			SELECT COUNT(*)
			FROM incidents i
			JOIN machines m ON i.machine_id = m.id
			WHERE m.location = $1
			  AND i.created_at >= $2 - INTERVAL '7 days'
			  AND i.created_at <= $2
			  AND i.deleted_at IS NULL
		`, location, createdAt).Scan(&count)
		if err == nil && count >= 3 {
			areaModifier = 10
		}
	}

	// Modifier 3: +15 if severity escalation from previous incident
	var escalationModifier int
	var prevSeverity string
	err = s.pool.QueryRow(ctx, `
		SELECT severity
		FROM incidents
		WHERE machine_id = $1
		  AND created_at < $2
		  AND deleted_at IS NULL
		ORDER BY created_at DESC
		LIMIT 1
	`, machineID, createdAt).Scan(&prevSeverity)
	if err == nil && prevSeverity != "" {
		severityLevels := map[models.IncidentSeverity]int{
			models.SeverityLow:      1,
			models.SeverityMedium:   2,
			models.SeverityHigh:     3,
			models.SeverityCritical: 4,
		}
		if severityLevels[severity] > severityLevels[models.IncidentSeverity(prevSeverity)] {
			escalationModifier = 15
		}
	}

	total := baseScore + openModifier + areaModifier + escalationModifier
	if total > 100 {
		total = 100
	}
	return total, nil
}

// detectAnomaly implements machine-specific thresholds & rules.
func detectAnomaly(machineCode string, req *models.CreateSensorReadingRequest) (bool, []string, models.IncidentSeverity) {
	var reasons []string
	severity := models.SeverityLow

	switch machineCode {
	case "PST-001": // Mesin Pasteurisasi #1: suhu (72-75°C normal)
		if req.Temperature != nil {
			t := *req.Temperature
			if t < 72.0 || t > 75.0 {
				reasons = append(reasons, fmt.Sprintf("suhu tidak normal (%.1f°C, normal: 72-75°C)", t))
				if t < 60.0 || t > 85.0 {
					severity = models.SeverityCritical
				} else if t < 68.0 || t > 79.0 {
					severity = models.SeverityHigh
				} else {
					severity = models.SeverityMedium
				}
			}
		}
	case "FLL-002": // Mesin Filling #2: getaran (< 2.5Hz normal)
		if req.Vibration != nil {
			v := *req.Vibration
			if v >= 2.5 {
				reasons = append(reasons, fmt.Sprintf("getaran berlebih (%.1fHz, normal: < 2.5Hz)", v))
				if v >= 5.0 {
					severity = models.SeverityCritical
				} else if v >= 3.5 {
					severity = models.SeverityHigh
				} else {
					severity = models.SeverityMedium
				}
			}
		}
	case "CNV-001": // Conveyor Belt A: RPM & tekanan (RPM 800-1200, pressure 1.5-4.0 Bar normal)
		if req.RPM != nil {
			r := *req.RPM
			if r < 800 || r > 1200 {
				reasons = append(reasons, fmt.Sprintf("RPM conveyor tidak stabil (%d RPM, normal: 800-1200 RPM)", r))
				if r < 400 || r > 1800 {
					severity = models.SeverityCritical
				} else if r < 600 || r > 1500 {
					severity = models.SeverityHigh
				} else {
					severity = models.SeverityMedium
				}
			}
		}
		if req.Pressure != nil {
			p := *req.Pressure
			if p < 1.5 || p > 4.0 {
				reasons = append(reasons, fmt.Sprintf("tekanan conveyor tidak stabil (%.1f Bar, normal: 1.5-4.0 Bar)", p))
				var pSev models.IncidentSeverity = models.SeverityMedium
				if p < 0.5 || p > 8.0 {
					pSev = models.SeverityCritical
				} else if p < 1.0 || p > 6.0 {
					pSev = models.SeverityHigh
				}
				if severity == models.SeverityLow || (severity == models.SeverityMedium && pSev == models.SeverityHigh) || pSev == models.SeverityCritical {
					severity = pSev
				}
			}
		}
	case "CLD-003": // Cold Storage #3: suhu (2-4°C normal)
		if req.Temperature != nil {
			t := *req.Temperature
			if t < 2.0 || t > 4.0 {
				reasons = append(reasons, fmt.Sprintf("suhu cold storage tidak stabil (%.1f°C, normal: 2-4°C)", t))
				if t < -5.0 || t > 15.0 {
					severity = models.SeverityCritical
				} else if t < 0.0 || t > 8.0 {
					severity = models.SeverityHigh
				} else {
					severity = models.SeverityMedium
				}
			}
		}
	case "BLR-001": // Boiler Unit: tekanan & suhu (temp 90-110°C, pressure 2.0-6.0 Bar normal)
		if req.Temperature != nil {
			t := *req.Temperature
			if t < 90.0 || t > 110.0 {
				reasons = append(reasons, fmt.Sprintf("suhu boiler tidak stabil (%.1f°C, normal: 90-110°C)", t))
				if t < 50.0 || t > 150.0 {
					severity = models.SeverityCritical
				} else if t < 70.0 || t > 130.0 {
					severity = models.SeverityHigh
				} else {
					severity = models.SeverityMedium
				}
			}
		}
		if req.Pressure != nil {
			p := *req.Pressure
			if p < 2.0 || p > 6.0 {
				reasons = append(reasons, fmt.Sprintf("tekanan boiler tidak stabil (%.1f Bar, normal: 2.0-6.0 Bar)", p))
				var pSev models.IncidentSeverity = models.SeverityMedium
				if p < 0.5 || p > 10.0 {
					pSev = models.SeverityCritical
				} else if p < 1.0 || p > 8.0 {
					pSev = models.SeverityHigh
				}
				if severity == models.SeverityLow || (severity == models.SeverityMedium && pSev == models.SeverityHigh) || pSev == models.SeverityCritical {
					severity = pSev
				}
			}
		}
	}

	return len(reasons) > 0, reasons, severity
}

func (s *SensorService) createAnomalyIncident(
	ctx context.Context,
	reading *models.SensorReading,
	machine *models.Machine,
	reasons []string,
	severity models.IncidentSeverity,
) (*models.Incident, error) {
	riskScore, err := s.CalculateRiskScore(ctx, machine.ID, severity, time.Now(), models.StatusOpen)
	if err != nil {
		riskScore = 10
	}

	desc := "Anomali terdeteksi:\n• " + strings.Join(reasons, "\n• ")
	incident := &models.Incident{
		MachineID:   machine.ID,
		ReadingID:   &reading.ID,
		Title:       fmt.Sprintf("Anomali %s pada %s", severity, machine.Name),
		Description: &desc,
		Severity:    severity,
		Status:      models.StatusOpen,
		RiskScore:   riskScore,
	}

	saved, err := s.incidents.Create(ctx, incident)
	if err != nil {
		return nil, err
	}

	newVal := fmt.Sprintf("risk_score=%d, severity=%s", riskScore, severity)
	auditLog := &models.AuditLog{
		IncidentID: &saved.ID,
		Action:     models.ActionIncidentCreated,
		NewValue:   &newVal,
	}
	if _, err := s.audits.Create(ctx, auditLog); err != nil {
		fmt.Printf("sensor: warning: audit log failed: %v\n", err)
	}

	go func() {
		payload := &models.NotificationPayload{
			Title: fmt.Sprintf("⚠️ Insiden %s Baru", severity),
			Body:  fmt.Sprintf("%s — %s", machine.Name, reasons[0]),
			Data: map[string]string{
				"incident_id": saved.ID.String(),
				"machine_id":  machine.ID.String(),
			},
		}
		_ = s.notifier.BroadcastToAll(context.Background(), payload)
	}()

	return saved, nil
}

// RecalculateOpenIncidentsRiskScores queries all OPEN incidents and updates their risk scores dynamically.
func (s *SensorService) RecalculateOpenIncidentsRiskScores(ctx context.Context) error {
	rows, err := s.pool.Query(ctx, `
		SELECT id, machine_id, severity, created_at, status, risk_score
		FROM incidents
		WHERE status = 'OPEN' AND deleted_at IS NULL
	`)
	if err != nil {
		return fmt.Errorf("sensor: failed to query open incidents: %w", err)
	}
	defer rows.Close()

	type incidentUpdate struct {
		id    uuid.UUID
		score int
	}
	var updates []incidentUpdate

	for rows.Next() {
		var id, machineID uuid.UUID
		var severity models.IncidentSeverity
		var createdAt time.Time
		var status models.IncidentStatus
		var currentScore int

		err := rows.Scan(&id, &machineID, &severity, &createdAt, &status, &currentScore)
		if err != nil {
			continue
		}

		newScore, err := s.CalculateRiskScore(ctx, machineID, severity, createdAt, status)
		if err != nil {
			continue
		}

		if newScore != currentScore {
			updates = append(updates, incidentUpdate{id: id, score: newScore})
		}
	}

	for _, update := range updates {
		_, err := s.pool.Exec(ctx, `
			UPDATE incidents
			SET risk_score = $1, updated_at = NOW()
			WHERE id = $2
		`, update.score, update.id)
		if err != nil {
			log.Printf("sensor: warning: failed to update risk score for incident %s: %v\n", update.id, err)
		}
	}

	return nil
}

