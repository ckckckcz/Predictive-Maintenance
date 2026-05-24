package middleware

import (
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// CORS returns a middleware that handles Cross-Origin Resource Sharing.
func CORS(allowedOrigins []string) gin.HandlerFunc {
	originSet := make(map[string]struct{}, len(allowedOrigins))
	for _, o := range allowedOrigins {
		originSet[strings.TrimSpace(o)] = struct{}{}
	}

	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		if _, ok := originSet[origin]; ok || origin == "" {
			c.Header("Access-Control-Allow-Origin", origin)
		}

		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Max-Age", "86400")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// SecurityHeaders adds baseline HTTP security headers to every response.
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Header("Cache-Control", "no-store")
		c.Next()
	}
}

// SimulatorAPIKey validates the X-API-Key header for the sensor ingestion endpoint.
func SimulatorAPIKey(apiKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if apiKey == "" {
			c.Next()
			return
		}
		key := c.GetHeader("X-API-Key")
		if key != apiKey {
			c.AbortWithStatusJSON(401, gin.H{
				"success": false,
				"error":   gin.H{"code": "INVALID_API_KEY", "message": "invalid or missing API key"},
			})
			return
		}
		c.Next()
	}
}

// RateLimitInfo adds a dummy rate-limit header for observability (replace with real limiter as needed).
func RateLimitInfo(requestsPerMinute int) gin.HandlerFunc {
	_ = requestsPerMinute
	_ = time.Now()
	return func(c *gin.Context) { c.Next() }
}
