"use server"

import { sql } from "@/lib/db"
import type { UserProfile } from "@/types/user"

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const rows = await sql(
    `SELECT * FROM user_profiles WHERE neon_auth_id = $1`,
    [userId]
  )
  return (rows[0] as UserProfile) ?? null
}

export async function upsertUserProfile(
  userId: string,
  data: {
    display_name?: string
    bio?: string
    avatar_url?: string
    location_name?: string
    website_url?: string
  }
): Promise<UserProfile> {
  const rows = await sql(
    `INSERT INTO user_profiles (neon_auth_id, display_name, bio, avatar_url, location_name, website_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (neon_auth_id) DO UPDATE SET
       display_name = COALESCE(EXCLUDED.display_name, user_profiles.display_name),
       bio = COALESCE(EXCLUDED.bio, user_profiles.bio),
       avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
       location_name = COALESCE(EXCLUDED.location_name, user_profiles.location_name),
       website_url = COALESCE(EXCLUDED.website_url, user_profiles.website_url),
       updated_at = now()
     RETURNING *`,
    [
      userId,
      data.display_name ?? null,
      data.bio ?? null,
      data.avatar_url ?? null,
      data.location_name ?? null,
      data.website_url ?? null,
    ]
  )
  return rows[0] as UserProfile
}

export async function getUserCommunities(userId: string) {
  const rows = await sql(
    `SELECT
      cm.id, cm.community_id, cm.user_id, cm.role, cm.status,
      cm.notification_preference, cm.joined_at,
      c.name as community_name, c.slug as community_slug,
      c.cover_image_url as community_cover_image_url
    FROM community_members cm
    JOIN communities c ON c.id = cm.community_id
    WHERE cm.user_id = $1 AND cm.status = 'active'
    ORDER BY cm.joined_at DESC`,
    [userId]
  )
  return rows
}

export async function getUserStats(userId: string) {
  const communities = await sql(
    `SELECT COUNT(*) as count FROM community_members WHERE user_id = $1 AND status = 'active'`,
    [userId]
  )
  let eventCount = 0
  try {
    const events = await sql(
      `SELECT COUNT(*) as count FROM event_rsvps WHERE user_id = $1 AND status = 'going'`,
      [userId]
    )
    eventCount = Number(events[0]?.count ?? 0)
  } catch {
    // event_rsvps may not have a status column
  }
  return {
    communityCount: Number(communities[0]?.count ?? 0),
    eventCount,
  }
}
