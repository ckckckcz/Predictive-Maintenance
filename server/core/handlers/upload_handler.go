package handlers

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/greenfields/server/core/services"
	"github.com/greenfields/server/pkg/utils"
)

type UploadHandler struct {
	uploadSvc *services.UploadService
}

func NewUploadHandler(uploadSvc *services.UploadService) *UploadHandler {
	return &UploadHandler{uploadSvc: uploadSvc}
}

// POST /api/v1/upload
func (h *UploadHandler) UploadFile(c *gin.Context) {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		utils.ValidationError(c, "file is required")
		return
	}

	url, err := h.uploadSvc.UploadFile(c.Request.Context(), fileHeader)
	if err != nil {
		log.Printf("ERROR: file upload failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	if len(url) > 0 && url[0] == '/' {
		scheme := "http"
		if c.Request.TLS != nil || c.Request.Header.Get("X-Forwarded-Proto") == "https" {
			scheme = "https"
		}
		url = fmt.Sprintf("%s://%s%s", scheme, c.Request.Host, url)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"url":     url,
	})
}
