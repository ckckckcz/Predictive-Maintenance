package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/greenfields/server/pkg/utils"
)

// parseUUID extracts a UUID path parameter and writes a 400 on failure.
func parseUUID(c *gin.Context, param string) (uuid.UUID, error) {
	raw := c.Param(param)
	id, err := uuid.Parse(raw)
	if err != nil {
		utils.BadRequest(c, "invalid "+param+" — must be a valid UUID")
		return uuid.Nil, err
	}
	return id, nil
}

// mapServiceError maps sentinel errors from the service layer to HTTP responses.
func mapServiceError(c *gin.Context, err error) error {
	if err == nil {
		return nil
	}
	switch {
	case errors.Is(err, utils.ErrNotFound):
		utils.NotFound(c, err.Error())
	case errors.Is(err, utils.ErrUnauthorized):
		utils.Unauthorized(c, err.Error())
	case errors.Is(err, utils.ErrForbidden):
		utils.Forbidden(c, err.Error())
	case errors.Is(err, utils.ErrConflict):
		utils.Conflict(c, err.Error())
	case errors.Is(err, utils.ErrBadRequest):
		utils.BadRequest(c, err.Error())
	default:
		utils.InternalError(c, "an unexpected error occurred")
	}
	return err
}

// parseIntStr is a shared utility for query param parsing.
func parseIntStr(s string, out *int) (bool, error) {
	v := 0
	if s == "" {
		return false, nil
	}
	for _, ch := range s {
		if ch < '0' || ch > '9' {
			return false, nil
		}
		v = v*10 + int(ch-'0')
	}
	*out = v
	return true, nil
}

// health is a simple liveness probe used by the router.
func health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"service": "predictive-maintenance-api",
	})
}
