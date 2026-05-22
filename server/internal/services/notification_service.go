package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/SherClockHolmes/webpush-go"
	"github.com/google/uuid"
	"github.com/greenfields/server/internal/models"
	"github.com/greenfields/server/internal/repository"
	"github.com/greenfields/server/pkg/config"
)

// NotificationService handles Web Push (PWA) and Expo Push (mobile) notifications.
type NotificationService struct {
	pushRepo repository.PushRepository
	cfg      *config.Config
}

func NewNotificationService(pushRepo repository.PushRepository, cfg *config.Config) *NotificationService {
	return &NotificationService{pushRepo: pushRepo, cfg: cfg}
}

// ─── Subscription management ─────────────────────────────────────────────────

func (s *NotificationService) SubscribeWeb(ctx context.Context, userID uuid.UUID, req *models.SubscribeWebRequest) (*models.PushSubscription, error) {
	return s.pushRepo.UpsertWeb(ctx, userID, req)
}

func (s *NotificationService) SubscribeExpo(ctx context.Context, userID uuid.UUID, req *models.SubscribeExpoRequest) (*models.PushSubscription, error) {
	return s.pushRepo.UpsertExpo(ctx, userID, req)
}

func (s *NotificationService) Unsubscribe(ctx context.Context, subID, userID uuid.UUID) error {
	return s.pushRepo.Delete(ctx, subID, userID)
}

func (s *NotificationService) GetSubscriptions(ctx context.Context, userID uuid.UUID) ([]*models.PushSubscription, error) {
	return s.pushRepo.FindByUserID(ctx, userID)
}

// GetVAPIDPublicKey returns the public VAPID key for the PWA to use.
func (s *NotificationService) GetVAPIDPublicKey() string {
	return s.cfg.VAPID.PublicKey
}

// ─── Broadcast ───────────────────────────────────────────────────────────────

// BroadcastToAll sends the payload to every subscriber (all roles).
func (s *NotificationService) BroadcastToAll(ctx context.Context, payload *models.NotificationPayload) error {
	var errs []error

	for _, role := range []models.UserRole{models.RoleSupervisor, models.RoleOperator} {
		subs, err := s.pushRepo.FindAllByRole(ctx, role)
		if err != nil {
			errs = append(errs, err)
			continue
		}
		for _, sub := range subs {
			if err := s.send(ctx, sub, payload); err != nil {
				errs = append(errs, err)
			}
		}
	}

	if len(errs) > 0 {
		return fmt.Errorf("notification: %d send error(s); first: %w", len(errs), errs[0])
	}
	return nil
}

// BroadcastToRole sends to all subscribers with the given role.
func (s *NotificationService) BroadcastToRole(ctx context.Context, role models.UserRole, payload *models.NotificationPayload) error {
	subs, err := s.pushRepo.FindAllByRole(ctx, role)
	if err != nil {
		return fmt.Errorf("notification: fetch subs for role %s: %w", role, err)
	}

	var errs []error
	for _, sub := range subs {
		if err := s.send(ctx, sub, payload); err != nil {
			errs = append(errs, err)
		}
	}

	if len(errs) > 0 {
		return fmt.Errorf("notification: %d send error(s); first: %w", len(errs), errs[0])
	}
	return nil
}

// ─── Dispatch ────────────────────────────────────────────────────────────────

func (s *NotificationService) send(ctx context.Context, sub *models.PushSubscription, payload *models.NotificationPayload) error {
	switch sub.DeviceType {
	case models.DeviceTypeWeb:
		return s.sendWebPush(sub, payload)
	case models.DeviceTypeMobile:
		return s.sendExpoPush(ctx, sub, payload)
	default:
		return fmt.Errorf("notification: unknown device type %q", sub.DeviceType)
	}
}

// ─── Web Push (PWA / VAPID) ──────────────────────────────────────────────────

func (s *NotificationService) sendWebPush(sub *models.PushSubscription, payload *models.NotificationPayload) error {
	if sub.Endpoint == nil || sub.P256dh == nil || sub.AuthKey == nil {
		return fmt.Errorf("notification: web push: incomplete subscription for user %s", sub.UserID)
	}
	if s.cfg.VAPID.PublicKey == "" {
		return fmt.Errorf("notification: VAPID keys not configured")
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("notification: marshal web push payload: %w", err)
	}

	resp, err := webpush.SendNotification(body, &webpush.Subscription{
		Endpoint: *sub.Endpoint,
		Keys: webpush.Keys{
			P256dh: *sub.P256dh,
			Auth:   *sub.AuthKey,
		},
	}, &webpush.Options{
		VAPIDPublicKey:  s.cfg.VAPID.PublicKey,
		VAPIDPrivateKey: s.cfg.VAPID.PrivateKey,
		Subscriber:      s.cfg.VAPID.Email,
		TTL:             60,
	})
	if err != nil {
		return fmt.Errorf("notification: web push send: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("notification: web push: status %d", resp.StatusCode)
	}
	return nil
}

// ─── Expo Push (Mobile / React Native) ───────────────────────────────────────

type expoPushMessage struct {
	To    string      `json:"to"`
	Title string      `json:"title"`
	Body  string      `json:"body"`
	Data  interface{} `json:"data,omitempty"`
	Sound string      `json:"sound,omitempty"`
}

func (s *NotificationService) sendExpoPush(ctx context.Context, sub *models.PushSubscription, payload *models.NotificationPayload) error {
	if sub.ExpoToken == nil {
		return fmt.Errorf("notification: expo push: no token for user %s", sub.UserID)
	}

	msg := expoPushMessage{
		To:    *sub.ExpoToken,
		Title: payload.Title,
		Body:  payload.Body,
		Data:  payload.Data,
		Sound: "default",
	}

	body, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("notification: marshal expo payload: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, s.cfg.Expo.PushURL, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("notification: build expo request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Accept-Encoding", "gzip, deflate")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("notification: expo push send: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("notification: expo push: status %d", resp.StatusCode)
	}
	return nil
}
