package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/greenfields/server/core/middleware"
	"github.com/greenfields/server/core/models"
	"github.com/greenfields/server/core/services"
	"github.com/greenfields/server/pkg/utils"
)

// IncidentHandler manages the incident lifecycle endpoints.
type IncidentHandler struct {
	incidents *services.IncidentService
}

func NewIncidentHandler(incidents *services.IncidentService) *IncidentHandler {
	return &IncidentHandler{incidents: incidents}
}

// GET /api/v1/incidents?machine_id=&severity=&status=&page=1&limit=10
func (h *IncidentHandler) ListIncidents(c *gin.Context) {
	page, limit, offset := utils.ParsePagination(c)

	filter := models.IncidentFilter{
		MachineID: c.Query("machine_id"),
		Severity:  c.Query("severity"),
		Status:    c.Query("status"),
		Page:      page,
		Limit:     limit,
		Offset:    offset,
	}

	incidents, total, err := h.incidents.ListIncidents(c.Request.Context(), filter)
	if err := mapServiceError(c, err); err != nil {
		return
	}

	utils.JSONWithMeta(c, http.StatusOK, incidents, utils.NewMeta(page, limit, total))
}

// POST /api/v1/incidents
func (h *IncidentHandler) CreateIncident(c *gin.Context) {
	var req models.CreateIncidentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	actorID, ok := middleware.GetUserID(c)
	if !ok {
		utils.Unauthorized(c, "invalid session")
		return
	}

	incident, err := h.incidents.CreateIncident(c.Request.Context(), &req, actorID, c.ClientIP())
	if err := mapServiceError(c, err); err != nil {
		return
	}

	utils.JSON(c, http.StatusCreated, incident)
}

// GET /api/v1/incidents/:id
func (h *IncidentHandler) GetIncident(c *gin.Context) {
	id, err := parseUUID(c, "id")
	if err != nil {
		return
	}

	incident, svcErr := h.incidents.GetIncident(c.Request.Context(), id)
	if err := mapServiceError(c, svcErr); err != nil {
		return
	}

	utils.JSON(c, http.StatusOK, incident)
}

// GET /api/v1/incidents/stats
func (h *IncidentHandler) GetStats(c *gin.Context) {
	stats, err := h.incidents.GetStats(c.Request.Context())
	if err := mapServiceError(c, err); err != nil {
		return
	}
	utils.JSON(c, http.StatusOK, stats)
}

// POST /api/v1/incidents/:id/acknowledge
func (h *IncidentHandler) Acknowledge(c *gin.Context) {
	id, err := parseUUID(c, "id")
	if err != nil {
		return
	}

	actorID, ok := middleware.GetUserID(c)
	if !ok {
		utils.Unauthorized(c, "invalid session")
		return
	}

	if svcErr := h.incidents.AcknowledgeIncident(c.Request.Context(), id, actorID, c.ClientIP()); svcErr != nil {
		mapServiceError(c, svcErr)
		return
	}

	utils.JSONMessage(c, http.StatusOK, "incident acknowledged")
}

// POST /api/v1/incidents/:id/resolve
func (h *IncidentHandler) Resolve(c *gin.Context) {
	id, err := parseUUID(c, "id")
	if err != nil {
		return
	}

	actorID, ok := middleware.GetUserID(c)
	if !ok {
		utils.Unauthorized(c, "invalid session")
		return
	}

	if svcErr := h.incidents.ResolveIncident(c.Request.Context(), id, actorID, c.ClientIP()); svcErr != nil {
		mapServiceError(c, svcErr) //nolint:errcheck
		return
	}

	utils.JSONMessage(c, http.StatusOK, "incident resolved")
}

// DELETE /api/v1/incidents/:id  [SUPERVISOR]
func (h *IncidentHandler) DeleteIncident(c *gin.Context) {
	id, err := parseUUID(c, "id")
	if err != nil {
		return
	}

	actorID, ok := middleware.GetUserID(c)
	if !ok {
		utils.Unauthorized(c, "invalid session")
		return
	}

	if svcErr := h.incidents.DeleteIncident(c.Request.Context(), id, actorID, c.ClientIP()); svcErr != nil {
		mapServiceError(c, svcErr) //nolint:errcheck
		return
	}

	utils.JSONMessage(c, http.StatusOK, "incident deleted")
}

// GET /api/v1/incidents/:id/replies
func (h *IncidentHandler) ListReplies(c *gin.Context) {
	id, err := parseUUID(c, "id")
	if err != nil {
		return
	}

	replies, svcErr := h.incidents.ListReplies(c.Request.Context(), id)
	if err := mapServiceError(c, svcErr); err != nil {
		return
	}

	utils.JSON(c, http.StatusOK, replies)
}

// POST /api/v1/incidents/:id/replies
func (h *IncidentHandler) CreateReply(c *gin.Context) {
	id, err := parseUUID(c, "id")
	if err != nil {
		return
	}

	var req models.CreateIncidentReplyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	actorID, ok := middleware.GetUserID(c)
	if !ok {
		utils.Unauthorized(c, "invalid session")
		return
	}

	reply, svcErr := h.incidents.CreateReply(c.Request.Context(), id, req.Message, actorID, c.ClientIP(), req.Status)
	if err := mapServiceError(c, svcErr); err != nil {
		return
	}

	utils.JSON(c, http.StatusCreated, reply)
}

