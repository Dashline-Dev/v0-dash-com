-- Add join_policy column to spaces table (matching communities pattern)
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS join_policy TEXT DEFAULT 'open';

-- Update existing spaces to have open join policy
UPDATE spaces SET join_policy = 'open' WHERE join_policy IS NULL;
