package middleware

import (
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
)

// Logs: method, path, status, latency, client IP, and request ID.
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		c.Next()

		latency := time.Since(start)
		status := c.Writer.Status()
		method := c.Request.Method
		path := c.Request.URL.Path
		clientIP := c.ClientIP()

		statusColor := colorForStatus(status)
		methodColor := colorForMethod(method)
		reset := "\033[0m"

		fmt.Printf("[GIN] %s | %s%3d%s | %13v | %15s | %s%-7s%s %s\n",
			time.Now().Format("2006/01/02 - 15:04:05"),
			statusColor, status, reset,
			latency,
			clientIP,
			methodColor, method, reset,
			path,
		)
	}
}

func colorForStatus(code int) string {
	switch {
	case code >= 500:
		return "\033[31m" // red
	case code >= 400:
		return "\033[33m" // yellow
	case code >= 300:
		return "\033[36m" // cyan
	default:
		return "\033[32m" // green
	}
}

func colorForMethod(method string) string {
	switch method {
	case "GET":
		return "\033[34m" // blue
	case "POST":
		return "\033[32m" // green
	case "PUT", "PATCH":
		return "\033[33m" // yellow
	case "DELETE":
		return "\033[31m" // red
	default:
		return "\033[37m" // white
	}
}
