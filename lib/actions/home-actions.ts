"use server"

import { sql } from "@/lib/db"
import { getAuthenticatedUser } from "@/lib/mock-user"
import type { EventWithMeta } from "@/types/event"

// ── Home page event sections ──────────────────────────────────────────
// All queries: published events only, future only (end_time > NOW()),
// no duplicates across sections, ordered soonest first.

export interface HomeEventSections {
  attending: EventWithMeta[]
  interested: EventWithMeta[]
  fromSpaces: EventWithMeta[]
  discover: EventWithMeta[]
}

const EVENT_COLS = `
  e.*,
  c.name   AS community_name,
  c.slug   AS community_slug,
  s.name   AS space_name,
  s.slug   AS space_slug,
  r.status AS current_user_rsvp
`

export async function getHomeEvents(): Promise<HomeEventSections> {
  const user = await getAuthenticatedUser()

  if (!user) {
    // Guest: just return public upcoming events in discover
    const rows = await sql(
      `SELECT ${EVENT_COLS}
       FROM events e
       JOIN communities c ON c.id = e.community_id
       LEFT JOIN spaces s ON s.id = e.space_id
       LEFT JOIN event_rsvps r ON r.event_id = e.id AND r.user_id = $1
       WHERE e.status = 'published'
         AND c.visibility = 'public'
         AND e.end_time > NOW()
       ORDER BY e.start_time ASC
       LIMIT 6`,
      ["guest"]
    )
    return {
      attending: [],
      interested: [],
      fromSpaces: [],
      discover: rows as EventWithMeta[],
    }
  }

  const userId = user.id

  // 1. Attending — RSVP = going, future only
  const attending = await sql(
    `SELECT ${EVENT_COLS}
     FROM events e
     JOIN communities c ON c.id = e.community_id
     LEFT JOIN spaces s ON s.id = e.space_id
     JOIN event_rsvps r ON r.event_id = e.id AND r.user_id = $1
     WHERE e.status = 'published'
       AND e.end_time > NOW()
       AND r.status = 'going'
     ORDER BY e.start_time ASC
     LIMIT 10`,
    [userId]
  )

  // 2. Interested — RSVP = interested, not already going
  const attendingIds = (attending as EventWithMeta[]).map((e) => e.id)
  const interested = await sql(
    `SELECT ${EVENT_COLS}
     FROM events e
     JOIN communities c ON c.id = e.community_id
     LEFT JOIN spaces s ON s.id = e.space_id
     JOIN event_rsvps r ON r.event_id = e.id AND r.user_id = $1
     WHERE e.status = 'published'
       AND e.end_time > NOW()
       AND r.status = 'interested'
     ORDER BY e.start_time ASC
     LIMIT 10`,
    [userId]
  )

  // 3. Following — ALL events from communities the user is a member of,
  //    regardless of RSVP status (includes attending + interested + unRSVPed).
  //    Sorted soonest first, deduplicated by id in JS.
  const fromSpaces = await sql(
    `SELECT ${EVENT_COLS}
     FROM events e
     JOIN communities c ON c.id = e.community_id
     LEFT JOIN spaces s ON s.id = e.space_id
     LEFT JOIN event_rsvps r ON r.event_id = e.id AND r.user_id = $1
     JOIN community_members cm ON cm.community_id = e.community_id AND cm.user_id = $1
     WHERE e.status = 'published'
       AND e.end_time > NOW()
     ORDER BY e.start_time ASC
     LIMIT 30`,
    [userId]
  )

  // 4. Discover — public events NOT in any community the user has joined
  const fromSpacesIds = (fromSpaces as EventWithMeta[]).map((e) => e.id)
  const discoverExclude =
    fromSpacesIds.length > 0
      ? `AND e.id NOT IN (${fromSpacesIds.map((_, i) => `$${i + 2}`).join(",")})`
      : ""

  const discover = await sql(
    `SELECT ${EVENT_COLS}
     FROM events e
     JOIN communities c ON c.id = e.community_id
     LEFT JOIN spaces s ON s.id = e.space_id
     LEFT JOIN event_rsvps r ON r.event_id = e.id AND r.user_id = $1
     LEFT JOIN community_members cm ON cm.community_id = e.community_id AND cm.user_id = $1
     WHERE e.status = 'published'
       AND c.visibility = 'public'
       AND e.end_time > NOW()
       AND cm.user_id IS NULL
       ${discoverExclude}
     ORDER BY e.start_time ASC
     LIMIT 20`,
    [userId, ...fromSpacesIds]
  )

  return {
    attending: attending as EventWithMeta[],
    interested: interested as EventWithMeta[],
    fromSpaces: fromSpaces as EventWithMeta[],
    discover: discover as EventWithMeta[],
  }
}
