package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/greenfields/server/internal/models"
	"github.com/greenfields/server/internal/services"
	"github.com/greenfields/server/pkg/utils"
)

// MachineHandler manages machine endpoints.
type MachineHandler struct {
	machines *services.MachineService
	sensors  *services.SensorService
}

func NewMachineHandler(machines *services.MachineService, sensors *services.SensorService) *MachineHandler {
	return &MachineHandler{machines: machines, sensors: sensors}
}

// GET /api/v1/machines
func (h *MachineHandler) ListMachines(c *gin.Context) {
	machines, err := h.machines.ListMachines(c.Request.Context())
	if err := mapServiceError(c, err); err != nil {
		return
	}
	utils.JSON(c, http.StatusOK, machines)
}

// POST /api/v1/machines  [SUPERVISOR]
func (h *MachineHandler) CreateMachine(c *gin.Context) {
	var req models.CreateMachineRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	machine, err := h.machines.CreateMachine(c.Request.Context(), &req)
	if err := mapServiceError(c, err); err != nil {
		return
	}

	utils.JSON(c, http.StatusCreated, machine)
}

// GET /api/v1/machines/:id
func (h *MachineHandler) GetMachine(c *gin.Context) {
	id, err := parseUUID(c, "id")
	if err != nil {
		return
	}

	machine, svcErr := h.machines.GetMachine(c.Request.Context(), id)
	if err := mapServiceError(c, svcErr); err != nil {
		return
	}

	utils.JSON(c, http.StatusOK, machine)
}

// PATCH /api/v1/machines/:id/status
func (h *MachineHandler) UpdateMachineStatus(c *gin.Context) {
	id, err := parseUUID(c, "id")
	if err != nil {
		return
	}

	var req models.UpdateMachineStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	if svcErr := h.machines.UpdateMachineStatus(c.Request.Context(), id, &req); svcErr != nil {
		mapServiceError(c, svcErr)
		return
	}

	utils.JSONMessage(c, http.StatusOK, "machine status updated")
}

// GET /api/v1/machines/:id/sensors/latest
func (h *MachineHandler) GetLatestSensor(c *gin.Context) {
	id, err := parseUUID(c, "id")
	if err != nil {
		return
	}

	reading, svcErr := h.sensors.GetLatestReading(c.Request.Context(), id)
	if err := mapServiceError(c, svcErr); err != nil {
		return
	}

	utils.JSON(c, http.StatusOK, reading)
}

// GET /api/v1/machines/:id/sensors/history?limit=50
func (h *MachineHandler) GetSensorHistory(c *gin.Context) {
	id, err := parseUUID(c, "id")
	if err != nil {
		return
	}

	limit := 50
	if l := c.Query("limit"); l != "" {
		if _, err := parseIntStr(l, &limit); err != nil || limit <= 0 {
			limit = 50
		}
	}

	readings, svcErr := h.sensors.GetHistory(c.Request.Context(), id, limit)
	if err := mapServiceError(c, svcErr); err != nil {
		return
	}

	utils.JSON(c, http.StatusOK, readings)
}
