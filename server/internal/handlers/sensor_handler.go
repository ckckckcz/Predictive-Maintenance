package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/greenfields/server/internal/models"
	"github.com/greenfields/server/internal/services"
	"github.com/greenfields/server/pkg/utils"
)

type SensorHandler struct {
	sensors *services.SensorService
}

func NewSensorHandler(sensors *services.SensorService) *SensorHandler {
	return &SensorHandler{sensors: sensors}
}

// POST /api/v1/sensors
func (h *SensorHandler) IngestReading(c *gin.Context) {
	var req models.CreateSensorReadingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	result, err := h.sensors.IngestReading(c.Request.Context(), &req)
	if err := mapServiceError(c, err); err != nil {
		return
	}

	utils.JSON(c, http.StatusCreated, result)
}
