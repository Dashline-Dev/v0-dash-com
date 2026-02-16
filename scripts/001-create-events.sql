-- ============================================================
-- Events table
-- ============================================================

CREATE TABLE IF NOT EXISTS events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  slug            text NOT NULL UNIQUE,
  description     text,
  event_type      text NOT NULL DEFAULT 'general',
  start_datetime  timestamptz NOT NULL,
  end_datetime    timestamptz,
  timezone        text NOT NULL DEFAULT 'UTC',
  location_name   text,
  location_address text,
  latitude        double precision,
  longitude       double precision,
  virtual_link    text,
  is_virtual      boolean DEFAULT false,
  cover_image_url text,
  host_user_id    text NOT NULL,
  community_id    uuid REFERENCES communities(id) ON DELETE CASCADE,
  space_id        uuid REFERENCES spaces(id) ON DELETE SET NULL,
  attendees_limit integer,
  food_info       text,
  accessibility_options text,
  status          text NOT NULL DEFAULT 'draft',
  visibility      text NOT NULL DEFAULT 'public',
  approval_required boolean DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  completed_at    timestamptz
);

-- ============================================================
-- Event co-hosts junction table
-- ============================================================

CREATE TABLE IF NOT EXISTS event_cohosts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id    text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (event_id, user_id)
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_events_community ON events(community_id);
CREATE INDEX IF NOT EXISTS idx_events_host ON events(host_user_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_datetime);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);

-- ============================================================
-- Seed data
-- ============================================================

INSERT INTO events (title, slug, description, event_type, start_datetime, end_datetime, timezone, location_name, location_address, is_virtual, virtual_link, host_user_id, community_id, status, visibility, food_info, accessibility_options) VALUES
(
  'Weekly Torah Study',
  'weekly-torah-study',
  'Join us for an engaging weekly Torah study session. All levels of knowledge are welcome. We explore the weekly parsha together in a warm and welcoming environment.',
  'lecture',
  now() + interval '3 days',
  now() + interval '3 days' + interval '2 hours',
  'America/New_York',
  'Main Hall',
  '123 Community Ave, New York, NY 10001',
  false,
  NULL,
  'user_01',
  (SELECT id FROM communities LIMIT 1),
  'published',
  'public',
  'Light refreshments provided',
  'Wheelchair accessible, hearing loop available'
),
(
  'Community Shabbat Dinner',
  'community-shabbat-dinner',
  'A beautiful community Shabbat dinner for members and guests. Come together for candle lighting, kiddush, and a delicious catered meal.',
  'kiddush',
  now() + interval '5 days',
  now() + interval '5 days' + interval '3 hours',
  'America/New_York',
  'Community Dining Hall',
  '456 Fellowship Blvd, Brooklyn, NY 11201',
  false,
  NULL,
  'user_01',
  (SELECT id FROM communities LIMIT 1),
  'published',
  'public',
  'Full kosher dinner catered by local restaurant. Please note any dietary restrictions.',
  'Wheelchair accessible'
),
(
  'Virtual Tech Meetup',
  'virtual-tech-meetup',
  'Monthly virtual meetup for community members interested in technology. This month we discuss AI tools for community building.',
  'meetup',
  now() + interval '7 days',
  now() + interval '7 days' + interval '90 minutes',
  'America/Los_Angeles',
  NULL,
  NULL,
  true,
  'https://zoom.us/j/example',
  'user_01',
  NULL,
  'published',
  'public',
  NULL,
  NULL
),
(
  'Art Workshop: Watercolors for Beginners',
  'art-workshop-watercolors',
  'A hands-on workshop for beginners to learn the basics of watercolor painting. All materials provided. Limited to 20 attendees.',
  'workshop',
  now() + interval '10 days',
  now() + interval '10 days' + interval '3 hours',
  'America/Chicago',
  'Creative Space Studio',
  '789 Art Lane, Chicago, IL 60601',
  false,
  NULL,
  'user_01',
  NULL,
  'published',
  'public',
  'Snacks and drinks available',
  'Ground floor access, materials provided'
),
(
  'Summer Social Gathering',
  'summer-social-gathering',
  'An informal social gathering to welcome new community members and reconnect with friends. Games, music, and great conversation.',
  'social',
  now() - interval '5 days',
  now() - interval '5 days' + interval '4 hours',
  'America/New_York',
  'Community Park',
  '100 Park Ave, New York, NY 10001',
  false,
  NULL,
  'user_01',
  (SELECT id FROM communities LIMIT 1),
  'completed',
  'public',
  'BBQ and vegetarian options available',
  'Outdoor event, paved pathways'
);
