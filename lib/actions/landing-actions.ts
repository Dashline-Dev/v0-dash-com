"use server"

import { sql } from "@/lib/db"
import type { EventWithMeta } from "@/types/event"
import type { CommunityListItem } from "@/types/community"

const EVENT_COLS = `
  e.*,
  c.name   AS community_name,
  c.slug   AS community_slug,
  s.name   AS space_name,
  s.slug   AS space_slug,
  NULL::text AS current_user_rsvp
`

export interface GuestLandingData {
  topEvents: EventWithMeta[]
  topCommunities: CommunityListItem[]
  totalEvents: number
  totalCommunities: number
}

export async function getGuestLandingData(): Promise<GuestLandingData> {
  const [eventRows, communityRows, countRows] = await Promise.all([
    // Top 6 upcoming public events, soonest first
    sql(
      `SELECT ${EVENT_COLS}
       FROM events e
       JOIN communities c ON c.id = e.community_id
       LEFT JOIN spaces s ON s.id = e.space_id
       WHERE e.status = 'published'
         AND c.visibility = 'public'
         AND e.end_time > NOW()
       ORDER BY e.start_time ASC
       LIMIT 6`,
      []
    ),

    // Top 6 public communities ordered by member_count DESC
    sql(
      `SELECT
         c.*,
         COALESCE(
           (SELECT json_agg(ct.tag) FROM community_tags ct WHERE ct.community_id = c.id),
           '[]'::json
         ) AS tags,
         NULL AS current_user_role
       FROM communities c
       WHERE c.visibility != 'private'
       ORDER BY c.member_count DESC
       LIMIT 6`,
      []
    ),

    // Aggregate counts for the hero stats bar
    sql(
      `SELECT
         (SELECT COUNT(*) FROM communities WHERE visibility != 'private') AS total_communities,
         (SELECT COUNT(*) FROM events WHERE status = 'published' AND end_time > NOW()) AS total_events`,
      []
    ),
  ])

  const topEvents = eventRows as EventWithMeta[]
  const topCommunities = (communityRows as (CommunityListItem & { tags: unknown })[]).map(
    (row) => ({
      ...row,
      tags: Array.isArray(row.tags) ? row.tags : JSON.parse(row.tags as string),
      current_user_role: null,
    })
  ) as CommunityListItem[]

  const totalCommunities = Number(countRows[0]?.total_communities ?? 0)
  const totalEvents = Number(countRows[0]?.total_events ?? 0)

  return { topEvents, topCommunities, totalEvents, totalCommunities }
}
