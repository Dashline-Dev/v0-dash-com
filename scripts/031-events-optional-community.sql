-- Make community_id optional for standalone/personal events
ALTER TABLE events ALTER COLUMN community_id DROP NOT NULL;

-- Add visibility column (public events can be seen by anyone)
ALTER TABLE events ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public';
