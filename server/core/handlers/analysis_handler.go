package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/greenfields/server/core/services"
	"github.com/greenfields/server/pkg/utils"
)

// AnalysisHandler handles AI predictive analysis endpoints.
type AnalysisHandler struct {
	gemini *services.GeminiService
}

func NewAnalysisHandler(gemini *services.GeminiService) *AnalysisHandler {
	return &AnalysisHandler{gemini: gemini}
}

// GET /api/v1/machines/:id/analysis
// Returns the latest AI analysis. Triggers a fresh one if none exists or last > 30m ago.
func (h *AnalysisHandler) GetAnalysis(c *gin.Context) {
	machineID, err := parseUUID(c, "id")
	if err != nil {
		return
	}

	analysis, svcErr := h.gemini.GetOrAnalyze(c.Request.Context(), machineID)
	if svcErr != nil {
		utils.InternalError(c, "Analisis AI tidak tersedia: "+svcErr.Error())
		return
	}
	if analysis == nil {
		utils.NotFound(c, "Belum ada data analisis untuk mesin ini")
		return
	}

	utils.JSON(c, http.StatusOK, analysis)
}

// POST /api/v1/machines/:id/analyze
// Forces a fresh Gemini analysis regardless of cache.
func (h *AnalysisHandler) ForceAnalyze(c *gin.Context) {
	machineID, err := parseUUID(c, "id")
	if err != nil {
		return
	}

	analysis, svcErr := h.gemini.Analyze(c.Request.Context(), machineID)
	if svcErr != nil {
		utils.InternalError(c, "Gagal menjalankan analisis AI: "+svcErr.Error())
		return
	}

	utils.JSON(c, http.StatusOK, analysis)
}
