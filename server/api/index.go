package handler

import (
	"context"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/greenfields/server/internal/handlers"
	"github.com/greenfields/server/internal/repository"
	"github.com/greenfields/server/internal/services"
	"github.com/greenfields/server/pkg/config"
	"github.com/greenfields/server/pkg/database"
)

var (
	router http.Handler
	once   sync.Once
)

func initApp() {
	// ── Configuration ────────────────────────────────────────────────────────
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("❌ Config error: %v", err)
	}

	// ── Database (Supabase / PostgreSQL) ─────────────────────────────────────
	// In a serverless environment, database pools are reused across warm requests.
	// We use the background context here for the lifecycle of the warm instance.
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := database.NewPool(ctx, cfg.Database)
	if err != nil {
		log.Fatalf("❌ Database connection failed: %v", err)
	}

	// Note: Schema checks, auto-seeding, and migrations are run in standalone server mode.
	// In a serverless function, to optimize cold-start performance, we skip running migrations/seeding.
	// Instead, database migrations/seeding should be run once during local development or CI/CD,
	// or through the standalone server binary.

	// ── Repositories ─────────────────────────────────────────────────────────
	userRepo     := repository.NewUserRepository(pool)
	machineRepo  := repository.NewMachineRepository(pool)
	sensorRepo   := repository.NewSensorRepository(pool)
	incidentRepo := repository.NewIncidentRepository(pool)
	auditRepo    := repository.NewAuditRepository(pool)
	pushRepo     := repository.NewPushRepository(pool)
	aiRepo       := repository.NewAIAnalysisRepository(pool)
	masterRepo   := repository.NewMasterDataRepository(pool)
	mechanicRepo := repository.NewMechanicRepository(pool)

	// ── Services ─────────────────────────────────────────────────────────────
	notifySvc   := services.NewNotificationService(pushRepo, cfg)
	authSvc     := services.NewAuthService(userRepo, cfg)
	machineSvc  := services.NewMachineService(machineRepo)
	sensorSvc   := services.NewSensorService(pool, sensorRepo, machineRepo, incidentRepo, auditRepo, notifySvc)
	incidentSvc := services.NewIncidentService(incidentRepo, auditRepo, notifySvc)
	geminiSvc   := services.NewGeminiService(cfg.OpenRouter.APIKey, cfg.OpenRouter.Model, machineRepo, sensorRepo, incidentRepo, aiRepo)
	masterSvc   := services.NewMasterDataService(masterRepo)
	mechanicSvc := services.NewMechanicService(mechanicRepo)

	// ── IoT Simulator ────────────────────────────────────────────────────────
	// We instantiate the SimulatorService so the simulator endpoints work,
	// but we DO NOT call simSvc.Start() or run background risk score updater goroutines
	// because background loops are not supported in serverless functions.
	simSvc := services.NewSimulatorService(machineRepo, sensorSvc, geminiSvc)

	// ── HTTP Router ───────────────────────────────────────────────────────────
	router = handlers.NewRouter(handlers.Dependencies{
		Cfg:           cfg,
		Pool:          pool,
		AuthSvc:       authSvc,
		MachineSvc:    machineSvc,
		SensorSvc:     sensorSvc,
		IncidentSvc:   incidentSvc,
		NotifySvc:     notifySvc,
		GeminiSvc:     geminiSvc,
		UserRepo:      userRepo,
		AuditRepo:     auditRepo,
		SimulatorSvc:  simSvc,
		MasterDataSvc: masterSvc,
		MechanicSvc:   mechanicSvc,
	})
}

// Handler is the entrypoint for Vercel Serverless Functions.
func Handler(w http.ResponseWriter, r *http.Request) {
	once.Do(initApp)
	router.ServeHTTP(w, r)
}
