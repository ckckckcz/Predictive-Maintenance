package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/greenfields/server/core/models"
	"github.com/greenfields/server/core/repository"
	"github.com/greenfields/server/core/services"
	"github.com/greenfields/server/pkg/utils"
)

// UserHandler manages user CRUD
type UserHandler struct {
	auth  *services.AuthService
	users repository.UserRepository
}

func NewUserHandler(auth *services.AuthService, users repository.UserRepository) *UserHandler {
	return &UserHandler{auth: auth, users: users}
}

// GET /api/v1/users  [SUPERVISOR]
func (h *UserHandler) ListUsers(c *gin.Context) {
	users, err := h.users.List(c.Request.Context())
	if err := mapServiceError(c, err); err != nil {
		return
	}

	public := make([]*models.UserPublic, 0, len(users))
	for _, u := range users {
		public = append(public, u.ToPublic())
	}
	utils.JSON(c, http.StatusOK, public)
}

// POST /api/v1/users  [SUPERVISOR]
func (h *UserHandler) CreateUser(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	user, err := h.auth.Register(c.Request.Context(), &req)
	if err := mapServiceError(c, err); err != nil {
		return
	}

	utils.JSON(c, http.StatusCreated, user)
}

// GET /api/v1/users/:id  [SUPERVISOR]
func (h *UserHandler) GetUser(c *gin.Context) {
	id, err := parseUUID(c, "id")
	if err != nil {
		return
	}

	user, svcErr := h.users.FindByID(c.Request.Context(), id)
	if err := mapServiceError(c, svcErr); err != nil {
		return
	}

	utils.JSON(c, http.StatusOK, user.ToPublic())
}

// PUT /api/v1/users/:id
func (h *UserHandler) UpdateUser(c *gin.Context) {
	id, err := parseUUID(c, "id")
	if err != nil {
		return
	}

	var req models.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	user, svcErr := h.users.Update(c.Request.Context(), id, &req)
	if err := mapServiceError(c, svcErr); err != nil {
		return
	}

	utils.JSON(c, http.StatusOK, user.ToPublic())
}

// DELETE /api/v1/users/:id
func (h *UserHandler) DeactivateUser(c *gin.Context) {
	id, err := parseUUID(c, "id")
	if err != nil {
		return
	}

	if svcErr := h.users.Deactivate(c.Request.Context(), id); svcErr != nil {
		mapServiceError(c, svcErr)
		return
	}

	utils.JSONMessage(c, http.StatusOK, "user deactivated")
}
