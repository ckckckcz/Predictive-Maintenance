package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/greenfields/server/internal/models"
	"github.com/greenfields/server/internal/repository"
	"github.com/greenfields/server/pkg/utils"
)

// AuditHandler serves audit log queries
type AuditHandler struct {
	audits repository.AuditRepository
}

func NewAuditHandler(audits repository.AuditRepository) *AuditHandler {
	return &AuditHandler{audits: audits}
}

// GET /api/v1/audit-logs  [SUPERVISOR]
func (h *AuditHandler) ListAllAuditLogs(c *gin.Context) {
	page, limit, offset := utils.ParsePagination(c)

	logs, total, err := h.audits.ListAll(c.Request.Context(), models.AuditFilter{
		Page:   page,
		Limit:  limit,
		Offset: offset,
	})
	if err := mapServiceError(c, err); err != nil {
		return
	}

	utils.JSONWithMeta(c, http.StatusOK, logs, utils.NewMeta(page, limit, total))
}

// GET /api/v1/audit-logs/incident/:incident_id
func (h *AuditHandler) ListAuditByIncident(c *gin.Context) {
	incidentID, err := uuid.Parse(c.Param("incident_id"))
	if err != nil {
		utils.BadRequest(c, "invalid incident_id")
		return
	}

	page, limit, _ := utils.ParsePagination(c)

	logs, total, svcErr := h.audits.ListByIncident(c.Request.Context(), incidentID, page, limit)
	if err := mapServiceError(c, svcErr); err != nil {
		return
	}

	utils.JSONWithMeta(c, http.StatusOK, logs, utils.NewMeta(page, limit, total))
}
