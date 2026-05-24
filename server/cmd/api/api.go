package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/greenfields/server/core/handlers"
	"github.com/greenfields/server/core/repository"
	"github.com/greenfields/server/core/services"
	"github.com/greenfields/server/pkg/config"
	"github.com/greenfields/server/pkg/database"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	// ── Configuration ────────────────────────────────────────────────────────
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("❌ Config error: %v", err)
	}

	printBanner(cfg)

	// ── Database (Supabase / PostgreSQL) ─────────────────────────────────────
	log.Println("⏳ Connecting to Supabase...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := database.NewPool(ctx, cfg.Database)
	if err != nil {
		log.Fatalf("❌ Database connection failed: %v", err)
	}
	defer pool.Close()

	// Print pool stats after successful connection
	stat := pool.Stat()
	log.Printf("✅ Database connected  [conns: total=%d idle=%d max=%d]",
		stat.TotalConns(), stat.IdleConns(), pool.Config().MaxConns)

	// Quick schema sanity check — verify core tables exist
	if err := checkSchema(ctx, pool); err != nil {
		log.Printf("⚠️  Schema check warning: %v", err)
		log.Println("   → Run migrations/001_init_schema.sql on Supabase SQL Editor first")
	} else {
		log.Println("✅ Schema verified     [users, machines, incidents, sensor_readings ✓]")
	}

	// Auto-seed required virtual machines
	if err := autoSeedMachines(ctx, pool); err != nil {
		log.Printf("⚠️  Database seeding failed: %v", err)
	} else {
		log.Println("✅ Database seeded     [5 virtual machines verified/created]")
	}

	// ── Repositories ─────────────────────────────────────────────────────────
	userRepo     := repository.NewUserRepository(pool)
	machineRepo  := repository.NewMachineRepository(pool)
	sensorRepo   := repository.NewSensorRepository(pool)
	incidentRepo := repository.NewIncidentRepository(pool)
	auditRepo    := repository.NewAuditRepository(pool)
	pushRepo     := repository.NewPushRepository(pool)
	aiRepo       := repository.NewAIAnalysisRepository(pool)

	// ── Services ─────────────────────────────────────────────────────────────
	notifySvc   := services.NewNotificationService(pushRepo, cfg)
	authSvc     := services.NewAuthService(userRepo, cfg)
	machineSvc  := services.NewMachineService(machineRepo)
	sensorSvc   := services.NewSensorService(pool, sensorRepo, machineRepo, incidentRepo, auditRepo, notifySvc)
	incidentSvc := services.NewIncidentService(incidentRepo, auditRepo, notifySvc)
	geminiSvc   := services.NewGeminiService(cfg.OpenRouter.APIKey, cfg.OpenRouter.Model, machineRepo, sensorRepo, incidentRepo, aiRepo)

	// ── HTTP Router ───────────────────────────────────────────────────────────
	// ── Simulator & Background Jobs ──────────────────────────────────────────
	simSvc := services.NewSimulatorService(machineRepo, sensorSvc, geminiSvc)
	simCtx, simCancel := context.WithCancel(context.Background())

	// Start the IoT simulator ticker (every 15 seconds)
	simSvc.Start(simCtx, 15*time.Second)

	router := handlers.NewRouter(handlers.Dependencies{
		Cfg:          cfg,
		Pool:         pool,
		AuthSvc:      authSvc,
		MachineSvc:   machineSvc,
		SensorSvc:    sensorSvc,
		IncidentSvc:  incidentSvc,
		NotifySvc:    notifySvc,
		GeminiSvc:    geminiSvc,
		UserRepo:     userRepo,
		AuditRepo:    auditRepo,
		SimulatorSvc: simSvc,
	})

	// Start the periodic risk score updater ticker (every 2 minutes)
	go func() {
		ticker := time.NewTicker(2 * time.Minute)
		defer ticker.Stop()
		log.Println("🔄 Background risk score updater started (interval: 2m)")
		for {
			select {
			case <-simCtx.Done():
				log.Println("🛑 Background risk score updater stopping...")
				return
			case <-ticker.C:
				if err := sensorSvc.RecalculateOpenIncidentsRiskScores(simCtx); err != nil {
					log.Printf("⚠️ Risk score updater error: %v", err)
				}
			}
		}
	}()

	// ── HTTP Server ───────────────────────────────────────────────────────────
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.App.Port),
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("🚀 Server listening on http://localhost:%s", cfg.App.Port)
		log.Printf("   GET http://localhost:%s/api        → API info + DB status", cfg.App.Port)
		log.Printf("   GET http://localhost:%s/health     → Liveness probe", cfg.App.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("❌ Server error: %v", err)
		}
	}()

	// ── Graceful shutdown ─────────────────────────────────────────────────────
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("🛑 Shutting down server...")
	simCancel()
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("❌ Forced shutdown: %v", err)
	}
	log.Println("✅ Server stopped cleanly")
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

func printBanner(cfg *config.Config) {
	fmt.Println()
	fmt.Println("╔══════════════════════════════════════════════════╗")
	fmt.Println("║     Predictive Maintenance API  v1.0.0           ║")
	fmt.Println("╚══════════════════════════════════════════════════╝")
	fmt.Printf("  env  : %s\n", cfg.App.Env)
	fmt.Printf("  port : %s\n", cfg.App.Port)
	fmt.Println()
}

// checkSchema runs a lightweight query to confirm the 4 core tables exist.
// Returns an error if any table is missing (migrations not yet applied).
func checkSchema(ctx context.Context, pool *pgxpool.Pool) error {
	tables := []string{"users", "machines", "incidents", "sensor_readings"}
	for _, table := range tables {
		var exists bool
		err := pool.QueryRow(ctx,
			`SELECT EXISTS (
				SELECT 1 FROM information_schema.tables
				WHERE table_schema = 'public' AND table_name = $1
			)`, table,
		).Scan(&exists)
		if err != nil {
			return fmt.Errorf("check table %q: %w", table, err)
		}
		if !exists {
			return fmt.Errorf("table %q not found — run 001_init_schema.sql", table)
		}
	}
	return nil
}

// autoSeedMachines ensures that the exact 5 machines specified for the simulation are present.
func autoSeedMachines(ctx context.Context, pool *pgxpool.Pool) error {
	machines := []struct {
		name     string
		code     string
		mType    string
		location string
	}{
		{"Mesin Pasteurisasi #1", "PST-001", "PASTEURISASI", "Lantai 1 - Area A"},
		{"Mesin Filling #2", "FLL-002", "FILLING", "Lantai 1 - Area B"},
		{"Conveyor Belt A", "CNV-001", "CONVEYOR", "Lantai 2 - Area A"},
		{"Cold Storage #3", "CLD-003", "COLD_STORAGE", "Lantai 2 - Area B"},
		{"Boiler Unit", "BLR-001", "BOILER", "Lantai 3 - Area A"},
	}

	for _, m := range machines {
		_, err := pool.Exec(ctx, `
			INSERT INTO machines (name, code, type, location, status)
			VALUES ($1, $2, $3, $4, 'ACTIVE')
			ON CONFLICT (code) DO UPDATE 
			SET name = EXCLUDED.name, type = EXCLUDED.type, location = EXCLUDED.location
		`, m.name, m.code, m.mType, m.location)
		if err != nil {
			return fmt.Errorf("seed machine %s: %w", m.code, err)
		}
	}
	return nil
}

