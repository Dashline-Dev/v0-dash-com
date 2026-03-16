-- Add invitation/template fields to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS template_id VARCHAR(50);
ALTER TABLE events ADD COLUMN IF NOT EXISTS invitation_image_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS invitation_message TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS custom_styles JSONB DEFAULT '{}';
ALTER TABLE events ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}';
ALTER TABLE events ADD COLUMN IF NOT EXISTS additional_info TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS dress_code VARCHAR(100);
ALTER TABLE events ADD COLUMN IF NOT EXISTS rsvp_deadline TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS contact_info TEXT;
