package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/greenfields/server/internal/middleware"
	"github.com/greenfields/server/internal/repository"
	"github.com/greenfields/server/internal/services"
	"github.com/greenfields/server/pkg/config"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Dependencies groups all wired-up instances needed by the router.
type Dependencies struct {
	Cfg         *config.Config
	Pool        *pgxpool.Pool // used for live DB health check on /api
	AuthSvc     *services.AuthService
	MachineSvc  *services.MachineService
	SensorSvc   *services.SensorService
	IncidentSvc *services.IncidentService
	NotifySvc   *services.NotificationService
	UserRepo    repository.UserRepository
	AuditRepo   repository.AuditRepository
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
	machineH  := NewMachineHandler(deps.MachineSvc, deps.SensorSvc)
	sensorH   := NewSensorHandler(deps.SensorSvc)
	incidentH := NewIncidentHandler(deps.IncidentSvc)
	auditH    := NewAuditHandler(deps.AuditRepo)
	notifyH   := NewNotificationHandler(deps.NotifySvc)

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

		// Incidents (read/write: both roles)
		auth.GET("/incidents/stats", incidentH.GetStats)
		auth.GET("/incidents", incidentH.ListIncidents)
		auth.POST("/incidents", incidentH.CreateIncident)
		auth.GET("/incidents/:id", incidentH.GetIncident)
		auth.POST("/incidents/:id/acknowledge", incidentH.Acknowledge)
		auth.POST("/incidents/:id/resolve", incidentH.Resolve)

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
			supervisor.PATCH("/machines/:id/status", machineH.UpdateMachineStatus)

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
