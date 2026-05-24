package config

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

// Config holds all application configuration loaded from environment variables.
type Config struct {
	App        AppConfig
	Database   DatabaseConfig
	JWT        JWTConfig
	CORS       CORSConfig
	VAPID      VAPIDConfig
	Expo       ExpoConfig
	Simulator  SimulatorConfig
	OpenRouter OpenRouterConfig
	Supabase   SupabaseConfig
}

type SupabaseConfig struct {
	URL    string
	Key    string
	Bucket string
}

type AppConfig struct {
	Port string
	Env  string
}

// DatabaseConfig holds Supabase/PostgreSQL connection settings.
type DatabaseConfig struct {
	URL             string
	URLDirect       string
	MaxConns        int32
	MinConns        int32
	MaxConnLifetime time.Duration
	MaxConnIdleTime time.Duration
}

type JWTConfig struct {
	Secret          string
	AccessExpires   time.Duration
	RefreshExpires  time.Duration
}

type CORSConfig struct {
	AllowedOrigins []string
}

// VAPIDConfig is used for Web Push notifications (PWA Supervisor).
type VAPIDConfig struct {
	PublicKey  string
	PrivateKey string
	Email      string
}

// ExpoConfig is used for Expo Push notifications (Mobile Operator).
type ExpoConfig struct {
	PushURL string
}

// SimulatorConfig holds the internal API key for sensor ingestion.
type SimulatorConfig struct {
	APIKey string
}

// OpenRouterConfig holds settings for the OpenRouter AI API.
type OpenRouterConfig struct {
	APIKey string
	Model  string
}

// Load reads .env file (if present) and parses all environment variables.
func Load() (*Config, error) {
	_ = godotenv.Load()

	cfg := &Config{}

	// --- App ---
	cfg.App.Port = getEnv("APP_PORT", "8080")
	cfg.App.Env = getEnv("APP_ENV", "development")

	// --- Database (Supabase) ---
	cfg.Database.URL = requireEnv("DATABASE_URL")
	cfg.Database.URLDirect = getEnv("DATABASE_URL_DIRECT", cfg.Database.URL)

	maxConns, err := parseInt32Env("DB_MAX_CONNS", 20)
	if err != nil {
		return nil, fmt.Errorf("config: DB_MAX_CONNS: %w", err)
	}
	cfg.Database.MaxConns = maxConns

	minConns, err := parseInt32Env("DB_MIN_CONNS", 2)
	if err != nil {
		return nil, fmt.Errorf("config: DB_MIN_CONNS: %w", err)
	}
	cfg.Database.MinConns = minConns

	cfg.Database.MaxConnLifetime, err = parseDurationEnv("DB_MAX_CONN_LIFETIME", time.Hour)
	if err != nil {
		return nil, fmt.Errorf("config: DB_MAX_CONN_LIFETIME: %w", err)
	}

	cfg.Database.MaxConnIdleTime, err = parseDurationEnv("DB_MAX_CONN_IDLE_TIME", 30*time.Minute)
	if err != nil {
		return nil, fmt.Errorf("config: DB_MAX_CONN_IDLE_TIME: %w", err)
	}

	// --- JWT ---
	cfg.JWT.Secret = requireEnv("JWT_SECRET")
	cfg.JWT.AccessExpires, err = parseDurationEnv("JWT_ACCESS_EXPIRES", 15*time.Minute)
	if err != nil {
		return nil, fmt.Errorf("config: JWT_ACCESS_EXPIRES: %w", err)
	}
	cfg.JWT.RefreshExpires, err = parseDurationEnv("JWT_REFRESH_EXPIRES", 7*24*time.Hour)
	if err != nil {
		return nil, fmt.Errorf("config: JWT_REFRESH_EXPIRES: %w", err)
	}

	// --- CORS ---
	rawOrigins := getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000")
	cfg.CORS.AllowedOrigins = splitComma(rawOrigins)

	// --- VAPID ---
	cfg.VAPID.PublicKey = getEnv("VAPID_PUBLIC_KEY", "")
	cfg.VAPID.PrivateKey = getEnv("VAPID_PRIVATE_KEY", "")
	cfg.VAPID.Email = getEnv("VAPID_EMAIL", "")

	// --- Expo ---
	cfg.Expo.PushURL = getEnv("EXPO_PUSH_URL", "https://exp.host/--/api/v2/push/send")

	// --- Simulator ---
	cfg.Simulator.APIKey = getEnv("SIMULATOR_API_KEY", "")

	// --- OpenRouter ---
	cfg.OpenRouter.APIKey = getEnv("OPENROUTER_API_KEY", "")
	cfg.OpenRouter.Model = getEnv("OPENROUTER_MODEL", "google/gemini-2.0-flash-001")

	// --- Supabase ---
	cfg.Supabase.URL = getEnv("SUPABASE_URL", "")
	cfg.Supabase.Key = getEnv("SUPABASE_KEY", "")
	cfg.Supabase.Bucket = getEnv("SUPABASE_BUCKET", "incident-images")

	return cfg, nil
}

// IsDevelopment returns true when running in development mode.
func (c *Config) IsDevelopment() bool {
	return c.App.Env == "development"
}

// ─── helpers ────────────────────────────────────────────────────────────────

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func requireEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		panic(fmt.Sprintf("config: required environment variable %q is not set", key))
	}
	return v
}

func parseInt32Env(key string, fallback int32) (int32, error) {
	raw := os.Getenv(key)
	if raw == "" {
		return fallback, nil
	}
	v, err := strconv.ParseInt(raw, 10, 32)
	if err != nil {
		return 0, fmt.Errorf("invalid integer %q: %w", raw, err)
	}
	return int32(v), nil
}

func parseDurationEnv(key string, fallback time.Duration) (time.Duration, error) {
	raw := os.Getenv(key)
	if raw == "" {
		return fallback, nil
	}
	d, err := time.ParseDuration(raw)
	if err != nil {
		return 0, fmt.Errorf("invalid duration %q: %w", raw, err)
	}
	return d, nil
}

func splitComma(s string) []string {
	var result []string
	for _, part := range splitStr(s, ',') {
		if trimmed := trimSpace(part); trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

func splitStr(s string, sep rune) []string {
	var parts []string
	start := 0
	for i, r := range s {
		if r == sep {
			parts = append(parts, s[start:i])
			start = i + 1
		}
	}
	parts = append(parts, s[start:])
	return parts
}

func trimSpace(s string) string {
	start, end := 0, len(s)
	for start < end && (s[start] == ' ' || s[start] == '\t') {
		start++
	}
	for end > start && (s[end-1] == ' ' || s[end-1] == '\t') {
		end--
	}
	return s[start:end]
}
