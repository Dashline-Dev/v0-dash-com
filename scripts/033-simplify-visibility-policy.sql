-- Simplify visibility model for communities and spaces
-- Remove redundant 'type' column, standardize visibility values

-- Update communities visibility values to the new model
UPDATE communities SET visibility = 'public' WHERE visibility = 'visible-with-approval';

-- Update spaces visibility values to the new model
UPDATE spaces SET visibility = 'unlisted' WHERE visibility = 'visible';

-- Note: We're keeping the 'type' column in the database for now to avoid breaking changes
-- The column is simply no longer used by the application
