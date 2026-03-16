-- Migration: Add space_areas join table for linking spaces to areas
-- This mirrors the existing community_areas table structure

-- Create space_areas join table
CREATE TABLE IF NOT EXISTS space_areas (
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  area_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (space_id, area_id)
);

-- Index for efficient lookups by area
CREATE INDEX IF NOT EXISTS idx_space_areas_area_id ON space_areas(area_id);

-- Index for efficient lookups by space
CREATE INDEX IF NOT EXISTS idx_space_areas_space_id ON space_areas(space_id);
