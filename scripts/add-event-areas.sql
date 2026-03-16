-- Create event_areas junction table for linking events to geographic areas
CREATE TABLE IF NOT EXISTS event_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  area_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, area_id)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_event_areas_event_id ON event_areas(event_id);
CREATE INDEX IF NOT EXISTS idx_event_areas_area_id ON event_areas(area_id);
