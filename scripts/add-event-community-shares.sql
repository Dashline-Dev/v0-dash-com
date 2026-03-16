-- Create junction table for event multi-community sharing
CREATE TABLE IF NOT EXISTS event_community_shares (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  shared_by   text NOT NULL,
  shared_at   timestamp with time zone DEFAULT now(),
  UNIQUE(event_id, community_id)
);

-- Migrate existing community_id associations into the junction table
INSERT INTO event_community_shares (event_id, community_id, shared_by)
SELECT e.id, e.community_id, e.created_by
FROM events e
WHERE e.community_id IS NOT NULL
ON CONFLICT (event_id, community_id) DO NOTHING;
