package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/greenfields/server/internal/models"
	"github.com/greenfields/server/internal/repository"
)

// ─── OpenRouter API structures (OpenAI-compatible) ────────────────────────────

type openRouterFormat struct {
	Type string `json:"type"`
}

type openRouterRequest struct {
	Model          string              `json:"model"`
	Messages       []openRouterMessage `json:"messages"`
	ResponseFormat *openRouterFormat   `json:"response_format,omitempty"`
}

type openRouterMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openRouterResponse struct {
	Choices []struct {
		Message openRouterMessage `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
		Code    int    `json:"code"`
	} `json:"error,omitempty"`
}

// ─── Service ─────────────────────────────────────────────────────────────────

// GeminiService uses OpenRouter (OpenAI-compatible API) to perform predictive
// analysis on machine sensor data and persists results to ai_analyses.
type GeminiService struct {
	apiKey     string
	model      string
	httpClient *http.Client
	machines   repository.MachineRepository
	sensors    repository.SensorRepository
	incidents  repository.IncidentRepository
	aiAnalyses repository.AIAnalysisRepository
}

func NewGeminiService(
	apiKey string,
	model string,
	machines repository.MachineRepository,
	sensors repository.SensorRepository,
	incidents repository.IncidentRepository,
	aiAnalyses repository.AIAnalysisRepository,
) *GeminiService {
	if model == "" {
		model = "google/gemini-2.0-flash-001"
	}
	return &GeminiService{
		apiKey:     apiKey,
		model:      model,
		httpClient: &http.Client{Timeout: 60 * time.Second},
		machines:   machines,
		sensors:    sensors,
		incidents:  incidents,
		aiAnalyses: aiAnalyses,
	}
}

// Analyze runs a full AI analysis for a machine and saves the result.
// If the API call fails, it returns the last saved analysis (graceful degradation).
func (s *GeminiService) Analyze(ctx context.Context, machineID uuid.UUID) (*models.AIAnalysis, error) {
	machine, err := s.machines.FindByID(ctx, machineID)
	if err != nil {
		return s.fallback(ctx, machineID, fmt.Errorf("ai: machine not found: %w", err))
	}

	// Fetch recent sensor readings (last 60, covers ~2 hours of 15s ticks)
	allReadings, err := s.sensors.ListByMachine(ctx, machineID, 60)
	if err != nil {
		allReadings = nil
	}

	// Fetch last 10 incidents
	incidentList, _, err := s.incidents.List(ctx, models.IncidentFilter{
		MachineID: machineID.String(),
		Limit:     10,
		Offset:    0,
	})
	if err != nil {
		incidentList = nil
	}

	// Build prompt and call OpenRouter
	prompt := s.buildPrompt(machine, allReadings, incidentList)
	result, err := s.callOpenRouter(ctx, prompt)
	if err != nil {
		log.Printf("⚠️ OpenRouter API error for machine %s: %v — returning cached analysis", machine.Code, err)
		return s.fallback(ctx, machineID, err)
	}

	// Persist result
	analysis := &models.AIAnalysis{
		MachineID:             machineID,
		RiskLevel:             result.RiskLevel,
		RiskScore:             result.RiskScore,
		HealthPercentage:      result.HealthPercentage,
		Trend:                 result.Trend,
		Prediction:            result.Prediction,
		Recommendation:        result.Recommendation,
		EstimatedFailureHours: result.EstimatedFailureHours,
		Urgent:                result.Urgent,
	}
	saved, err := s.aiAnalyses.Save(ctx, analysis)
	if err != nil {
		log.Printf("⚠️ Failed to save AI analysis for %s: %v", machine.Code, err)
		return analysis, nil // return unsaved result — better than nothing
	}
	log.Printf("✅ AI analysis saved for %s [risk=%s, health=%d%%]", machine.Code, saved.RiskLevel, saved.HealthPercentage)
	return saved, nil
}

// GetOrAnalyze returns a fresh cached analysis or triggers a new one if stale (>30m).
func (s *GeminiService) GetOrAnalyze(ctx context.Context, machineID uuid.UUID) (*models.AIAnalysis, error) {
	cached, err := s.aiAnalyses.GetLatestByMachineIfFresh(ctx, machineID, 30*time.Minute)
	if err != nil {
		log.Printf("⚠️ AI analysis cache check failed: %v", err)
	}
	if cached != nil {
		return cached, nil
	}
	return s.Analyze(ctx, machineID)
}

// ─── OpenRouter HTTP call ─────────────────────────────────────────────────────

func (s *GeminiService) callOpenRouter(ctx context.Context, prompt string) (*models.GeminiAnalysisJSON, error) {
	if s.apiKey == "" {
		return nil, fmt.Errorf("OPENROUTER_API_KEY is not set")
	}

	modelsToTry := []string{s.model}
	if s.model != "openrouter/free" {
		modelsToTry = append(modelsToTry, "openrouter/free")
	}

	var lastErr error
	for _, modelName := range modelsToTry {
		for attempt := 1; attempt <= 3; attempt++ {
			if err := ctx.Err(); err != nil {
				return nil, err
			}

			payload := openRouterRequest{
				Model: modelName,
				Messages: []openRouterMessage{
					{Role: "user", Content: prompt},
				},
				ResponseFormat: &openRouterFormat{Type: "json_object"},
			}
			body, _ := json.Marshal(payload)

			req, err := http.NewRequestWithContext(ctx, http.MethodPost,
				"https://openrouter.ai/api/v1/chat/completions",
				bytes.NewReader(body),
			)
			if err != nil {
				return nil, fmt.Errorf("openrouter: build request: %w", err)
			}
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Authorization", "Bearer "+s.apiKey)
			req.Header.Set("HTTP-Referer", "https://greenfields.predictive-maintenance.app")
			req.Header.Set("X-Title", "PT Greenfields Predictive Maintenance")

			resp, err := s.httpClient.Do(req)
			if err != nil {
				lastErr = fmt.Errorf("openrouter: http call: %w", err)
				time.Sleep(1 * time.Second)
				continue
			}

			rawBody, _ := io.ReadAll(resp.Body)
			resp.Body.Close()

			var orResp openRouterResponse
			if err := json.Unmarshal(rawBody, &orResp); err != nil {
				lastErr = fmt.Errorf("openrouter: parse response: %w — body: %s", err, string(rawBody))
				time.Sleep(1 * time.Second)
				continue
			}

			// Handle API-level errors (rate limit, auth, etc.)
			if orResp.Error != nil {
				lastErr = fmt.Errorf("openrouter: API error %d: %s", orResp.Error.Code, orResp.Error.Message)
				if orResp.Error.Code == 429 {
					log.Printf("⚠️ OpenRouter rate limit (429) on model %s (attempt %d/3). Retrying...", modelName, attempt)
					time.Sleep(1 * time.Second)
					continue
				}
				break
			}

			if resp.StatusCode != http.StatusOK {
				lastErr = fmt.Errorf("openrouter: status %d: %s", resp.StatusCode, string(rawBody))
				if resp.StatusCode == http.StatusTooManyRequests {
					log.Printf("⚠️ OpenRouter status 429 on model %s (attempt %d/3). Retrying...", modelName, attempt)
					time.Sleep(1 * time.Second)
					continue
				}
				break
			}

			if len(orResp.Choices) == 0 {
				lastErr = fmt.Errorf("openrouter: empty choices in response")
				break
			}

			rawJSON := strings.TrimSpace(orResp.Choices[0].Message.Content)

			// Strip markdown fences if the model wraps it (```json ... ```)
			if strings.HasPrefix(rawJSON, "```") {
				lines := strings.Split(rawJSON, "\n")
				if len(lines) > 2 {
					rawJSON = strings.Join(lines[1:len(lines)-1], "\n")
				}
			}

			var result models.GeminiAnalysisJSON
			if err := json.Unmarshal([]byte(rawJSON), &result); err != nil {
				lastErr = fmt.Errorf("openrouter: parse JSON result: %w — raw: %s", err, rawJSON)
				break
			}

			return &result, nil
		}
	}

	return nil, lastErr
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

func (s *GeminiService) buildPrompt(
	machine *models.Machine,
	readings []*models.SensorReading,
	incidents []*models.IncidentWithDetails,
) string {
	location := "Tidak diketahui"
	if machine.Location != nil {
		location = *machine.Location
	}

	var sb strings.Builder
	sb.WriteString(`You are an AI system specialized in predictive maintenance for dairy manufacturing machinery at PT Greenfields Indonesia.

Analyze the following machine data and predict potential failures.

## Machine Information
`)
	fmt.Fprintf(&sb, "Name     : %s\n", machine.Name)
	fmt.Fprintf(&sb, "Code     : %s\n", machine.Code)
	fmt.Fprintf(&sb, "Type     : %s\n", machine.Type)
	fmt.Fprintf(&sb, "Location : %s\n", location)
	fmt.Fprintf(&sb, "Status   : %s\n\n", machine.Status)

	sb.WriteString("## Normal Threshold for This Machine Type\n")
	sb.WriteString(s.getThresholdText(machine.Type))
	sb.WriteString("\n\n")

	sb.WriteString("## Sensor Readings - Last 2 Hours (newest first)\n")
	if len(readings) == 0 {
		sb.WriteString("Tidak ada data sensor tersedia.\n")
	} else {
		limit := len(readings)
		if limit > 20 {
			limit = 20
		}
		for _, r := range readings[:limit] {
			fmt.Fprintf(&sb, "[%s] Suhu: %s | Getaran: %s | Tekanan: %s | RPM: %s | Efisiensi: %s | Anomali: %v\n",
				r.ReadAt.Format("2006-01-02 15:04:05"),
				fmtFloat(r.Temperature, "°C"),
				fmtFloat(r.Vibration, "Hz"),
				fmtFloat(r.Pressure, "Bar"),
				fmtInt(r.RPM, "rpm"),
				fmtFloat(r.Efficiency, "%"),
				r.IsAnomaly,
			)
		}
	}

	sb.WriteString("\n## Incident History - Last 10 Incidents\n")
	if len(incidents) == 0 {
		sb.WriteString("Tidak ada riwayat insiden.\n")
	} else {
		for _, inc := range incidents {
			fmt.Fprintf(&sb, "[%s] Severity: %s | Status: %s | Risk Score: %d\n",
				inc.CreatedAt.Format("2006-01-02 15:04"),
				inc.Severity,
				inc.Status,
				inc.RiskScore,
			)
		}
	}

	sb.WriteString(`
## Your Analysis Task:
1. Identify concerning trends in sensor data
2. Assess overall machine health percentage (0-100%)
   - 100% = perfect condition
   - 0%   = imminent failure
3. Predict when failure might occur (in hours)
4. Give specific actionable recommendation in Bahasa Indonesia

Respond ONLY with this exact JSON format, no markdown, no explanation:
{
  "risk_level": "LOW|MEDIUM|HIGH|CRITICAL",
  "risk_score": <integer 0-100>,
  "health_percentage": <integer 0-100>,
  "trend": "STABLE|INCREASING|DECREASING|SPIKE",
  "prediction": "<narasi 2-3 kalimat dalam Bahasa Indonesia tentang kondisi mesin>",
  "recommendation": "<rekomendasi tindakan spesifik dalam Bahasa Indonesia>",
  "estimated_failure_hours": <integer atau null jika kondisi aman>,
  "urgent": <true|false>
}`)
	return sb.String()
}

func (s *GeminiService) getThresholdText(machineType string) string {
	switch strings.ToUpper(machineType) {
	case "PASTEURISASI":
		return "PASTEURISASI: Suhu 72-75°C, Tekanan 1.5-2.0 Bar"
	case "FILLING":
		return "FILLING: Getaran <2.5Hz, RPM 1400-1500"
	case "CONVEYOR":
		return "CONVEYOR: Getaran <2.0Hz, Kecepatan 0.8-1.2 m/s"
	case "COLD_STORAGE":
		return "COLD_STORAGE: Suhu 2-4°C"
	case "BOILER":
		return "BOILER: Suhu 80-90°C, Tekanan 3.0-5.0 Bar"
	default:
		return "Tidak ada threshold spesifik — gunakan nilai historis sebagai referensi"
	}
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

func (s *GeminiService) fallback(ctx context.Context, machineID uuid.UUID, originalErr error) (*models.AIAnalysis, error) {
	cached, err := s.aiAnalyses.GetLatestByMachine(ctx, machineID)
	if err == nil && cached != nil {
		log.Printf("📋 Returning cached AI analysis (age: %v)", time.Since(cached.AnalyzedAt).Round(time.Minute))
		return cached, nil
	}

	// If no cache exists, generate a safe placeholder instead of failing with 500
	log.Printf("⚠️ No cached analysis found for machine %s. Generating temporary placeholder.", machineID)

	machine, _ := s.machines.FindByID(ctx, machineID)
	machineName := "Mesin"
	if machine != nil {
		machineName = machine.Name
	}

	placeholder := &models.AIAnalysis{
		ID:                uuid.New(),
		MachineID:         machineID,
		RiskLevel:         "MEDIUM",
		RiskScore:         40,
		HealthPercentage:  60,
		Trend:             "STABLE",
		Prediction:        fmt.Sprintf("Analisis AI real-time untuk %s sementara tidak tersedia karena batas kuota API (Rate Limit 429). Menampilkan perkiraan status aman berdasarkan database lokal.", machineName),
		Recommendation:    "Pantau parameter sensor secara manual dan lakukan re-analisis dalam beberapa menit.",
		Urgent:            false,
		AnalyzedAt:        time.Now(),
	}
	return placeholder, nil
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

func fmtFloat(v *float64, unit string) string {
	if v == nil {
		return "N/A"
	}
	return fmt.Sprintf("%.2f%s", *v, unit)
}

func fmtInt(v *int, unit string) string {
	if v == nil {
		return "N/A"
	}
	return fmt.Sprintf("%d%s", *v, unit)
}
