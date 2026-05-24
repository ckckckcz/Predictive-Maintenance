package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/greenfields/server/core/middleware"
	"github.com/greenfields/server/core/models"
	"github.com/greenfields/server/core/services"
	"github.com/greenfields/server/pkg/utils"
)

// NotificationHandler manages push subscription endpoints.
type NotificationHandler struct {
	notifier *services.NotificationService
}

func NewNotificationHandler(notifier *services.NotificationService) *NotificationHandler {
	return &NotificationHandler{notifier: notifier}
}

// GET /api/v1/notifications/vapid-key
func (h *NotificationHandler) GetVAPIDKey(c *gin.Context) {
	utils.JSON(c, http.StatusOK, gin.H{
		"vapid_public_key": h.notifier.GetVAPIDPublicKey(),
	})
}

// POST /api/v1/notifications/subscribe/web
func (h *NotificationHandler) SubscribeWeb(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.Unauthorized(c, "invalid session")
		return
	}

	var req models.SubscribeWebRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	sub, err := h.notifier.SubscribeWeb(c.Request.Context(), userID, &req)
	if err := mapServiceError(c, err); err != nil {
		return
	}

	utils.JSON(c, http.StatusCreated, sub)
}

// POST /api/v1/notifications/subscribe/expo
func (h *NotificationHandler) SubscribeExpo(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.Unauthorized(c, "invalid session")
		return
	}

	var req models.SubscribeExpoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	sub, err := h.notifier.SubscribeExpo(c.Request.Context(), userID, &req)
	if err := mapServiceError(c, err); err != nil {
		return
	}

	utils.JSON(c, http.StatusCreated, sub)
}

// DELETE /api/v1/notifications/subscribe/:id
func (h *NotificationHandler) Unsubscribe(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.Unauthorized(c, "invalid session")
		return
	}

	subID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.BadRequest(c, "invalid subscription id")
		return
	}

	if svcErr := h.notifier.Unsubscribe(c.Request.Context(), subID, userID); svcErr != nil {
		mapServiceError(c, svcErr) //nolint:errcheck
		return
	}

	utils.JSONMessage(c, http.StatusOK, "unsubscribed")
}

// GET /api/v1/notifications/subscriptions
func (h *NotificationHandler) GetMySubscriptions(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.Unauthorized(c, "invalid session")
		return
	}

	subs, err := h.notifier.GetSubscriptions(c.Request.Context(), userID)
	if err := mapServiceError(c, err); err != nil {
		return
	}

	utils.JSON(c, http.StatusOK, subs)
}
