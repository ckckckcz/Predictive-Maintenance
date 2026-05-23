-- Migration: 004_add_incident_image_url.sql

ALTER TABLE incidents ADD COLUMN IF NOT EXISTS image_url TEXT;
