package models

import (
	"time"

	"github.com/google/uuid"
)

// DeviceType differentiates between PWA (web) and Expo (mobile) push subscriptions.
type DeviceType string

const (
	DeviceTypeWeb    DeviceType = "WEB"
	DeviceTypeMobile DeviceType = "MOBILE"
)

// PushSubscription represents a record in the push_subscriptions table.
type PushSubscription struct {
	ID         uuid.UUID  `json:"id"`
	UserID     uuid.UUID  `json:"user_id"`
	// Web Push (PWA – Supervisor)
	Endpoint   *string    `json:"endpoint,omitempty"`
	P256dh     *string    `json:"p256dh,omitempty"`
	AuthKey    *string    `json:"auth_key,omitempty"`
	// Expo Push (Mobile – Operator)
	ExpoToken  *string    `json:"expo_token,omitempty"`
	DeviceType DeviceType `json:"device_type"`
	CreatedAt  time.Time  `json:"created_at"`
}

// ─── Request DTOs ─────────────────────────────────────────────────────────────

type SubscribeWebRequest struct {
	Endpoint string `json:"endpoint" binding:"required"`
	P256dh   string `json:"p256dh"   binding:"required"`
	AuthKey  string `json:"auth_key" binding:"required"`
}

type SubscribeExpoRequest struct {
	ExpoToken string `json:"expo_token" binding:"required"`
}

type NotificationPayload struct {
	Title string      `json:"title"`
	Body  string      `json:"body"`
	Data  interface{} `json:"data,omitempty"`
}
