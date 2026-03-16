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
    `SELECT
        e.*,
        c.name as community_name,
        c.slug as community_slug,
        c.avatar_url as community_avatar,
        s.name as space_name,
        s.slug as space_slug,
        r.status as current_user_rsvp,
        u.display_name as organizer_name,
        u.avatar_url as organizer_avatar
      FROM events e
      LEFT JOIN communities c ON e.community_id = c.id
      LEFT JOIN spaces s ON e.space_id = s.id
      LEFT JOIN event_rsvps r ON r.event_id = e.id AND r.user_id = $${idx}
      LEFT JOIN auth_users u ON e.created_by = u.id::text
      ${where}
      ORDER BY e.start_time ASC, e.id
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
      c.avatar_url as community_avatar,
      s.name as space_name,
      s.slug as space_slug,
      r.status as current_user_rsvp,
      u.display_name as organizer_name,
      u.avatar_url as organizer_avatar
    FROM events e
    JOIN communities c ON e.community_id = c.id
    LEFT JOIN spaces s ON e.space_id = s.id
    LEFT JOIN event_rsvps r ON r.event_id = e.id AND r.user_id = $1
    LEFT JOIN auth_users u ON e.created_by = u.id::text
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
      c.avatar_url as community_avatar,
      s.name as space_name,
      s.slug as space_slug,
      r.status as current_user_rsvp,
      u.display_name as organizer_name,
      u.avatar_url as organizer_avatar
    FROM events e
    LEFT JOIN communities c ON e.community_id = c.id
    LEFT JOIN spaces s ON e.space_id = s.id
    LEFT JOIN event_rsvps r ON r.event_id = e.id AND r.user_id = $1
    LEFT JOIN auth_users u ON e.created_by = u.id::text
    WHERE e.slug = $2 ${communityFilter}
    LIMIT 1`,
    params
  )

  return (rows[0] as EventWithMeta) ?? null
}

// ── Get event by slug (public - no auth required) ───────────

export async function getPublicEventBySlug(
  slug: string
): Promise<EventWithMeta | null> {
  const rows = await sql(
    `SELECT
      e.*,
      c.name as community_name,
      c.slug as community_slug,
      c.avatar_url as community_avatar,
      s.name as space_name,
      s.slug as space_slug,
      NULL as current_user_rsvp,
      u.display_name as organizer_name,
      u.avatar_url as organizer_avatar
    FROM events e
    LEFT JOIN communities c ON e.community_id = c.id
    LEFT JOIN spaces s ON e.space_id = s.id
    LEFT JOIN auth_users u ON e.created_by = u.id::text
    WHERE e.slug = $1 AND (e.visibility = 'public' OR e.visibility = 'unlisted')
    LIMIT 1`,
    [slug]
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
      cover_image_url, event_type, visibility, status,
      start_time, end_time, timezone,
      location_name, location_address, latitude, longitude,
      virtual_link, max_attendees, created_by, organizer_id,
      template_id, invitation_image_url, invitation_message,
      additional_info, dress_code, contact_info, gallery_images, rsvp_deadline
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, 'published',
      $9, $10, $11,
      $12, $13, $14, $15,
      $16, $17, $18, $18,
      $19, $20, $21,
      $22, $23, $24, $25, $26
    ) RETURNING slug`,
    [
      data.community_id || null,
      data.space_id || null,
      data.title,
      slug,
      data.description || null,
      data.cover_image_url || null,
      data.event_type,
      data.visibility || "public",
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
      // Invitation fields
      data.template_id || null,
      data.invitation_image_url || null,
      data.invitation_message || null,
      data.additional_info || null,
      data.dress_code || null,
      data.contact_info || null,
      data.gallery_images && data.gallery_images.length > 0 ? data.gallery_images : null,
      data.rsvp_deadline || null,
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
  if (data.visibility !== undefined) {
    sets.push(`visibility = $${idx++}`)
    params.push(data.visibility)
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
  if (data.contact_info !== undefined) {
    sets.push(`contact_info = $${idx++}`)
    params.push(data.contact_info)
  }
  if (data.template_id !== undefined) {
    sets.push(`template_id = $${idx++}`)
    params.push(data.template_id)
  }
  if (data.invitation_image_url !== undefined) {
    sets.push(`invitation_image_url = $${idx++}`)
    params.push(data.invitation_image_url)
  }
  if (data.invitation_message !== undefined) {
    sets.push(`invitation_message = $${idx++}`)
    params.push(data.invitation_message)
  }
  if (data.additional_info !== undefined) {
    sets.push(`additional_info = $${idx++}`)
    params.push(data.additional_info)
  }
  if (data.dress_code !== undefined) {
    sets.push(`dress_code = $${idx++}`)
    params.push(data.dress_code)
  }
  if (data.gallery_images !== undefined) {
    sets.push(`gallery_images = $${idx++}`)
    params.push(data.gallery_images)
  }
  if (data.rsvp_deadline !== undefined) {
    sets.push(`rsvp_deadline = $${idx++}`)
    params.push(data.rsvp_deadline)
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

// ── Share event to multiple communities ─────────────────────

export async function shareEventToCommunities(
  eventId: string,
  communityIds: string[]
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser()

  if (communityIds.length === 0) {
    return { ok: false, error: "Please select at least one community." }
  }

  // Verify user owns the event
  const event = await sql(
    `SELECT id, created_by FROM events WHERE id = $1`,
    [eventId]
  )
  if (event.length === 0) return { ok: false, error: "Event not found." }
  if (event[0].created_by !== user.id) {
    return { ok: false, error: "You can only share events you created." }
  }

  // Verify user is a member of all selected communities
  const memberships = await sql(
    `SELECT community_id FROM community_members 
     WHERE community_id = ANY($1::uuid[]) AND user_id = $2 AND status = 'active'`,
    [communityIds, user.id]
  )
  const memberCommunityIds = new Set(memberships.map((m: { community_id: string }) => m.community_id))
  const notMember = communityIds.find((id) => !memberCommunityIds.has(id))
  if (notMember) {
    return { ok: false, error: "You must be a member of all selected communities." }
  }

  // Upsert into junction table for each community
  for (const communityId of communityIds) {
    await sql(
      `INSERT INTO event_community_shares (event_id, community_id, shared_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id, community_id) DO NOTHING`,
      [eventId, communityId, user.id]
    )
  }

  // Keep events.community_id pointing at the first (primary) community for backwards compat
  await sql(
    `UPDATE events SET community_id = $1, updated_at = NOW() WHERE id = $2`,
    [communityIds[0], eventId]
  )

  return { ok: true }
}

// Keep single-community signature for backward compat
export async function shareEventToCommunity(
  eventId: string,
  communityId: string
): Promise<{ ok: boolean; error?: string }> {
  return shareEventToCommunities(eventId, [communityId])
}

// ── Get communities an event is shared to ────────────────────

export async function getEventSharedCommunities(
  eventId: string
): Promise<{ id: string; name: string; slug: string }[]> {
  const rows = await sql(
    `SELECT c.id, c.name, c.slug
     FROM event_community_shares ecs
     JOIN communities c ON c.id = ecs.community_id
     WHERE ecs.event_id = $1
     ORDER BY ecs.shared_at ASC`,
    [eventId]
  )
  return rows as { id: string; name: string; slug: string }[]
}

// ── Unshare event from a specific community ──────────────────

export async function unshareEventFromCommunity(
  eventId: string,
  communityId?: string
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser()

  const event = await sql(
    `SELECT id, created_by FROM events WHERE id = $1`,
    [eventId]
  )
  if (event.length === 0) return { ok: false, error: "Event not found." }
  if (event[0].created_by !== user.id) {
    return { ok: false, error: "You can only modify events you created." }
  }

  if (communityId) {
    // Remove from specific community
    await sql(
      `DELETE FROM event_community_shares WHERE event_id = $1 AND community_id = $2`,
      [eventId, communityId]
    )
    // If this was the primary community, update events.community_id to next share or null
    const remaining = await sql(
      `SELECT community_id FROM event_community_shares WHERE event_id = $1 ORDER BY shared_at ASC LIMIT 1`,
      [eventId]
    )
    await sql(
      `UPDATE events SET community_id = $1, updated_at = NOW() WHERE id = $2`,
      [remaining[0]?.community_id ?? null, eventId]
    )
  } else {
    // Remove from all communities
    await sql(`DELETE FROM event_community_shares WHERE event_id = $1`, [eventId])
    await sql(
      `UPDATE events SET community_id = NULL, space_id = NULL, updated_at = NOW() WHERE id = $1`,
      [eventId]
    )
  }

  return { ok: true }
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
