-- Backfill community_areas: link every community to areas whose name
-- appears as a word in the community's location_name field.
INSERT INTO community_areas (community_id, area_id)
SELECT DISTINCT c.id, a.id
FROM communities c
JOIN areas a ON (
  -- match if the area name (or a word in it) appears in location_name
  c.location_name ILIKE '%' || a.name || '%'
  OR a.name ILIKE '%' || split_part(c.location_name, ',', 1) || '%'
)
WHERE c.location_name IS NOT NULL
  AND a.status = 'active'
ON CONFLICT DO NOTHING;

-- Also try matching via zip codes in area_zip_codes
INSERT INTO community_areas (community_id, area_id)
SELECT DISTINCT c.id, azc.area_id
FROM communities c
JOIN area_zip_codes azc ON c.location_name ~ ('\m' || azc.zip_code || '\M')
ON CONFLICT DO NOTHING;

-- Backfill space_areas: inherit from parent community's area links
INSERT INTO space_areas (space_id, area_id, created_at)
SELECT DISTINCT s.id, ca.area_id, NOW()
FROM spaces s
JOIN community_areas ca ON ca.community_id = s.community_id
WHERE s.community_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Also link spaces directly via community location_name
INSERT INTO space_areas (space_id, area_id, created_at)
SELECT DISTINCT s.id, a.id, NOW()
FROM spaces s
JOIN communities c ON c.id = s.community_id
JOIN areas a ON (
  c.location_name ILIKE '%' || a.name || '%'
  OR a.name ILIKE '%' || split_part(c.location_name, ',', 1) || '%'
)
WHERE c.location_name IS NOT NULL
  AND a.status = 'active'
ON CONFLICT DO NOTHING;

-- Report results
SELECT 'community_areas' AS table_name, COUNT(*) AS rows FROM community_areas
UNION ALL
SELECT 'space_areas', COUNT(*) FROM space_areas;
