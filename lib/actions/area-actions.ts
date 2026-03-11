"use server"

import { neon } from "@neondatabase/serverless"
import type {
  AreaWithMeta,
  AreaNeighborhood,
  AreaCommunity,
  AreaEvent,
} from "@/types/area"

const sql = neon(process.env.DATABASE_URL!)

// ── List areas ──────────────────────────────────────────────

export async function getAreas(opts?: {
  type?: string
  parentId?: string
  search?: string
  limit?: number
  offset?: number
}): Promise<{ areas: AreaWithMeta[]; total: number }> {
  const limit = opts?.limit ?? 20
  const offset = opts?.offset ?? 0

  const conditions: string[] = ["a.status = 'active'"]
  const params: unknown[] = []
  let idx = 1

  if (opts?.type) {
    conditions.push(`a.type = $${idx++}`)
    params.push(opts.type)
  }
  if (opts?.parentId) {
    conditions.push(`a.parent_id = $${idx++}`)
    params.push(opts.parentId)
  }
  if (opts?.search) {
    conditions.push(`(a.name ILIKE $${idx} OR a.description ILIKE $${idx})`)
    params.push(`%${opts.search}%`)
    idx++
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

  const countResult = await sql(
    `SELECT COUNT(*) as total FROM areas a ${where}`,
    params
  )

  const rows = await sql(
    `SELECT
      a.*,
      p.name as parent_name,
      p.slug as parent_slug,
      COALESCE((SELECT COUNT(*) FROM community_areas ca WHERE ca.area_id = a.id), 0) as community_count,
      COALESCE((
        SELECT COUNT(DISTINCT e.id)
        FROM events e
        JOIN community_areas ca ON ca.community_id = e.community_id
        WHERE ca.area_id = a.id AND e.status = 'published'
      ), 0) as event_count,
      COALESCE((SELECT COUNT(*) FROM areas sub WHERE sub.parent_id = a.id AND sub.status = 'active'), 0) as neighborhood_count,
      COALESCE(
        (SELECT json_agg(azc.zip_code ORDER BY azc.zip_code) FROM area_zip_codes azc WHERE azc.area_id = a.id),
        '[]'::json
      ) as zip_codes
    FROM areas a
    LEFT JOIN areas p ON a.parent_id = p.id
    ${where}
    ORDER BY a.name ASC
    LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  )

  return {
    areas: rows.map((r) => ({
      ...r,
      community_count: Number(r.community_count),
      event_count: Number(r.event_count),
      neighborhood_count: Number(r.neighborhood_count),
      zip_codes: Array.isArray(r.zip_codes) ? r.zip_codes : JSON.parse(r.zip_codes as string),
    })) as AreaWithMeta[],
    total: Number(countResult[0].total),
  }
}

// ── Get area by slug ────────────────────────────────────────

export async function getAreaBySlug(slug: string): Promise<AreaWithMeta | null> {
  const rows = await sql(
    `SELECT
      a.*,
      p.name as parent_name,
      p.slug as parent_slug,
      COALESCE((SELECT COUNT(*) FROM community_areas ca WHERE ca.area_id = a.id), 0) as community_count,
      COALESCE((
        SELECT COUNT(DISTINCT e.id)
        FROM events e
        JOIN community_areas ca ON ca.community_id = e.community_id
        WHERE ca.area_id = a.id AND e.status = 'published'
      ), 0) as event_count,
      COALESCE((SELECT COUNT(*) FROM areas sub WHERE sub.parent_id = a.id AND sub.status = 'active'), 0) as neighborhood_count,
      COALESCE(
        (SELECT json_agg(azc.zip_code ORDER BY azc.zip_code) FROM area_zip_codes azc WHERE azc.area_id = a.id),
        '[]'::json
      ) as zip_codes
    FROM areas a
    LEFT JOIN areas p ON a.parent_id = p.id
    WHERE a.slug = $1 AND a.status = 'active'
    LIMIT 1`,
    [slug]
  )

  if (rows.length === 0) return null

  const r = rows[0]
  return {
    ...r,
    community_count: Number(r.community_count),
    event_count: Number(r.event_count),
    neighborhood_count: Number(r.neighborhood_count),
    zip_codes: Array.isArray(r.zip_codes) ? r.zip_codes : JSON.parse(r.zip_codes as string),
  } as AreaWithMeta
}

// ── Get neighborhoods for an area ───────────────────────────

export async function getAreaNeighborhoods(areaId: string): Promise<AreaNeighborhood[]> {
  const rows = await sql(
    `SELECT
      a.id, a.name, a.slug, a.description, a.place_id,
      a.bounds_ne_lat, a.bounds_ne_lng, a.bounds_sw_lat, a.bounds_sw_lng,
      COALESCE((SELECT COUNT(*) FROM community_areas ca WHERE ca.area_id = a.id), 0) as community_count,
      COALESCE((
        SELECT COUNT(DISTINCT e.id)
        FROM events e
        JOIN community_areas ca ON ca.community_id = e.community_id
        WHERE ca.area_id = a.id AND e.status = 'published'
      ), 0) as event_count
    FROM areas a
    WHERE a.parent_id = $1 AND a.status = 'active'
    ORDER BY a.name ASC`,
    [areaId]
  )

  return rows.map((r) => ({
    ...r,
    community_count: Number(r.community_count),
    event_count: Number(r.event_count),
  })) as AreaNeighborhood[]
}

// ── Get communities in an area ──────────────────────────────

export async function getAreaCommunities(
  areaId: string,
  opts?: { limit?: number; offset?: number }
): Promise<AreaCommunity[]> {
  const limit = opts?.limit ?? 20
  const offset = opts?.offset ?? 0

  const rows = await sql(
    `SELECT
      c.id, c.name, c.slug, c.description, c.cover_image_url, c.member_count, c.location_name,
      COALESCE(
        (SELECT json_agg(ct.tag) FROM community_tags ct WHERE ct.community_id = c.id),
        '[]'::json
      ) as tags
    FROM communities c
    JOIN community_areas ca ON ca.community_id = c.id
    WHERE ca.area_id = $1 AND c.visibility = 'public'
    ORDER BY c.member_count DESC
    LIMIT $2 OFFSET $3`,
    [areaId, limit, offset]
  )

  return rows.map((r) => ({
    ...r,
    tags: Array.isArray(r.tags) ? r.tags : JSON.parse(r.tags as string),
  })) as AreaCommunity[]
}

// ── Get events in an area (from public communities and spaces) ─────────

export async function getAreaEvents(
  areaId: string,
  opts?: { upcoming?: boolean; limit?: number; offset?: number }
): Promise<{ events: AreaEvent[]; total: number }> {
  const limit = opts?.limit ?? 12
  const offset = opts?.offset ?? 0
  const upcomingFilter = opts?.upcoming ? `AND e.end_time > NOW()` : ""

  // Include ALL events from communities linked to this area or child neighborhoods
  // This ensures events posted to any space within a community also appear under the area
  const countResult = await sql(
    `SELECT COUNT(DISTINCT e.id) as total
     FROM events e
     JOIN communities c ON c.id = e.community_id
     JOIN community_areas ca ON ca.community_id = e.community_id
     WHERE (ca.area_id = $1 OR ca.area_id IN (SELECT sub.id FROM areas sub WHERE sub.parent_id = $1))
       AND e.status = 'published'
       AND c.visibility = 'public'
       ${upcomingFilter}`,
    [areaId]
  )

  const rows = await sql(
    `SELECT DISTINCT ON (e.start_time, e.id)
      e.id, e.title, e.slug, e.description, e.event_type,
      e.start_time, e.end_time, e.timezone,
      e.location_name, e.location_address, e.latitude, e.longitude,
      e.virtual_link, e.rsvp_count, e.max_attendees,
      c.name as community_name, c.slug as community_slug,
      s.name as space_name, s.slug as space_slug
    FROM events e
    JOIN communities c ON c.id = e.community_id
    JOIN community_areas ca ON ca.community_id = e.community_id
    LEFT JOIN spaces s ON s.id = e.space_id
    WHERE (ca.area_id = $1 OR ca.area_id IN (SELECT sub.id FROM areas sub WHERE sub.parent_id = $1))
      AND e.status = 'published'
      AND c.visibility = 'public'
      ${upcomingFilter}
    ORDER BY e.start_time ASC, e.id
    LIMIT $2 OFFSET $3`,
    [areaId, limit, offset]
  )

  return {
    events: rows as AreaEvent[],
    total: Number(countResult[0].total),
  }
}

// ── Get map markers for an area ─────────────────────────────

export async function getAreaMapMarkers(areaId: string): Promise<{
  communities: { id: string; name: string; slug: string; lat: number; lng: number; member_count: number }[]
  events: { id: string; title: string; slug: string; lat: number; lng: number; start_time: string; community_name: string }[]
}> {
  const communities = await sql(
    `SELECT DISTINCT ON (c.id)
       c.id, c.name, c.slug, c.latitude as lat, c.longitude as lng, c.member_count
     FROM communities c
     JOIN community_areas ca ON ca.community_id = c.id
     WHERE (ca.area_id = $1 OR ca.area_id IN (SELECT sub.id FROM areas sub WHERE sub.parent_id = $1))
       AND c.visibility = 'public'
       AND c.latitude IS NOT NULL
       AND c.longitude IS NOT NULL
     ORDER BY c.id`,
    [areaId]
  )

  const events = await sql(
    `SELECT DISTINCT ON (e.id)
      e.id, e.title, e.slug, e.latitude as lat, e.longitude as lng,
      e.start_time, c.name as community_name
     FROM events e
     JOIN community_areas ca ON ca.community_id = e.community_id
     JOIN communities c ON c.id = e.community_id
     WHERE (ca.area_id = $1 OR ca.area_id IN (SELECT sub.id FROM areas sub WHERE sub.parent_id = $1))
       AND e.status = 'published'
       AND e.end_time > NOW()
       AND e.latitude IS NOT NULL
       AND e.longitude IS NOT NULL
       AND c.visibility = 'public'
     ORDER BY e.id, e.start_time ASC`,
    [areaId]
  )

  return {
    communities: communities as { id: string; name: string; slug: string; lat: number; lng: number; member_count: number }[],
    events: events as { id: string; title: string; slug: string; lat: number; lng: number; start_time: string; community_name: string }[],
  }
}

// ── Search areas by zip code ────────────────────────────────

export async function getAreasByZipCode(zipCode: string): Promise<AreaWithMeta[]> {
  const rows = await sql(
    `SELECT
      a.*,
      p.name as parent_name,
      p.slug as parent_slug,
      COALESCE((SELECT COUNT(*) FROM community_areas ca WHERE ca.area_id = a.id), 0) as community_count,
      COALESCE((
        SELECT COUNT(DISTINCT e.id)
        FROM events e
        JOIN community_areas ca ON ca.community_id = e.community_id
        WHERE ca.area_id = a.id AND e.status = 'published'
      ), 0) as event_count,
      COALESCE((SELECT COUNT(*) FROM areas sub WHERE sub.parent_id = a.id AND sub.status = 'active'), 0) as neighborhood_count,
      COALESCE(
        (SELECT json_agg(azc2.zip_code ORDER BY azc2.zip_code) FROM area_zip_codes azc2 WHERE azc2.area_id = a.id),
        '[]'::json
      ) as zip_codes
    FROM areas a
    JOIN area_zip_codes azc ON azc.area_id = a.id
    LEFT JOIN areas p ON a.parent_id = p.id
    WHERE azc.zip_code = $1 AND a.status = 'active'
    ORDER BY a.type ASC, a.name ASC`,
    [zipCode]
  )

  return rows.map((r) => ({
    ...r,
    community_count: Number(r.community_count),
    event_count: Number(r.event_count),
    neighborhood_count: Number(r.neighborhood_count),
    zip_codes: Array.isArray(r.zip_codes) ? r.zip_codes : JSON.parse(r.zip_codes as string),
  })) as AreaWithMeta[]
}

// ── Link / unlink community to area ─────────────────────────

export async function linkCommunityToArea(
  communityId: string,
  areaId: string
): Promise<void> {
  await sql(
    `INSERT INTO community_areas (community_id, area_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [communityId, areaId]
  )
}

export async function unlinkCommunityFromArea(
  communityId: string,
  areaId: string
): Promise<void> {
  await sql(
    `DELETE FROM community_areas WHERE community_id = $1 AND area_id = $2`,
    [communityId, areaId]
  )
}

// ── Link / unlink space to area ─────────────────────────────

export async function linkSpaceToArea(
  spaceId: string,
  areaId: string
): Promise<void> {
  await sql(
    `INSERT INTO space_areas (space_id, area_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [spaceId, areaId]
  )
}

export async function unlinkSpaceFromArea(
  spaceId: string,
  areaId: string
): Promise<void> {
  await sql(
    `DELETE FROM space_areas WHERE space_id = $1 AND area_id = $2`,
    [spaceId, areaId]
  )
}

// ── Get areas for a space ───────────────────────────────────

export async function getSpaceAreas(spaceId: string): Promise<AreaWithMeta[]> {
  const rows = await sql(
    `SELECT
      a.*,
      p.name as parent_name,
      p.slug as parent_slug,
      COALESCE((SELECT COUNT(*) FROM community_areas ca WHERE ca.area_id = a.id), 0) as community_count,
      0 as event_count,
      COALESCE((SELECT COUNT(*) FROM areas sub WHERE sub.parent_id = a.id AND sub.status = 'active'), 0) as neighborhood_count,
      '[]'::json as zip_codes
    FROM areas a
    JOIN space_areas sa ON sa.area_id = a.id
    LEFT JOIN areas p ON a.parent_id = p.id
    WHERE sa.space_id = $1 AND a.status = 'active'
    ORDER BY a.type ASC, a.name ASC`,
    [spaceId]
  )

  return rows.map((r) => ({
    ...r,
    community_count: Number(r.community_count),
    event_count: 0,
    neighborhood_count: Number(r.neighborhood_count),
    zip_codes: [],
  })) as AreaWithMeta[]
}

// ── Admin: Create area (superadmin only) ────────────────────

export async function createArea(data: {
  name: string
  slug: string
  type: "city" | "neighborhood" | "region"
  description?: string
  parentId?: string | null
  placeId?: string
}): Promise<{ id: string; slug: string }> {
  const rows = await sql(
    `INSERT INTO areas (name, slug, type, description, parent_id, place_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'active')
     RETURNING id, slug`,
    [
      data.name,
      data.slug,
      data.type,
      data.description || null,
      data.parentId || null,
      data.placeId || null,
    ]
  )

  return { id: rows[0].id as string, slug: rows[0].slug as string }
}

// ── Admin: Update area (superadmin only) ────────────────────

export async function updateArea(
  areaId: string,
  data: {
    name?: string
    slug?: string
    description?: string
    parentId?: string | null
    placeId?: string
    status?: "active" | "inactive"
  }
): Promise<void> {
  const updates: string[] = []
  const params: unknown[] = []
  let idx = 1

  if (data.name !== undefined) {
    updates.push(`name = $${idx++}`)
    params.push(data.name)
  }
  if (data.slug !== undefined) {
    updates.push(`slug = $${idx++}`)
    params.push(data.slug)
  }
  if (data.description !== undefined) {
    updates.push(`description = $${idx++}`)
    params.push(data.description)
  }
  if (data.parentId !== undefined) {
    updates.push(`parent_id = $${idx++}`)
    params.push(data.parentId)
  }
  if (data.placeId !== undefined) {
    updates.push(`place_id = $${idx++}`)
    params.push(data.placeId)
  }
  if (data.status !== undefined) {
    updates.push(`status = $${idx++}`)
    params.push(data.status)
  }

  if (updates.length === 0) return

  updates.push(`updated_at = NOW()`)
  params.push(areaId)

  await sql(
    `UPDATE areas SET ${updates.join(", ")} WHERE id = $${idx}`,
    params
  )
}

// ── Admin: Delete area (superadmin only) ────────────────────

export async function deleteArea(areaId: string): Promise<void> {
  // Soft delete by setting status to inactive
  await sql(`UPDATE areas SET status = 'inactive', updated_at = NOW() WHERE id = $1`, [areaId])
}

// ── Admin: Add zip codes to area ────────────────────────────

export async function addAreaZipCodes(areaId: string, zipCodes: string[]): Promise<void> {
  if (zipCodes.length === 0) return
  
  const values = zipCodes.map((_, i) => `($1, $${i + 2})`).join(", ")
  await sql(
    `INSERT INTO area_zip_codes (area_id, zip_code) VALUES ${values} ON CONFLICT DO NOTHING`,
    [areaId, ...zipCodes]
  )
}

// ── Admin: Remove zip code from area ────────────────────────

export async function removeAreaZipCode(areaId: string, zipCode: string): Promise<void> {
  await sql(`DELETE FROM area_zip_codes WHERE area_id = $1 AND zip_code = $2`, [areaId, zipCode])
}

// ── Get all areas (for dropdowns) ───────────────────────────

export async function getAllAreasForSelect(): Promise<{ id: string; name: string; type: string; parentName: string | null }[]> {
  const rows = await sql(
    `SELECT a.id, a.name, a.type, p.name as parent_name
     FROM areas a
     LEFT JOIN areas p ON a.parent_id = p.id
     WHERE a.status = 'active'
     ORDER BY a.type ASC, a.name ASC`
  )
  
  return rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    type: r.type as string,
    parentName: r.parent_name as string | null,
  }))
}

// ── Get areas for a community ───────────────────────────────

export async function getCommunityAreas(communityId: string): Promise<AreaWithMeta[]> {
  const rows = await sql(
    `SELECT
      a.*,
      p.name as parent_name,
      p.slug as parent_slug,
      COALESCE((SELECT COUNT(*) FROM community_areas ca2 WHERE ca2.area_id = a.id), 0) as community_count,
      0 as event_count,
      COALESCE((SELECT COUNT(*) FROM areas sub WHERE sub.parent_id = a.id AND sub.status = 'active'), 0) as neighborhood_count,
      '[]'::json as zip_codes
    FROM areas a
    JOIN community_areas ca ON ca.area_id = a.id
    LEFT JOIN areas p ON a.parent_id = p.id
    WHERE ca.community_id = $1 AND a.status = 'active'
    ORDER BY a.type ASC, a.name ASC`,
    [communityId]
  )

  return rows.map((r) => ({
    ...r,
    community_count: Number(r.community_count),
    event_count: 0,
    neighborhood_count: Number(r.neighborhood_count),
    zip_codes: [],
  })) as AreaWithMeta[]
}
