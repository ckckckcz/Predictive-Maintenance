package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/greenfields/server/core/models"
	"github.com/greenfields/server/core/services"
	"github.com/greenfields/server/pkg/utils"
)

type MechanicHandler struct {
	svc *services.MechanicService
}

func NewMechanicHandler(svc *services.MechanicService) *MechanicHandler {
	return &MechanicHandler{svc: svc}
}

// GET /api/v1/mechanics
func (h *MechanicHandler) ListMechanics(c *gin.Context) {
	list, err := h.svc.ListMechanics(c.Request.Context())
	if err := mapServiceError(c, err); err != nil {
		return
	}
	utils.JSON(c, http.StatusOK, list)
}

// GET /api/v1/mechanics/:id
func (h *MechanicHandler) GetMechanic(c *gin.Context) {
	id, err := parseUUID(c, "id")
	if err != nil {
		return
	}
	item, svcErr := h.svc.GetMechanic(c.Request.Context(), id)
	if err := mapServiceError(c, svcErr); err != nil {
		return
	}
	utils.JSON(c, http.StatusOK, item)
}

// POST /api/v1/mechanics
func (h *MechanicHandler) CreateMechanic(c *gin.Context) {
	var req models.CreateMechanicRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}
	item, svcErr := h.svc.CreateMechanic(c.Request.Context(), &req)
	if err := mapServiceError(c, svcErr); err != nil {
		return
	}
	utils.JSON(c, http.StatusCreated, item)
}

// PUT /api/v1/mechanics/:id
func (h *MechanicHandler) UpdateMechanic(c *gin.Context) {
	id, err := parseUUID(c, "id")
	if err != nil {
		return
	}
	var req models.UpdateMechanicRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}
	item, svcErr := h.svc.UpdateMechanic(c.Request.Context(), id, &req)
	if err := mapServiceError(c, svcErr); err != nil {
		return
	}
	utils.JSON(c, http.StatusOK, item)
}

// DELETE /api/v1/mechanics/:id
func (h *MechanicHandler) DeleteMechanic(c *gin.Context) {
	id, err := parseUUID(c, "id")
	if err != nil {
		return
	}
	svcErr := h.svc.DeleteMechanic(c.Request.Context(), id)
	if err := mapServiceError(c, svcErr); err != nil {
		return
	}
	utils.JSON(c, http.StatusOK, gin.H{
		"success": true,
		"message": "Mekanik berhasil dihapus",
	})
}
