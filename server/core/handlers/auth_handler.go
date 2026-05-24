package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/greenfields/server/core/middleware"
	"github.com/greenfields/server/core/models"
	"github.com/greenfields/server/core/services"
	"github.com/greenfields/server/pkg/utils"
)

// AuthHandler handles authentication endpoints.
type AuthHandler struct {
	auth *services.AuthService
}

func NewAuthHandler(auth *services.AuthService) *AuthHandler {
	return &AuthHandler{auth: auth}
}

// POST /api/v1/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	resp, err := h.auth.Login(c.Request.Context(), &req)
	if err := mapServiceError(c, err); err != nil {
		return
	}

	utils.JSON(c, http.StatusOK, resp)
}

// POST /api/v1/auth/refresh
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req models.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	resp, err := h.auth.RefreshToken(c.Request.Context(), &req)
	if err := mapServiceError(c, err); err != nil {
		return
	}

	utils.JSON(c, http.StatusOK, resp)
}

// GET /api/v1/auth/me
func (h *AuthHandler) GetMe(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.Unauthorized(c, "invalid session")
		return
	}

	user, err := h.auth.GetProfile(c.Request.Context(), userID)
	if err := mapServiceError(c, err); err != nil {
		return
	}

	utils.JSON(c, http.StatusOK, user)
}

// PUT /api/v1/auth/me
func (h *AuthHandler) UpdateMe(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.Unauthorized(c, "invalid session")
		return
	}

	var req models.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	user, err := h.auth.UpdateProfile(c.Request.Context(), userID, &req)
	if err := mapServiceError(c, err); err != nil {
		return
	}

	utils.JSON(c, http.StatusOK, user)
}

// PUT /api/v1/auth/me/password
func (h *AuthHandler) ChangePassword(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.Unauthorized(c, "invalid session")
		return
	}

	var req models.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	if err := h.auth.ChangePassword(c.Request.Context(), userID, &req); err != nil {
		mapServiceError(c, err)
		return
	}

	utils.JSONMessage(c, http.StatusOK, "password updated successfully")
}
