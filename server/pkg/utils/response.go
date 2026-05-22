package utils

import (
	"math"
	"net/http"

	"github.com/gin-gonic/gin"
)

// ─── Response envelope ───────────────────────────────────────────────────────

// Response is the standard JSON envelope for all API responses.
type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Meta    *Meta       `json:"meta,omitempty"`
	Error   *ErrorBody  `json:"error,omitempty"`
}

// Meta carries pagination information for list endpoints.
type Meta struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"total_pages"`
}

// ErrorBody is the structured error payload.
type ErrorBody struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

// ─── Success responses ───────────────────────────────────────────────────────

func JSON(c *gin.Context, status int, data interface{}) {
	c.JSON(status, Response{Success: true, Data: data})
}

func JSONWithMeta(c *gin.Context, status int, data interface{}, meta *Meta) {
	c.JSON(status, Response{Success: true, Data: data, Meta: meta})
}

func JSONMessage(c *gin.Context, status int, message string) {
	c.JSON(status, Response{Success: true, Message: message})
}

// ─── Error responses (all call c.Abort()) ────────────────────────────────────

func JSONError(c *gin.Context, status int, code, message string) {
	c.AbortWithStatusJSON(status, Response{
		Success: false,
		Error:   &ErrorBody{Code: code, Message: message},
	})
}

func JSONErrorDetails(c *gin.Context, status int, code, message string, details interface{}) {
	c.AbortWithStatusJSON(status, Response{
		Success: false,
		Error:   &ErrorBody{Code: code, Message: message, Details: details},
	})
}

// ─── HTTP shorthand helpers ──────────────────────────────────────────────────

func BadRequest(c *gin.Context, msg string) {
	JSONError(c, http.StatusBadRequest, "BAD_REQUEST", msg)
}

func Unauthorized(c *gin.Context, msg string) {
	JSONError(c, http.StatusUnauthorized, "UNAUTHORIZED", msg)
}

func Forbidden(c *gin.Context, msg string) {
	JSONError(c, http.StatusForbidden, "FORBIDDEN", msg)
}

func NotFound(c *gin.Context, msg string) {
	JSONError(c, http.StatusNotFound, "NOT_FOUND", msg)
}

func Conflict(c *gin.Context, msg string) {
	JSONError(c, http.StatusConflict, "CONFLICT", msg)
}

func InternalError(c *gin.Context, msg string) {
	JSONError(c, http.StatusInternalServerError, "INTERNAL_ERROR", msg)
}

func ValidationError(c *gin.Context, details interface{}) {
	JSONErrorDetails(c, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "validation failed", details)
}

// ─── Pagination helper ───────────────────────────────────────────────────────

// NewMeta creates pagination metadata given the current page, page size, and total records.
func NewMeta(page, limit int, total int64) *Meta {
	totalPages := int(math.Ceil(float64(total) / float64(limit)))
	return &Meta{
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
	}
}

// ParsePagination reads ?page= and ?limit= from query params with safe defaults.
func ParsePagination(c *gin.Context) (page, limit, offset int) {
	page = max(1, queryInt(c, "page", 1))
	limit = clamp(queryInt(c, "limit", 10), 1, 100)
	offset = (page - 1) * limit
	return
}

func queryInt(c *gin.Context, key string, def int) int {
	raw := c.Query(key)
	if raw == "" {
		return def
	}
	var v int
	if _, err := parseIntStr(raw, &v); err != nil {
		return def
	}
	return v
}

func parseIntStr(s string, out *int) (bool, error) {
	v := 0
	for _, c := range s {
		if c < '0' || c > '9' {
			return false, nil
		}
		v = v*10 + int(c-'0')
	}
	*out = v
	return true, nil
}

func clamp(v, lo, hi int) int {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
