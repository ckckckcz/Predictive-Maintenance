package utils

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// Claims is the JWT payload for access tokens.
type Claims struct {
	jwt.RegisteredClaims
	UserID string `json:"user_id"`
	Role   string `json:"role"`
}

// GenerateAccessToken creates a signed JWT access token containing the user ID and role.
func GenerateAccessToken(userID, role, secret string, expires time.Duration) (string, error) {
	claims := Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expires)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ID:        uuid.NewString(),
		},
		UserID: userID,
		Role:   role,
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", fmt.Errorf("jwt: sign access token: %w", err)
	}
	return signed, nil
}

// GenerateRefreshToken creates a signed JWT refresh token containing only the subject (userID).
func GenerateRefreshToken(userID, secret string, expires time.Duration) (string, error) {
	claims := jwt.RegisteredClaims{
		Subject:   userID,
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(expires)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		ID:        uuid.NewString(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", fmt.Errorf("jwt: sign refresh token: %w", err)
	}
	return signed, nil
}

// ParseAccessToken validates and parses an access token, returning the Claims.
func ParseAccessToken(tokenStr, secret string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, keyFunc(secret))
	if err != nil {
		return nil, fmt.Errorf("%w: %s", ErrUnauthorized, err.Error())
	}
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("%w: invalid token claims", ErrUnauthorized)
	}
	return claims, nil
}

// ParseRefreshToken validates a refresh token and returns the user ID (subject).
func ParseRefreshToken(tokenStr, secret string) (string, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &jwt.RegisteredClaims{}, keyFunc(secret))
	if err != nil {
		return "", fmt.Errorf("%w: %s", ErrUnauthorized, err.Error())
	}
	claims, ok := token.Claims.(*jwt.RegisteredClaims)
	if !ok || !token.Valid {
		return "", fmt.Errorf("%w: invalid refresh token", ErrUnauthorized)
	}
	return claims.Subject, nil
}

// keyFunc returns the jwt.Keyfunc that validates the signing method and provides the secret.
func keyFunc(secret string) jwt.Keyfunc {
	return func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(secret), nil
	}
}
