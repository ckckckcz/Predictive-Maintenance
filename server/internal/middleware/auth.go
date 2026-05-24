package middleware

import (
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/greenfields/server/pkg/utils"
)

const (
	CtxUserID   = "ctx_user_id"
	CtxUserRole = "ctx_user_role"
)

// JWTAuth extracts and validates the Bearer token from the Authorization header.
func JWTAuth(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			utils.Unauthorized(c, "missing authorization header")
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "bearer") {
			utils.Unauthorized(c, "invalid authorization header format (expected: Bearer <token>)")
			return
		}

		claims, err := utils.ParseAccessToken(parts[1], jwtSecret)
		if err != nil {
			utils.Unauthorized(c, "invalid or expired token")
			return
		}

		c.Set(CtxUserID, claims.UserID)
		c.Set(CtxUserRole, claims.Role)
		c.Next()
	}
}

// RequireRole returns a middleware that allows only the specified roles.
func RequireRole(roles ...string) gin.HandlerFunc {
	allowed := make(map[string]struct{}, len(roles))
	for _, r := range roles {
		allowed[r] = struct{}{}
	}

	return func(c *gin.Context) {
		role, _ := c.Get(CtxUserRole)
		roleStr, _ := role.(string)

		if _, ok := allowed[roleStr]; !ok {
			utils.Forbidden(c, "you do not have permission to access this resource")
			return
		}
		c.Next()
	}
}

// ─── Context helpers used by handlers ────────────────────────────────────────

// GetUserID extracts the authenticated user's UUID from context.
func GetUserID(c *gin.Context) (uuid.UUID, bool) {
	raw, exists := c.Get(CtxUserID)
	if !exists {
		return uuid.Nil, false
	}
	idStr, ok := raw.(string)
	if !ok {
		return uuid.Nil, false
	}
	id, err := uuid.Parse(idStr)
	if err != nil {
		return uuid.Nil, false
	}
	return id, true
}

// GetUserRole extracts the authenticated user's role from context.
func GetUserRole(c *gin.Context) string {
	raw, _ := c.Get(CtxUserRole)
	role, _ := raw.(string)
	return role
}

// CronAuth validates either the simulator API key header or the Vercel cron Bearer token.
func CronAuth(apiKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Check X-API-Key header (for manual or alternative cron calls)
		key := c.GetHeader("X-API-Key")
		if key != "" && key == apiKey {
			c.Next()
			return
		}

		// 2. Check Authorization header (for automatic Vercel Cron authentication)
		authHeader := c.GetHeader("Authorization")
		cronSecret := os.Getenv("CRON_SECRET")
		if cronSecret != "" && authHeader == "Bearer "+cronSecret {
			c.Next()
			return
		}

		// If neither is valid, reject the request
		c.AbortWithStatusJSON(401, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "UNAUTHORIZED_CRON",
				"message": "unauthorized access: invalid or missing cron secret/API key",
			},
		})
	}
}
