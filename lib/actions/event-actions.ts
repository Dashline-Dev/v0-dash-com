"use server"

import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/mock-user"
import type {
  EventWithMeta,
  CreateEventData,
  UpdateEventData,
  EventRsvp,
  RsvpStatus,
} from "@/types/event"

const sql = neon(process.env.DATABASE_URL!)

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

// ── List events ──────────────────────────────────────────────

export async function getEvents(opts?: {
  communityId?: string
  spaceId?: string
  status?: string
  search?: string
  upcoming?: boolean
  limit?: number
  offset?: number
}): Promise<{ events: EventWithMeta[]; total: number }> {
  const user = await getCurrentUser()
  const limit = opts?.limit ?? 12
  const offset = opts?.offset ?? 0

  const conditions: string[] = []
  const params: unknown[] = []
  let idx = 1

  if (opts?.communityId) {
    conditions.push(`e.community_id = $${idx++}`)
    params.push(opts.communityId)
  }
  if (opts?.spaceId) {
    conditions.push(`e.space_id = $${idx++}`)
    params.push(opts.spaceId)
  }
  if (opts?.status) {
    conditions.push(`e.status = $${idx++}`)
    params.push(opts.status)
  } else {
    conditions.push(`e.status = 'published'`)
  }
  if (opts?.search) {
    conditions.push(`(e.title ILIKE $${idx} OR e.description ILIKE $${idx})`)
    params.push(`%${opts.search}%`)
    idx++
  }
  if (opts?.upcoming) {
    conditions.push(`e.end_time > NOW()`)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

  const countResult = await sql(
    `SELECT COUNT(*) as total FROM events e ${where}`,
    params
  )

  const rows = await sql(
    `SELECT DISTINCT ON (e.id)
      e.*,
      c.name as community_name,
      c.slug as community_slug,
      s.name as space_name,
      s.slug as space_slug,
      r.status as current_user_rsvp
    FROM events e
    JOIN communities c ON e.community_id = c.id
    LEFT JOIN spaces s ON e.space_id = s.id
    LEFT JOIN event_rsvps r ON r.event_id = e.id AND r.user_id = $${idx}
    ${where}
    ORDER BY e.id, e.start_time ASC
    LIMIT $${idx + 1} OFFSET $${idx + 2}`,
    [...params, user.id, limit, offset]
  )

  return {
    events: rows as EventWithMeta[],
    total: Number(countResult[0].total),
  }
}

// ── Get events by community slug ────────────────────────────

export async function getEventsByCommunity(
  communitySlug: string,
  opts?: { upcoming?: boolean; limit?: number }
): Promise<EventWithMeta[]> {
  const user = await getCurrentUser()
  const limit = opts?.limit ?? 20

  const upcomingFilter = opts?.upcoming ? `AND e.end_time > NOW()` : ""

  const rows = await sql(
    `SELECT
      e.*,
      c.name as community_name,
      c.slug as community_slug,
      s.name as space_name,
      s.slug as space_slug,
      r.status as current_user_rsvp
    FROM events e
    JOIN communities c ON e.community_id = c.id
    LEFT JOIN spaces s ON e.space_id = s.id
    LEFT JOIN event_rsvps r ON r.event_id = e.id AND r.user_id = $1
    WHERE c.slug = $2 AND e.status = 'published' ${upcomingFilter}
    ORDER BY e.start_time ASC
    LIMIT $3`,
    [user.id, communitySlug, limit]
  )

  return rows as EventWithMeta[]
}

// ── Get single event ────────────────────────────────────────

export async function getEventBySlug(
  slug: string,
  communitySlug?: string
): Promise<EventWithMeta | null> {
  const user = await getCurrentUser()

  const communityFilter = communitySlug ? `AND c.slug = $3` : ""
  const params: unknown[] = [user.id, slug]
  if (communitySlug) params.push(communitySlug)

  const rows = await sql(
    `SELECT
      e.*,
      c.name as community_name,
      c.slug as community_slug,
      s.name as space_name,
      s.slug as space_slug,
      r.status as current_user_rsvp
    FROM events e
    JOIN communities c ON e.community_id = c.id
    LEFT JOIN spaces s ON e.space_id = s.id
    LEFT JOIN event_rsvps r ON r.event_id = e.id AND r.user_id = $1
    WHERE e.slug = $2 ${communityFilter}
    LIMIT 1`,
    params
  )

  return (rows[0] as EventWithMeta) ?? null
}

// ── Create event ────────────────────────────────────────────

export async function createEvent(data: CreateEventData): Promise<string> {
  const user = await getCurrentUser()
  const slug = slugify(data.title) + "-" + Date.now().toString(36)

  const rows = await sql(
    `INSERT INTO events (
      community_id, space_id, title, slug, description,
      cover_image_url, event_type, status,
      start_time, end_time, timezone,
      location_name, location_address, latitude, longitude,
      virtual_link, max_attendees, created_by
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, 'published',
      $8, $9, $10,
      $11, $12, $13, $14,
      $15, $16, $17
    ) RETURNING slug`,
    [
      data.community_id,
      data.space_id || null,
      data.title,
      slug,
      data.description || null,
      data.cover_image_url || null,
      data.event_type,
      data.start_time,
      data.end_time,
      data.timezone || "UTC",
      data.location_name || null,
      data.location_address || null,
      data.latitude || null,
      data.longitude || null,
      data.virtual_link || null,
      data.max_attendees || null,
      user.id,
    ]
  )

  // Auto-RSVP creator as going
  await sql(
    `INSERT INTO event_rsvps (event_id, user_id, status)
     SELECT id, $1, 'going' FROM events WHERE slug = $2
     ON CONFLICT (event_id, user_id) DO NOTHING`,
    [user.id, rows[0].slug]
  )

  await sql(
    `UPDATE events SET rsvp_count = rsvp_count + 1 WHERE slug = $1`,
    [rows[0].slug]
  )

  return rows[0].slug as string
}

// ── Update event ────────────────────────────────────────────

export async function updateEvent(
  eventId: string,
  data: UpdateEventData
): Promise<void> {
  const sets: string[] = []
  const params: unknown[] = []
  let idx = 1

  if (data.title !== undefined) {
    sets.push(`title = $${idx++}`)
    params.push(data.title)
  }
  if (data.description !== undefined) {
    sets.push(`description = $${idx++}`)
    params.push(data.description)
  }
  if (data.cover_image_url !== undefined) {
    sets.push(`cover_image_url = $${idx++}`)
    params.push(data.cover_image_url)
  }
  if (data.event_type !== undefined) {
    sets.push(`event_type = $${idx++}`)
    params.push(data.event_type)
  }
  if (data.status !== undefined) {
    sets.push(`status = $${idx++}`)
    params.push(data.status)
  }
  if (data.start_time !== undefined) {
    sets.push(`start_time = $${idx++}`)
    params.push(data.start_time)
  }
  if (data.end_time !== undefined) {
    sets.push(`end_time = $${idx++}`)
    params.push(data.end_time)
  }
  if (data.timezone !== undefined) {
    sets.push(`timezone = $${idx++}`)
    params.push(data.timezone)
  }
  if (data.location_name !== undefined) {
    sets.push(`location_name = $${idx++}`)
    params.push(data.location_name)
  }
  if (data.location_address !== undefined) {
    sets.push(`location_address = $${idx++}`)
    params.push(data.location_address)
  }
  if (data.latitude !== undefined) {
    sets.push(`latitude = $${idx++}`)
    params.push(data.latitude)
  }
  if (data.longitude !== undefined) {
    sets.push(`longitude = $${idx++}`)
    params.push(data.longitude)
  }
  if (data.virtual_link !== undefined) {
    sets.push(`virtual_link = $${idx++}`)
    params.push(data.virtual_link)
  }
  if (data.max_attendees !== undefined) {
    sets.push(`max_attendees = $${idx++}`)
    params.push(data.max_attendees)
  }

  if (sets.length === 0) return

  sets.push(`updated_at = NOW()`)

  await sql(
    `UPDATE events SET ${sets.join(", ")} WHERE id = $${idx}`,
    [...params, eventId]
  )
}

// ── Delete event ────────────────────────────────────────────

export async function deleteEvent(eventId: string): Promise<void> {
  await sql(`DELETE FROM events WHERE id = $1`, [eventId])
}

// ── RSVP ────────────────────────────────────────────────────

export async function rsvpToEvent(
  eventId: string,
  status: RsvpStatus
): Promise<void> {
  const user = await getCurrentUser()

  // Check existing RSVP
  const existing = await sql(
    `SELECT status FROM event_rsvps WHERE event_id = $1 AND user_id = $2`,
    [eventId, user.id]
  )

  const hadGoingRsvp = existing.length > 0 && existing[0].status === "going"
  const isNowGoing = status === "going"

  // Upsert the RSVP
  await sql(
    `INSERT INTO event_rsvps (event_id, user_id, status)
     VALUES ($1, $2, $3)
     ON CONFLICT (event_id, user_id) DO UPDATE SET status = $3, rsvped_at = NOW()`,
    [eventId, user.id, status]
  )

  // Update rsvp_count: only count 'going' status
  if (!hadGoingRsvp && isNowGoing) {
    await sql(`UPDATE events SET rsvp_count = rsvp_count + 1 WHERE id = $1`, [eventId])
  } else if (hadGoingRsvp && !isNowGoing) {
    await sql(`UPDATE events SET rsvp_count = GREATEST(rsvp_count - 1, 0) WHERE id = $1`, [eventId])
  }
}

// ── Cancel RSVP ─────────────────────────────────────────────

export async function cancelRsvp(eventId: string): Promise<void> {
  const user = await getCurrentUser()

  const existing = await sql(
    `SELECT status FROM event_rsvps WHERE event_id = $1 AND user_id = $2`,
    [eventId, user.id]
  )

  if (existing.length === 0) return

  const wasGoing = existing[0].status === "going"

  await sql(
    `DELETE FROM event_rsvps WHERE event_id = $1 AND user_id = $2`,
    [eventId, user.id]
  )

  if (wasGoing) {
    await sql(`UPDATE events SET rsvp_count = GREATEST(rsvp_count - 1, 0) WHERE id = $1`, [eventId])
  }
}

// ── Get RSVPs for event ─────────────────────────────────────

export async function getEventRsvps(
  eventId: string,
  status?: RsvpStatus
): Promise<EventRsvp[]> {
  const filter = status ? `AND r.status = $2` : ""
  const params: unknown[] = [eventId]
  if (status) params.push(status)

  const rows = await sql(
    `SELECT r.* FROM event_rsvps r
     WHERE r.event_id = $1 ${filter}
     ORDER BY r.rsvped_at DESC`,
    params
  )

  return rows as EventRsvp[]
}

// ── Get events for calendar (month view) ─────────────────────

export async function getEventsForMonth(
  year: number,
  month: number,
  communityId?: string
): Promise<EventWithMeta[]> {
  const user = await getCurrentUser()
  const startOfMonth = new Date(year, month - 1, 1).toISOString()
  const endOfMonth = new Date(year, month, 0, 23, 59, 59).toISOString()

  const communityFilter = communityId ? `AND e.community_id = $4` : ""
  const params: unknown[] = [user.id, startOfMonth, endOfMonth]
  if (communityId) params.push(communityId)

  const rows = await sql(
    `SELECT
      e.*,
      c.name as community_name,
      c.slug as community_slug,
      s.name as space_name,
      s.slug as space_slug,
      r.status as current_user_rsvp
    FROM events e
    JOIN communities c ON e.community_id = c.id
    LEFT JOIN spaces s ON e.space_id = s.id
    LEFT JOIN event_rsvps r ON r.event_id = e.id AND r.user_id = $1
    WHERE e.status = 'published'
      AND e.start_time >= $2
      AND e.start_time <= $3
      ${communityFilter}
    ORDER BY e.start_time ASC`,
    params
  )

  return rows as EventWithMeta[]
}
