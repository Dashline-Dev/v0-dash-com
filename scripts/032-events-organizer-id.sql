-- Add organizer_id to events (same as created_by but explicit)
ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_id TEXT;
UPDATE events SET organizer_id = created_by WHERE organizer_id IS NULL;
