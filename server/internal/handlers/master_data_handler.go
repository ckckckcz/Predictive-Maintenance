package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/greenfields/server/internal/models"
	"github.com/greenfields/server/internal/services"
	"github.com/greenfields/server/pkg/utils"
)

type MasterDataHandler struct {
	svc *services.MasterDataService
}

func NewMasterDataHandler(svc *services.MasterDataService) *MasterDataHandler {
	return &MasterDataHandler{svc: svc}
}

// ─── Areas ───────────────────────────────────────────────────────────────────

func (h *MasterDataHandler) ListAreas(c *gin.Context) {
	list, err := h.svc.ListAreas(c.Request.Context())
	if err := mapServiceError(c, err); err != nil {
		return
	}
	utils.JSON(c, http.StatusOK, list)
}

func (h *MasterDataHandler) GetArea(c *gin.Context) {
	id, err := parseUUID(c, "id")
	if err != nil {
		return
	}
	item, svcErr := h.svc.FindAreaByID(c.Request.Context(), id)
	if err := mapServiceError(c, svcErr); err != nil {
		return
	}
	utils.JSON(c, http.StatusOK, item)
}

func (h *MasterDataHandler) CreateArea(c *gin.Context) {
	var req models.CreateMasterDataRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}
	item, svcErr := h.svc.CreateArea(c.Request.Context(), &req)
	if err := mapServiceError(c, svcErr); err != nil {
		return
	}
	utils.JSON(c, http.StatusCreated, item)
}

func (h *MasterDataHandler) UpdateArea(c *gin.Context) {
	id, err := parseUUID(c, "id")
	if err != nil {
		return
	}
	var req models.UpdateMasterDataRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}
	item, svcErr := h.svc.UpdateArea(c.Request.Context(), id, &req)
	if err := mapServiceError(c, svcErr); err != nil {
		return
	}
	utils.JSON(c, http.StatusOK, item)
}

func (h *MasterDataHandler) DeleteArea(c *gin.Context) {
	id, err := parseUUID(c, "id")
	if err != nil {
		return
	}
	svcErr := h.svc.DeleteArea(c.Request.Context(), id)
	if err := mapServiceError(c, svcErr); err != nil {
		return
	}
	utils.JSONMessage(c, http.StatusOK, "area deleted successfully")
}

// ─── Lines ───────────────────────────────────────────────────────────────────

func (h *MasterDataHandler) ListLines(c *gin.Context) {
	list, err := h.svc.ListLines(c.Request.Context())
	if err := mapServiceError(c, err); err != nil {
		return
	}
	utils.JSON(c, http.StatusOK, list)
}

func (h *MasterDataHandler) GetLine(c *gin.Context) {
	id, err := parseUUID(c, "id")
	if err != nil {
		return
	}
	item, svcErr := h.svc.FindLineByID(c.Request.Context(), id)
	if err := mapServiceError(c, svcErr); err != nil {
		return
	}
	utils.JSON(c, http.StatusOK, item)
}

func (h *MasterDataHandler) CreateLine(c *gin.Context) {
	var req models.CreateMasterDataRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}
	item, svcErr := h.svc.CreateLine(c.Request.Context(), &req)
	if err := mapServiceError(c, svcErr); err != nil {
		return
	}
	utils.JSON(c, http.StatusCreated, item)
}

func (h *MasterDataHandler) UpdateLine(c *gin.Context) {
	id, err := parseUUID(c, "id")
	if err != nil {
		return
	}
	var req models.UpdateMasterDataRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}
	item, svcErr := h.svc.UpdateLine(c.Request.Context(), id, &req)
	if err := mapServiceError(c, svcErr); err != nil {
		return
	}
	utils.JSON(c, http.StatusOK, item)
}

func (h *MasterDataHandler) DeleteLine(c *gin.Context) {
	id, err := parseUUID(c, "id")
	if err != nil {
		return
	}
	svcErr := h.svc.DeleteLine(c.Request.Context(), id)
	if err := mapServiceError(c, svcErr); err != nil {
		return
	}
	utils.JSONMessage(c, http.StatusOK, "line deleted successfully")
}

// ─── MachineTypes ─────────────────────────────────────────────────────────────

func (h *MasterDataHandler) ListMachineTypes(c *gin.Context) {
	list, err := h.svc.ListMachineTypes(c.Request.Context())
	if err := mapServiceError(c, err); err != nil {
		return
	}
	utils.JSON(c, http.StatusOK, list)
}

func (h *MasterDataHandler) GetMachineType(c *gin.Context) {
	id, err := parseUUID(c, "id")
	if err != nil {
		return
	}
	item, svcErr := h.svc.FindMachineTypeByID(c.Request.Context(), id)
	if err := mapServiceError(c, svcErr); err != nil {
		return
	}
	utils.JSON(c, http.StatusOK, item)
}

func (h *MasterDataHandler) CreateMachineType(c *gin.Context) {
	var req models.CreateMasterDataRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}
	item, svcErr := h.svc.CreateMachineType(c.Request.Context(), &req)
	if err := mapServiceError(c, svcErr); err != nil {
		return
	}
	utils.JSON(c, http.StatusCreated, item)
}

func (h *MasterDataHandler) UpdateMachineType(c *gin.Context) {
	id, err := parseUUID(c, "id")
	if err != nil {
		return
	}
	var req models.UpdateMasterDataRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}
	item, svcErr := h.svc.UpdateMachineType(c.Request.Context(), id, &req)
	if err := mapServiceError(c, svcErr); err != nil {
		return
	}
	utils.JSON(c, http.StatusOK, item)
}

func (h *MasterDataHandler) DeleteMachineType(c *gin.Context) {
	id, err := parseUUID(c, "id")
	if err != nil {
		return
	}
	svcErr := h.svc.DeleteMachineType(c.Request.Context(), id)
	if err := mapServiceError(c, svcErr); err != nil {
		return
	}
	utils.JSONMessage(c, http.StatusOK, "machine type deleted successfully")
}
