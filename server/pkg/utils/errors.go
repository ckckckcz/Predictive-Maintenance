package utils

import "errors"

// ─── Sentinel errors ────────────────────────────────────────────────────────

var (
	ErrNotFound     = errors.New("resource not found")
	ErrUnauthorized = errors.New("unauthorized")
	ErrForbidden    = errors.New("forbidden")
	ErrConflict     = errors.New("resource already exists")
	ErrBadRequest   = errors.New("bad request")
	ErrInternal     = errors.New("internal server error")
)

// ─── Type checks ────────────────────────────────────────────────────────────

func IsNotFound(err error) bool     { return errors.Is(err, ErrNotFound) }
func IsUnauthorized(err error) bool { return errors.Is(err, ErrUnauthorized) }
func IsForbidden(err error) bool    { return errors.Is(err, ErrForbidden) }
func IsConflict(err error) bool     { return errors.Is(err, ErrConflict) }
func IsBadRequest(err error) bool   { return errors.Is(err, ErrBadRequest) }
