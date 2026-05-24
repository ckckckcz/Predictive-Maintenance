package services

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/greenfields/server/pkg/config"
)

type UploadService struct {
	cfg *config.Config
}

func NewUploadService(cfg *config.Config) *UploadService {
	return &UploadService{cfg: cfg}
}

// UploadFile uploads a file to Supabase Storage if configured, or falls back to local storage.
func (s *UploadService) UploadFile(ctx context.Context, fileHeader *multipart.FileHeader) (string, error) {
	file, err := fileHeader.Open()
	if err != nil {
		return "", fmt.Errorf("upload: open file: %w", err)
	}
	defer file.Close()

	// Generate a unique filename to avoid naming collisions
	ext := filepath.Ext(fileHeader.Filename)
	uniqueName := fmt.Sprintf("%s%s", uuid.New().String(), ext)

	// Check if Supabase storage is configured
	if s.cfg.Supabase.URL != "" && s.cfg.Supabase.Key != "" {
		return s.uploadToSupabase(ctx, file, uniqueName, fileHeader.Header.Get("Content-Type"))
	}

	// Local fallback
	return s.saveLocal(file, uniqueName)
}

func (s *UploadService) uploadToSupabase(ctx context.Context, file io.Reader, filename string, contentType string) (string, error) {
	// Read file data
	data, err := io.ReadAll(file)
	if err != nil {
		return "", fmt.Errorf("supabase: read file: %w", err)
	}

	// Prepare URL: /storage/v1/object/<bucket>/<path>
	bucket := s.cfg.Supabase.Bucket
	if bucket == "" {
		bucket = "incident-images"
	}
	url := fmt.Sprintf("%s/storage/v1/object/%s/%s", s.cfg.Supabase.URL, bucket, filename)

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(data))
	if err != nil {
		return "", fmt.Errorf("supabase: create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.cfg.Supabase.Key)
	req.Header.Set("Content-Type", contentType)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("supabase: do request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("supabase: upload failed with status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	// Return public URL
	publicURL := fmt.Sprintf("%s/storage/v1/object/public/%s/%s", s.cfg.Supabase.URL, bucket, filename)
	return publicURL, nil
}

func (s *UploadService) saveLocal(file io.Reader, filename string) (string, error) {
	// Ensure uploads directory exists
	dir := "./uploads"
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("local: create uploads dir: %w", err)
	}

	dstPath := filepath.Join(dir, filename)
	dst, err := os.Create(dstPath)
	if err != nil {
		return "", fmt.Errorf("local: create file: %w", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		return "", fmt.Errorf("local: save file: %w", err)
	}

	// Return relative path for client mapping
	return "/uploads/" + filename, nil
}
