"use server"

import { neon } from "@neondatabase/serverless"
import type {
  SpaceWithMeta,
  SpaceMember,
  CreateSpaceData,
  UpdateSpaceData,
  SpaceListParams,
} from "@/types/space"
import { getCurrentUser } from "@/lib/mock-user"
import {
  linkSpaceToAreasByZipCode,
  inheritAreasFromCommunity,
} from "@/lib/actions/area-actions"

const sql = neon(process.env.DATABASE_URL!)

// ─── Queries ────────────────────────────────────────────────────────────────

export async function getSpaces(params: SpaceListParams = {}): Promise<{
  spaces: SpaceWithMeta[]
  total: number
}> {
  const { community_id, search, type, status = "active", limit = 20, offset = 0 } = params
  const user = await getCurrentUser()

  const conditions: string[] = []
  const values: unknown[] = []
  let paramIndex = 1

  if (community_id) {
    conditions.push(`s.community_id = $${paramIndex++}`)
    values.push(community_id)
  }

  if (search) {
    conditions.push(`(s.name ILIKE $${paramIndex} OR s.description ILIKE $${paramIndex})`)
    values.push(`%${search}%`)
    paramIndex++
  }

  if (type) {
    conditions.push(`s.type = $${paramIndex++}`)
    values.push(type)
  }

  if (status) {
    conditions.push(`s.status = $${paramIndex++}`)
    values.push(status)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

  const countResult = await sql(`SELECT COUNT(*) as total FROM spaces s ${where}`, values)
  const total = parseInt(countResult[0].total, 10)

  const spacesResult = await sql(
    `SELECT
      s.*,
      c.name as community_name,
      c.slug as community_slug,
      COUNT(DISTINCT sm.id) as member_count,
      (SELECT role FROM space_members WHERE space_id = s.id AND user_id = $${paramIndex}) as current_user_role
    FROM spaces s
    LEFT JOIN communities c ON s.community_id = c.id
    LEFT JOIN space_members sm ON sm.space_id = s.id
    ${where}
    GROUP BY s.id, c.name, c.slug
    ORDER BY s.created_at DESC
    LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}`,
    [...values, user.id, limit, offset]
  )

  return { spaces: spacesResult as SpaceWithMeta[], total }
}

export async function getSpaceBySlug(
  slug: string,
  communityId?: string
): Promise<SpaceWithMeta | null> {
  const user = await getCurrentUser()

  let result
  if (communityId) {
    result = await sql(
      `SELECT
        s.*,
        c.name as community_name,
        c.slug as community_slug,
        COUNT(DISTINCT sm.id) as member_count,
        (SELECT role FROM space_members WHERE space_id = s.id AND user_id = $3) as current_user_role
      FROM spaces s
      LEFT JOIN communities c ON s.community_id = c.id
      LEFT JOIN space_members sm ON sm.space_id = s.id
      WHERE s.slug = $1 AND s.community_id = $2
      GROUP BY s.id, c.name, c.slug`,
      [slug, communityId, user.id]
    )
  } else {
    result = await sql(
      `SELECT
        s.*,
        c.name as community_name,
        c.slug as community_slug,
        COUNT(DISTINCT sm.id) as member_count,
        (SELECT role FROM space_members WHERE space_id = s.id AND user_id = $2) as current_user_role
      FROM spaces s
      LEFT JOIN communities c ON s.community_id = c.id
      LEFT JOIN space_members sm ON sm.space_id = s.id
      WHERE s.slug = $1
      GROUP BY s.id, c.name, c.slug`,
      [slug, user.id]
    )
  }

  return (result[0] as SpaceWithMeta) || null
}

export async function getSpacesByCommunity(communitySlug: string): Promise<SpaceWithMeta[]> {
  const user = await getCurrentUser()

  const result = await sql(
    `SELECT
      s.*,
      c.name as community_name,
      c.slug as community_slug,
      COUNT(DISTINCT sm.id) as member_count,
      (SELECT role FROM space_members WHERE space_id = s.id AND user_id = $2) as current_user_role
    FROM spaces s
    JOIN communities c ON s.community_id = c.id
    LEFT JOIN space_members sm ON sm.space_id = s.id
    WHERE c.slug = $1 AND s.status = 'active'
    GROUP BY s.id, c.name, c.slug
    ORDER BY s.created_at ASC`,
    [communitySlug, user.id]
  )

  return result as SpaceWithMeta[]
}

export async function getSpaceMembers(spaceId: string): Promise<SpaceMember[]> {
  const result = await sql(
    `SELECT
       sm.id, sm.space_id, sm.user_id, sm.role, sm.joined_at,
       u.name AS user_name,
       u.avatar_url AS user_avatar_url
     FROM space_members sm
     LEFT JOIN users u ON u.id = sm.user_id
     WHERE sm.space_id = $1
     ORDER BY
       CASE sm.role WHEN 'admin' THEN 0 WHEN 'moderator' THEN 1 ELSE 2 END,
       sm.joined_at ASC`,
    [spaceId]
  )
  return result as SpaceMember[]
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export async function createSpace(data: CreateSpaceData): Promise<{ id: string; slug: string; community_slug?: string }> {
  const user = await getCurrentUser()

  // If creating within a community, verify the user is a member (admin or moderator)
  if (data.community_id) {
    const membership = await sql(
      `SELECT role FROM community_members
       WHERE community_id = $1 AND user_id = $2 AND status = 'active'`,
      [data.community_id, user.id]
    )
    if (membership.length === 0) {
      throw new Error("You must be a member of this community to create a space in it.")
    }
    const role = membership[0].role as string
    if (!["admin", "moderator", "owner"].includes(role)) {
      throw new Error("Only community admins and moderators can create spaces.")
    }
  }

  const result = await sql(
    `INSERT INTO spaces (community_id, name, slug, description, type, icon, cover_image_url, visibility, join_policy, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id, slug`,
    [
      data.community_id || null,
      data.name,
      data.slug,
      data.description || null,
      data.type,
      data.icon || null,
      data.cover_image_url || null,
      data.visibility,
      (data as { join_policy?: string }).join_policy || "open",
      user.id,
    ]
  )

  const spaceId = result[0].id

  // Creator becomes admin
  await sql(
    `INSERT INTO space_members (space_id, user_id, role) VALUES ($1, $2, 'admin')`,
    [spaceId, user.id]
  )

  // Link space to areas: inherit from parent community first, then also
  // try name-based matching from the community's location_name
  if (data.community_id) {
    const community = await sql(
      `SELECT slug, location_name FROM communities WHERE id = $1`,
      [data.community_id]
    )
    if (community[0]) {
      // Inherit areas already linked to the parent community
      await inheritAreasFromCommunity(spaceId as string, data.community_id)
      // Also attempt name/zip based linking from the community's location
      if (community[0].location_name) {
        await linkSpaceToAreasByZipCode(spaceId as string, community[0].location_name as string)
      }
    }
    const community_slug = community[0]?.slug as string | undefined
    return { id: spaceId as string, slug: data.slug, community_slug }
  }

  return { id: spaceId as string, slug: data.slug }
}

export async function updateSpace(
  spaceId: string,
  data: UpdateSpaceData
): Promise<void> {
  const fields: string[] = []
  const values: unknown[] = []
  let paramIndex = 1

  if (data.name !== undefined) {
    fields.push(`name = $${paramIndex++}`)
    values.push(data.name)
  }
  if (data.description !== undefined) {
    fields.push(`description = $${paramIndex++}`)
    values.push(data.description)
  }
  if (data.type !== undefined) {
    fields.push(`type = $${paramIndex++}`)
    values.push(data.type)
  }
  if (data.icon !== undefined) {
    fields.push(`icon = $${paramIndex++}`)
    values.push(data.icon)
  }
  if (data.cover_image_url !== undefined) {
    fields.push(`cover_image_url = $${paramIndex++}`)
    values.push(data.cover_image_url)
  }
  if (data.visibility !== undefined) {
    fields.push(`visibility = $${paramIndex++}`)
    values.push(data.visibility)
  }
  if (data.join_policy !== undefined) {
    fields.push(`join_policy = $${paramIndex++}`)
    values.push(data.join_policy)
  }
  if (data.status !== undefined) {
    fields.push(`status = $${paramIndex++}`)
    values.push(data.status)
  }

  if (fields.length === 0) return

  fields.push(`updated_at = now()`)
  values.push(spaceId)

  await sql(
    `UPDATE spaces SET ${fields.join(", ")} WHERE id = $${paramIndex}`,
    values
  )
}

export async function deleteSpace(spaceId: string): Promise<void> {
  await sql(`DELETE FROM spaces WHERE id = $1`, [spaceId])
}

// ─── Membership ─────────────────────────────────────────────────────────────

export async function joinSpace(spaceId: string): Promise<void> {
  const user = await getCurrentUser()
  await sql(
    `INSERT INTO space_members (space_id, user_id, role) VALUES ($1, $2, 'member') ON CONFLICT (space_id, user_id) DO NOTHING`,
    [spaceId, user.id]
  )
}

export async function leaveSpace(spaceId: string): Promise<void> {
  const user = await getCurrentUser()
  await sql(
    `DELETE FROM space_members WHERE space_id = $1 AND user_id = $2 AND role != 'admin'`,
    [spaceId, user.id]
  )
}

export async function updateSpaceMemberRole(
  spaceId: string,
  userId: string,
  role: string
): Promise<void> {
  await sql(
    `UPDATE space_members SET role = $1 WHERE space_id = $2 AND user_id = $3`,
    [role, spaceId, userId]
  )
}

export async function removeSpaceMember(
  spaceId: string,
  userId: string
): Promise<void> {
  await sql(
    `DELETE FROM space_members WHERE space_id = $1 AND user_id = $2`,
    [spaceId, userId]
  )
}
