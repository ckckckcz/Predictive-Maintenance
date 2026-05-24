package models

import (
	"time"

	"github.com/google/uuid"
)

// AIAnalysis represents a Gemini AI predictive analysis record.
type AIAnalysis struct {
	ID                   uuid.UUID  `json:"id"`
	MachineID            uuid.UUID  `json:"machine_id"`
	RiskLevel            string     `json:"risk_level"`             // LOW|MEDIUM|HIGH|CRITICAL
	RiskScore            int        `json:"risk_score"`             // 0-100
	HealthPercentage     int        `json:"health_percentage"`      // 0-100
	Trend                string     `json:"trend"`                  // STABLE|INCREASING|DECREASING|SPIKE
	Prediction           string     `json:"prediction"`             // narasi kondisi
	Recommendation       string     `json:"recommendation"`         // tindakan spesifik
	EstimatedFailureHours *int      `json:"estimated_failure_hours"` // null = aman
	Urgent               bool       `json:"urgent"`
	AnalyzedAt           time.Time  `json:"analyzed_at"`
}

// geminiAnalysisJSON is the raw response from Gemini API (unexported, only used in gemini_service).
type GeminiAnalysisJSON struct {
	RiskLevel             string `json:"risk_level"`
	RiskScore             int    `json:"risk_score"`
	HealthPercentage      int    `json:"health_percentage"`
	Trend                 string `json:"trend"`
	Prediction            string `json:"prediction"`
	Recommendation        string `json:"recommendation"`
	EstimatedFailureHours *int   `json:"estimated_failure_hours"`
	Urgent                bool   `json:"urgent"`
}
