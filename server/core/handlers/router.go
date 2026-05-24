package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/greenfields/server/core/middleware"
	"github.com/greenfields/server/core/repository"
	"github.com/greenfields/server/core/services"
	"github.com/greenfields/server/pkg/config"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Dependencies groups all wired-up instances needed by the router.
type Dependencies struct {
	Cfg          *config.Config
	Pool         *pgxpool.Pool // used for live DB health check on /api
	AuthSvc      *services.AuthService
	MachineSvc   *services.MachineService
	SensorSvc    *services.SensorService
	IncidentSvc  *services.IncidentService
	NotifySvc    *services.NotificationService
	GeminiSvc    *services.GeminiService
	UserRepo     repository.UserRepository
	AuditRepo    repository.AuditRepository
	SimulatorSvc *services.SimulatorService
	MasterDataSvc *services.MasterDataService
	MechanicSvc   *services.MechanicService
}

func NewRouter(deps Dependencies) *gin.Engine {
	if !deps.Cfg.IsDevelopment() {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()

	// ── Global middleware ────────────────────────────────────────────────────
	r.Use(middleware.Logger())
	r.Use(gin.Recovery())
	r.Use(middleware.CORS(deps.Cfg.CORS.AllowedOrigins))
	r.Use(middleware.SecurityHeaders())

	// ── Instantiate handlers ─────────────────────────────────────────────────
	authH     := NewAuthHandler(deps.AuthSvc)
	userH     := NewUserHandler(deps.AuthSvc, deps.UserRepo)
	machineH  := NewMachineHandler(deps.MachineSvc, deps.SensorSvc, deps.SimulatorSvc)
	sensorH   := NewSensorHandler(deps.SensorSvc)
	incidentH := NewIncidentHandler(deps.IncidentSvc)
	auditH    := NewAuditHandler(deps.AuditRepo)
	notifyH   := NewNotificationHandler(deps.NotifySvc)
	analysisH := NewAnalysisHandler(deps.GeminiSvc)
	uploadSvc := services.NewUploadService(deps.Cfg)
	uploadH   := NewUploadHandler(uploadSvc)
	masterH   := NewMasterDataHandler(deps.MasterDataSvc)
	mechanicH := NewMechanicHandler(deps.MechanicSvc)

	// ── Root Dashboard — Status of all integrations ──────────────────────────
	r.GET("/", rootDashboard(deps))

	// ── Serve local uploads statically ───────────────────────────────────────
	r.Static("/uploads", "./uploads")

	// ── /health — liveness probe ─────────────────────────────────────────────
	r.GET("/health", health)
	r.GET("/api/health", health)

	// ── /api — API info + live DB check ──────────────────────────────────────
	r.GET("/api", apiInfo(deps))

	// ── API v1 ───────────────────────────────────────────────────────────────
	v1 := r.Group("/api/v1")

	public := v1.Group("")
	{
		public.POST("/auth/login", authH.Login)
		public.POST("/auth/refresh", authH.RefreshToken)
		public.GET("/notifications/vapid-key", notifyH.GetVAPIDKey)
	}

	v1.POST("/sensors",
		middleware.SimulatorAPIKey(deps.Cfg.Simulator.APIKey),
		sensorH.IngestReading,
	)

	// ── Cron triggers (Vercel Serverless compatibility) ──────────────────────
	cron := v1.Group("/cron")
	cron.Use(middleware.CronAuth(deps.Cfg.Simulator.APIKey))
	{
		cron.GET("/simulate", func(c *gin.Context) {
			deps.SimulatorSvc.RunSimulationStep(c.Request.Context())
			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"message": "Simulation step completed successfully",
			})
		})
		cron.GET("/recalculate-risk", func(c *gin.Context) {
			if err := deps.SensorSvc.RecalculateOpenIncidentsRiskScores(c.Request.Context()); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"error":   err.Error(),
				})
				return
			}
			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"message": "Risk scores recalculated successfully",
			})
		})
	}

	auth := v1.Group("")
	auth.Use(middleware.JWTAuth(deps.Cfg.JWT.Secret))
	{
		// Self / profile
		auth.GET("/auth/me", authH.GetMe)
		auth.PUT("/auth/me", authH.UpdateMe)
		auth.PUT("/auth/me/password", authH.ChangePassword)

		// Machines (read: both roles)
		auth.GET("/machines", machineH.ListMachines)
		auth.GET("/machines/:id", machineH.GetMachine)
		auth.GET("/machines/:id/sensors/latest", machineH.GetLatestSensor)
		auth.GET("/machines/:id/sensors/history", machineH.GetSensorHistory)
		auth.GET("/machines/:id/analysis", analysisH.GetAnalysis)
		auth.POST("/machines/:id/analyze", analysisH.ForceAnalyze)
		auth.POST("/machines/:id/simulate-anomaly", machineH.SimulateAnomaly)

		// Master Data (read: both roles)
		auth.GET("/areas", masterH.ListAreas)
		auth.GET("/areas/:id", masterH.GetArea)
		auth.GET("/lines", masterH.ListLines)
		auth.GET("/lines/:id", masterH.GetLine)
		auth.GET("/machine-types", masterH.ListMachineTypes)
		auth.GET("/machine-types/:id", masterH.GetMachineType)

		// Mechanics (read: both roles)
		auth.GET("/mechanics", mechanicH.ListMechanics)
		auth.GET("/mechanics/:id", mechanicH.GetMechanic)

		// Incidents (read/write: both roles)
		auth.GET("/incidents/stats", incidentH.GetStats)
		auth.GET("/incidents", incidentH.ListIncidents)
		auth.POST("/incidents", incidentH.CreateIncident)
		auth.GET("/incidents/:id", incidentH.GetIncident)
		auth.POST("/incidents/:id/acknowledge", incidentH.Acknowledge)
		auth.POST("/incidents/:id/resolve", incidentH.Resolve)
		auth.GET("/incidents/:id/replies", incidentH.ListReplies)
		auth.POST("/incidents/:id/replies", incidentH.CreateReply)

		// Uploads
		auth.POST("/upload", uploadH.UploadFile)

		// Audit logs (own incident)
		auth.GET("/audit-logs/incident/:incident_id", auditH.ListAuditByIncident)

		// Push notifications
		auth.POST("/notifications/subscribe/web", notifyH.SubscribeWeb)
		auth.POST("/notifications/subscribe/expo", notifyH.SubscribeExpo)
		auth.DELETE("/notifications/subscribe/:id", notifyH.Unsubscribe)
		auth.GET("/notifications/subscriptions", notifyH.GetMySubscriptions)

		// SUPERVISOR-only routes
		supervisor := auth.Group("")
		supervisor.Use(middleware.RequireRole("SUPERVISOR"))
		{
			// User management
			supervisor.GET("/users", userH.ListUsers)
			supervisor.POST("/users", userH.CreateUser)
			supervisor.GET("/users/:id", userH.GetUser)
			supervisor.PUT("/users/:id", userH.UpdateUser)
			supervisor.DELETE("/users/:id", userH.DeactivateUser)

			// Machine management
			supervisor.POST("/machines", machineH.CreateMachine)
			supervisor.PUT("/machines/:id", machineH.UpdateMachine)
			supervisor.PATCH("/machines/:id/status", machineH.UpdateMachineStatus)
			supervisor.DELETE("/machines/:id", machineH.DeleteMachine)

			// Master Data (Write/CRUD)
			supervisor.POST("/areas", masterH.CreateArea)
			supervisor.PUT("/areas/:id", masterH.UpdateArea)
			supervisor.DELETE("/areas/:id", masterH.DeleteArea)

			supervisor.POST("/lines", masterH.CreateLine)
			supervisor.PUT("/lines/:id", masterH.UpdateLine)
			supervisor.DELETE("/lines/:id", masterH.DeleteLine)

			supervisor.POST("/machine-types", masterH.CreateMachineType)
			supervisor.PUT("/machine-types/:id", masterH.UpdateMachineType)
			supervisor.DELETE("/machine-types/:id", masterH.DeleteMachineType)

			// Mechanics management
			supervisor.POST("/mechanics", mechanicH.CreateMechanic)
			supervisor.PUT("/mechanics/:id", mechanicH.UpdateMechanic)
			supervisor.DELETE("/mechanics/:id", mechanicH.DeleteMechanic)

			// Incident management
			supervisor.DELETE("/incidents/:id", incidentH.DeleteIncident)

			// Full audit log access
			supervisor.GET("/audit-logs", auditH.ListAllAuditLogs)
		}
	}

	return r
}

// ─── /api info handler ────────────────────────────────────────────────────────

type dbStatus struct {
	Status     string `json:"status"`
	Latency    string `json:"latency,omitempty"`
	Error      string `json:"error,omitempty"`
	MaxConns   int32  `json:"max_conns"`
	TotalConns int32  `json:"total_conns"`
	IdleConns  int32  `json:"idle_conns"`
}

type apiInfoResponse struct {
	Name        string            `json:"name"`
	Version     string            `json:"version"`
	Environment string            `json:"environment"`
	Timestamp   string            `json:"timestamp"`
	Database    dbStatus          `json:"database"`
	Endpoints   map[string][]string `json:"endpoints"`
}

func apiInfo(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Live DB ping
		start := time.Now()
		db := dbStatus{
			MaxConns: deps.Pool.Config().MaxConns,
		}

		if err := deps.Pool.Ping(c.Request.Context()); err != nil {
			db.Status = "disconnected"
			db.Error = err.Error()
		} else {
			db.Status = "connected"
			db.Latency = time.Since(start).String()
			stat := deps.Pool.Stat()
			db.TotalConns = stat.TotalConns()
			db.IdleConns = stat.IdleConns()
		}

		resp := apiInfoResponse{
			Name:        "Predictive Maintenance API",
			Version:     "v1.0.0",
			Environment: deps.Cfg.App.Env,
			Timestamp:   time.Now().Format(time.RFC3339),
			Database:    db,
			Endpoints: map[string][]string{
				"public": {
					"POST /api/v1/auth/login",
					"POST /api/v1/auth/refresh",
					"GET  /api/v1/notifications/vapid-key",
				},
				"simulator_api_key": {
					"POST /api/v1/sensors",
				},
				"authenticated": {
					"GET  /api/v1/auth/me",
					"PUT  /api/v1/auth/me",
					"PUT  /api/v1/auth/me/password",
					"GET  /api/v1/machines",
					"GET  /api/v1/machines/:id",
					"GET  /api/v1/machines/:id/sensors/latest",
					"GET  /api/v1/machines/:id/sensors/history",
					"GET  /api/v1/incidents",
					"POST /api/v1/incidents",
					"GET  /api/v1/incidents/stats",
					"GET  /api/v1/incidents/:id",
					"POST /api/v1/incidents/:id/acknowledge",
					"POST /api/v1/incidents/:id/resolve",
					"GET  /api/v1/audit-logs/incident/:incident_id",
					"POST /api/v1/notifications/subscribe/web",
					"POST /api/v1/notifications/subscribe/expo",
					"DEL  /api/v1/notifications/subscribe/:id",
					"GET  /api/v1/notifications/subscriptions",
				},
				"supervisor_only": {
					"GET    /api/v1/users",
					"POST   /api/v1/users",
					"GET    /api/v1/users/:id",
					"PUT    /api/v1/users/:id",
					"DELETE /api/v1/users/:id",
					"POST   /api/v1/machines",
					"PATCH  /api/v1/machines/:id/status",
					"DELETE /api/v1/incidents/:id",
					"GET    /api/v1/audit-logs",
				},
			},
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    resp,
		})
	}
}

func rootDashboard(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Check Database connection
		start := time.Now()
		dbStatus := "connected"
		dbLatency := ""
		dbError := ""
		if err := deps.Pool.Ping(c.Request.Context()); err != nil {
			dbStatus = "disconnected"
			dbError = err.Error()
		} else {
			dbLatency = time.Since(start).String()
		}

		// 2. Check OpenRouter AI
		aiStatus := "configured"
		aiDetail := deps.Cfg.OpenRouter.Model
		if deps.Cfg.OpenRouter.APIKey == "" {
			aiStatus = "missing"
			aiDetail = "No API key configured"
		}

		// 3. Check Supabase Storage
		storageStatus := "configured"
		storageDetail := deps.Cfg.Supabase.Bucket
		if deps.Cfg.Supabase.URL == "" || deps.Cfg.Supabase.Key == "" {
			storageStatus = "fallback_local"
			storageDetail = "Using local uploads folder (ephemeral on serverless)"
		}

		// 4. Check JWT Config
		jwtStatus := "configured"
		jwtDetail := "Secret is loaded"
		if deps.Cfg.JWT.Secret == "" {
			jwtStatus = "missing"
			jwtDetail = "No JWT secret configured (CRITICAL)"
		} else if len(deps.Cfg.JWT.Secret) > 10 {
			jwtDetail = fmt.Sprintf("Active (%s...%s)", deps.Cfg.JWT.Secret[:5], deps.Cfg.JWT.Secret[len(deps.Cfg.JWT.Secret)-5:])
		}

		// 5. Check VAPID Web Push
		vapidStatus := "configured"
		vapidDetail := deps.Cfg.VAPID.Email
		if deps.Cfg.VAPID.PublicKey == "" || deps.Cfg.VAPID.PrivateKey == "" {
			vapidStatus = "not_configured"
			vapidDetail = "Web push notifications disabled"
		}

		// 6. Check Expo Push
		expoStatus := "configured"
		expoDetail := deps.Cfg.Expo.PushURL
		if deps.Cfg.Expo.PushURL == "" {
			expoStatus = "not_configured"
			expoDetail = "Expo push notifications disabled"
		}

		// If client requests JSON or sets ?json=true, return JSON response
		if c.Query("json") == "true" || c.GetHeader("Accept") == "application/json" {
			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"data": gin.H{
					"environment": deps.Cfg.App.Env,
					"timestamp":   time.Now().Format(time.RFC3339),
					"services": gin.H{
						"database": gin.H{
							"status":  dbStatus,
							"latency": dbLatency,
							"error":   dbError,
						},
						"openrouter_ai": gin.H{
							"status": aiStatus,
							"model":  aiDetail,
						},
						"supabase_storage": gin.H{
							"status": storageStatus,
							"bucket": storageDetail,
						},
						"jwt": gin.H{
							"status": jwtStatus,
							"detail": jwtDetail,
						},
						"vapid_push": gin.H{
							"status": vapidStatus,
							"email":  vapidDetail,
						},
						"expo_push": gin.H{
							"status": expoStatus,
							"url":    expoDetail,
						},
					},
				},
			})
			return
		}

		// Otherwise, render a beautiful HTML Dashboard page
		html := getDashboardHTML(
			deps.Cfg.App.Env,
			dbStatus, dbLatency, dbError,
			aiStatus, aiDetail,
			storageStatus, storageDetail,
			jwtStatus, jwtDetail,
			vapidStatus, vapidDetail,
			expoStatus, expoDetail,
		)

		c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(html))
	}
}

func getDashboardHTML(env, dbStatus, dbLatency, dbError, aiStatus, aiDetail, storageStatus, storageDetail, jwtStatus, jwtDetail, vapidStatus, vapidDetail, expoStatus, expoDetail string) string {
	// Status indicators mapping
	getBadge := func(status string) string {
		switch status {
		case "configured", "connected":
			return `<span class="status-indicator success">
				<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" fill="currentColor"/></svg>
				Connected
			</span>`
		case "fallback_local", "not_configured":
			return `<span class="status-indicator warning">
				<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" fill="currentColor"/></svg>
				Not Active / Local
			</span>`
		default:
			return `<span class="status-indicator error">
				<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" fill="currentColor"/></svg>
				Disconnected / Missing
			</span>`
		}
	}

	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Predictive Maintenance API Status</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #0b0f19;
            --card-bg: rgba(22, 28, 45, 0.4);
            --border-color: rgba(255, 255, 255, 0.08);
            --text-primary: #f3f4f6;
            --text-secondary: #9ca3af;
            --color-success: #10b981;
            --color-warning: #f59e0b;
            --color-error: #ef4444;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: var(--bg-color);
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            background-image: 
                radial-gradient(circle at 10%% 20%%, rgba(16, 185, 129, 0.05) 0%%, transparent 45%%),
                radial-gradient(circle at 90%% 80%%, rgba(99, 102, 241, 0.05) 0%%, transparent 45%%);
            padding: 2rem 1rem;
        }
        .container {
            width: 100%%;
            max-width: 680px;
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 24px;
            padding: 2.5rem;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 80px rgba(16, 185, 129, 0.02);
            animation: fadeIn 0.6s ease-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .header {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 1.25rem;
            margin-bottom: 2.25rem;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 1.5rem;
        }
        .logo-box {
            background: linear-gradient(135deg, #10b981 0%%, #6366f1 100%%);
            width: 48px;
            height: 48px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            color: white;
            box-shadow: 0 8px 16px rgba(16, 185, 129, 0.2);
        }
        .title-area h1 {
            font-size: 1.35rem;
            font-weight: 700;
            letter-spacing: -0.02em;
            margin-bottom: 0.2rem;
            background: linear-gradient(135deg, #ffffff 0%%, #c7d2fe 100%%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .title-area p { color: var(--text-secondary); font-size: 0.85rem; }
        .env-badge {
            margin-left: auto;
            background: rgba(99, 102, 241, 0.1);
            border: 1px solid rgba(99, 102, 241, 0.2);
            padding: 0.35rem 0.85rem;
            border-radius: 99px;
            font-size: 0.75rem;
            font-weight: 600;
            color: #a5b4fc;
            text-transform: uppercase;
        }
        .grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1rem;
            margin-bottom: 2.25rem;
        }
        @media(min-width: 520px) {
            .grid { grid-template-columns: repeat(2, 1fr); }
        }
        .status-card {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 1.25rem;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 130px;
            transition: all 0.2s ease;
        }
        .status-card:hover {
            background: rgba(255, 255, 255, 0.04);
            border-color: rgba(255, 255, 255, 0.12);
            transform: translateY(-2px);
        }
        .card-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.75rem;
        }
        .card-title { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
        .card-val { font-size: 0.95rem; font-weight: 600; word-break: break-all; margin-bottom: 0.5rem; }
        .card-sub { font-size: 0.75rem; color: #6b7280; font-family: monospace; }
        .status-indicator {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.25rem 0.65rem;
            border-radius: 8px;
        }
        .status-indicator.success { background: rgba(16, 185, 129, 0.08); color: var(--color-success); }
        .status-indicator.warning { background: rgba(245, 158, 11, 0.08); color: var(--color-warning); }
        .status-indicator.error { background: rgba(239, 68, 68, 0.08); color: var(--color-error); }
        .footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 0.75rem;
            color: var(--text-secondary);
            border-top: 1px solid var(--border-color);
            padding-top: 1.5rem;
        }
        .footer a { color: #6366f1; text-decoration: none; font-weight: 600; }
        .footer a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo-box">⚙️</div>
            <div class="title-area">
                <h1>Predictive Maintenance API</h1>
                <p>System Integration Dashboard</p>
            </div>
            <div class="env-badge">%s</div>
        </div>

        <div class="grid">
            <!-- Database -->
            <div class="status-card">
                <div class="card-top">
                    <span class="card-title">Database</span>
                    %s
                </div>
                <div>
                    <p class="card-val">Supabase / PostgreSQL</p>
                    <p class="card-sub">%s</p>
                </div>
            </div>

            <!-- Gemini AI -->
            <div class="status-card">
                <div class="card-top">
                    <span class="card-title">OpenRouter AI</span>
                    %s
                </div>
                <div>
                    <p class="card-val">Gemini Model Integration</p>
                    <p class="card-sub">%s</p>
                </div>
            </div>

            <!-- Supabase Storage -->
            <div class="status-card">
                <div class="card-top">
                    <span class="card-title">Supabase Storage</span>
                    %s
                </div>
                <div>
                    <p class="card-val">File/Image Storage</p>
                    <p class="card-sub">Bucket: %s</p>
                </div>
            </div>

            <!-- JWT Security -->
            <div class="status-card">
                <div class="card-top">
                    <span class="card-title">JWT Security</span>
                    %s
                </div>
                <div>
                    <p class="card-val">Authentication Token</p>
                    <p class="card-sub">%s</p>
                </div>
            </div>

            <!-- VAPID Push -->
            <div class="status-card">
                <div class="card-top">
                    <span class="card-title">VAPID Push</span>
                    %s
                </div>
                <div>
                    <p class="card-val">Web Push Notifications</p>
                    <p class="card-sub">%s</p>
                </div>
            </div>

            <!-- Expo Push -->
            <div class="status-card">
                <div class="card-top">
                    <span class="card-title">Expo Push</span>
                    %s
                </div>
                <div>
                    <p class="card-val">Mobile Notifications</p>
                    <p class="card-sub">%s</p>
                </div>
            </div>
        </div>

        <div class="footer">
            <span>Status checked at: <b>%s</b></span>
            <span>Request JSON: <a href="?json=true">Click Here</a></span>
        </div>
    </div>
</body>
</html>`,
		env,
		getBadge(dbStatus),
		func() string {
			if dbError != "" {
				return dbError
			}
			return "ping: " + dbLatency
		}(),
		getBadge(aiStatus),
		aiDetail,
		getBadge(storageStatus),
		storageDetail,
		getBadge(jwtStatus),
		jwtDetail,
		getBadge(vapidStatus),
		vapidDetail,
		getBadge(expoStatus),
		expoDetail,
		time.Now().Format("2006-01-02 15:04:05"),
	)
}
