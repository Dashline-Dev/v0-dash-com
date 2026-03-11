"use server"

import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/mock-user"
import {
  checkPermission,
  canModifyMember,
  getAssignableRoles,
  type Role,
  type PermissionContext,
  PERMISSIONS,
} from "@/lib/permissions"
import { logAuditEvent } from "@/lib/actions/audit-actions"
import type {
  Community,
  CommunityWithMeta,
  CommunityListItem,
  CommunityMember,
  CommunityRule,
  CommunityFilters,
  CreateCommunityInput,
  UpdateCommunityInput,
  PaginatedResult,
  MemberRole,
} from "@/types/community"
import { revalidatePath } from "next/cache"

// ── Permission context helper ──────────────────────────────────────────

async function getPermCtx(
  userId: string,
  communityId: string
): Promise<PermissionContext> {
  const [memberRows, userRows] = await Promise.all([
    sql(
      `SELECT role FROM community_members WHERE community_id = $1 AND user_id = $2 AND status = 'active'`,
      [communityId, userId]
    ),
    sql(`SELECT is_superadmin FROM auth_users WHERE id = $1::uuid`, [userId]).catch(
      () => [] as Record<string, unknown>[]
    ),
  ])
  const userRole = (memberRows[0]?.role as Role) || "guest"
  const isSuperAdmin = userRows[0]?.is_superadmin === true
  return { userRole, isSuperAdmin }
}

// ── List Communities ───────────────────────────────────────────────────

export async function getCommunities(
  filters: CommunityFilters = {}
): Promise<PaginatedResult<CommunityListItem>> {
  const { search, category, cursor, limit = 12 } = filters
  const user = await getCurrentUser()

  let query = `
    SELECT
      c.*,
      COALESCE(
        (SELECT json_agg(ct.tag) FROM community_tags ct WHERE ct.community_id = c.id),
        '[]'::json
      ) AS tags,
      (
        SELECT cm.role FROM community_members cm
        WHERE cm.community_id = c.id AND cm.user_id = $1 AND cm.status = 'active'
      ) AS current_user_role
    FROM communities c
    WHERE c.visibility != 'private'
  `

  const params: unknown[] = [user.id]
  let paramIndex = 2

  if (search && search.trim()) {
    query += ` AND (c.name ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex})`
    params.push(`%${search.trim()}%`)
    paramIndex++
  }

  if (category) {
    query += ` AND c.category = $${paramIndex}`
    params.push(category)
    paramIndex++
  }

  if (cursor) {
    query += ` AND c.created_at < $${paramIndex}`
    params.push(cursor)
    paramIndex++
  }

  query += ` ORDER BY c.created_at DESC LIMIT $${paramIndex}`
  params.push(limit + 1) // fetch one extra to check hasMore

  const rows = await sql(query, params)

  const hasMore = rows.length > limit
  const data = (hasMore ? rows.slice(0, limit) : rows).map((row) => ({
    ...row,
    tags: Array.isArray(row.tags) ? row.tags : JSON.parse(row.tags as string),
    current_user_role: row.current_user_role || null,
  })) as CommunityListItem[]

  return {
    data,
    nextCursor: hasMore ? data[data.length - 1].created_at : null,
    hasMore,
  }
}

// ── Get Single Community ───────────────────────────────────────────────

export async function getCommunityBySlug(
  slug: string
): Promise<CommunityWithMeta | null> {
  const user = await getCurrentUser()

  const rows = await sql(
    `
    SELECT
      c.*,
      COALESCE(
        (SELECT json_agg(ct.tag) FROM community_tags ct WHERE ct.community_id = c.id),
        '[]'::json
      ) AS tags,
      COALESCE(
        (SELECT json_agg(
          json_build_object('id', cr.id, 'community_id', cr.community_id, 'title', cr.title, 'description', cr.description, 'sort_order', cr.sort_order)
          ORDER BY cr.sort_order
        ) FROM community_rules cr WHERE cr.community_id = c.id),
        '[]'::json
      ) AS rules,
      (
        SELECT cm.role FROM community_members cm
        WHERE cm.community_id = c.id AND cm.user_id = $2 AND cm.status = 'active'
      ) AS current_user_role
    FROM communities c
    WHERE c.slug = $1
    `,
    [slug, user.id]
  )

  if (rows.length === 0) return null

  const row = rows[0]
  return {
    ...row,
    tags: Array.isArray(row.tags) ? row.tags : JSON.parse(row.tags as string),
    rules: Array.isArray(row.rules)
      ? row.rules
      : JSON.parse(row.rules as string),
    current_user_role: row.current_user_role || null,
  } as CommunityWithMeta
}

// ── Create Community ───────────────────────────────────────────────────

export async function createCommunity(
  input: CreateCommunityInput
): Promise<{ success: boolean; slug?: string; error?: string }> {
  const user = await getCurrentUser()

  try {
    // Check slug uniqueness
    const existing = await sql(
      `SELECT id FROM communities WHERE slug = $1`,
      [input.slug]
    )
    if (existing.length > 0) {
      return { success: false, error: "A community with this URL already exists." }
    }

    // Insert community
    const rows = await sql(
      `
      INSERT INTO communities (
        name, slug, description, category, visibility, posting_policy, join_policy,
        cover_image_url, avatar_url, location_name, latitude, longitude,
        contact_email, timezone, created_by, member_count
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 1
      )
      RETURNING id
      `,
      [
        input.name,
        input.slug,
        input.description,
        input.category,
        input.visibility,
        input.posting_policy,
        input.join_policy,
        input.cover_image_url || null,
        input.avatar_url || null,
        input.location_name || null,
        input.latitude || null,
        input.longitude || null,
        input.contact_email || null,
        input.timezone || "UTC",
        user.id,
      ]
    )

    const communityId = rows[0].id

    // Auto-join creator as owner
    await sql(
      `INSERT INTO community_members (community_id, user_id, role, status)
       VALUES ($1, $2, 'owner', 'active')`,
      [communityId, user.id]
    )

    // Insert tags
    if (input.tags && input.tags.length > 0) {
      for (const tag of input.tags) {
        await sql(
          `INSERT INTO community_tags (community_id, tag)
           VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [communityId, tag.toLowerCase().trim()]
        )
      }
    }

    // Insert rules
    if (input.rules && input.rules.length > 0) {
      for (let i = 0; i < input.rules.length; i++) {
        await sql(
          `INSERT INTO community_rules (community_id, title, description, sort_order)
           VALUES ($1, $2, $3, $4)`,
          [communityId, input.rules[i].title, input.rules[i].description, i + 1]
        )
      }
    }

    revalidatePath("/")
    return { success: true, slug: input.slug }
  } catch (error) {
    console.error("Failed to create community:", error)
    return { success: false, error: "Something went wrong. Please try again." }
  }
}

// ── Update Community ───────────────────────────────────────────────────

export async function updateCommunity(
  communityId: string,
  input: UpdateCommunityInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const setClauses: string[] = []
    const params: unknown[] = []
    let paramIndex = 1

    const fields: (keyof UpdateCommunityInput)[] = [
      "name", "slug", "description", "category", "type", "visibility",
      "posting_policy", "join_policy", "cover_image_url", "avatar_url",
      "location_name", "latitude", "longitude", "contact_email", "timezone",
    ]

    for (const field of fields) {
      if (input[field] !== undefined) {
        setClauses.push(`${field} = $${paramIndex}`)
        params.push(input[field])
        paramIndex++
      }
    }

    if (setClauses.length === 0) {
      return { success: true }
    }

    setClauses.push(`updated_at = now()`)
    params.push(communityId)

    await sql(
      `UPDATE communities SET ${setClauses.join(", ")} WHERE id = $${paramIndex}`,
      params
    )

    revalidatePath("/")
    revalidatePath(`/communities/${input.slug || ""}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to update community:", error)
    return { success: false, error: "Something went wrong. Please try again." }
  }
}

// ── Delete Community ───────────────────────────────────────────────────

export async function deleteCommunity(
  communityId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()

  try {
    // Verify ownership or superadmin
    const [membership, userRows] = await Promise.all([
      sql(
        `SELECT role FROM community_members WHERE community_id = $1 AND user_id = $2`,
        [communityId, user.id]
      ),
      sql(`SELECT is_superadmin FROM auth_users WHERE id = $1::uuid`, [user.id]).catch(
        () => [] as Record<string, unknown>[]
      ),
    ])
    const isSuperAdmin = userRows[0]?.is_superadmin === true

    if (!isSuperAdmin && (membership.length === 0 || membership[0].role !== "owner")) {
      return { success: false, error: "Only the owner can delete a community." }
    }

    await sql(`DELETE FROM communities WHERE id = $1`, [communityId])

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete community:", error)
    return { success: false, error: "Something went wrong. Please try again." }
  }
}

// ── Join Community ─────────────────────────────────────────────────────

export async function joinCommunity(
  communityId: string
): Promise<{ success: boolean; status?: string; error?: string }> {
  const user = await getCurrentUser()
  if (user.id === "guest") {
    return { success: false, error: "auth_required" }
  }

  try {
    // Check community join policy
    const community = await sql(
      `SELECT join_policy FROM communities WHERE id = $1`,
      [communityId]
    )
    if (community.length === 0) {
      return { success: false, error: "Community not found." }
    }

    const status =
      community[0].join_policy === "open" ? "active" : "pending"

    await sql(
      `INSERT INTO community_members (community_id, user_id, role, status)
       VALUES ($1, $2, 'member', $3)
       ON CONFLICT (community_id, user_id) DO NOTHING`,
      [communityId, user.id, status]
    )

    if (status === "active") {
      await sql(
        `UPDATE communities SET member_count = member_count + 1 WHERE id = $1`,
        [communityId]
      )
    }

    revalidatePath("/")
    return { success: true, status }
  } catch (error) {
    console.error("Failed to join community:", error)
    return { success: false, error: "Something went wrong. Please try again." }
  }
}

// ── Leave Community ────────────────────────────────────────────────────

export async function leaveCommunity(
  communityId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()

  try {
    // Don't allow owner to leave
    const membership = await sql(
      `SELECT role FROM community_members WHERE community_id = $1 AND user_id = $2`,
      [communityId, user.id]
    )

    if (membership.length > 0 && membership[0].role === "owner") {
      return { success: false, error: "Owner cannot leave. Transfer ownership first." }
    }

    const result = await sql(
      `DELETE FROM community_members WHERE community_id = $1 AND user_id = $2 RETURNING id`,
      [communityId, user.id]
    )

    if (result.length > 0) {
      await sql(
        `UPDATE communities SET member_count = GREATEST(member_count - 1, 0) WHERE id = $1`,
        [communityId]
      )
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to leave community:", error)
    return { success: false, error: "Something went wrong. Please try again." }
  }
}

// ── Get Members ────────────────────────────────────────────────────────

export async function getCommunityMembers(
  communityId: string,
  cursor?: string | null,
  limit = 20
): Promise<PaginatedResult<CommunityMember>> {
  const params: unknown[] = [communityId, limit + 1]
  let query = `
    SELECT cm.*, up.display_name, up.avatar_url
    FROM community_members cm
    LEFT JOIN user_profiles up ON up.neon_auth_id = cm.user_id
    WHERE cm.community_id = $1 AND cm.status = 'active'
  `

  if (cursor) {
    query += ` AND cm.joined_at < $3`
    params.push(cursor)
  }

  query += ` ORDER BY
    CASE cm.role
      WHEN 'owner' THEN 0
      WHEN 'admin' THEN 1
      WHEN 'moderator' THEN 2
      ELSE 3
    END,
    cm.joined_at ASC
    LIMIT $2`

  const rows = await sql(query, params)

  const hasMore = rows.length > limit
  const data = (hasMore ? rows.slice(0, limit) : rows) as CommunityMember[]

  return {
    data,
    nextCursor: hasMore ? data[data.length - 1].joined_at : null,
    hasMore,
  }
}

// ── Get Pending Members ────────────────────────────────────────────────

export async function getPendingMembers(
  communityId: string
): Promise<CommunityMember[]> {
  const rows = await sql(
    `SELECT * FROM community_members
     WHERE community_id = $1 AND status = 'pending'
     ORDER BY joined_at ASC`,
    [communityId]
  )
  return rows as CommunityMember[]
}

// ── Approve Member ─────────────────────────────────────────────────────

export async function approveMember(
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await sql(
      `UPDATE community_members SET status = 'active' WHERE id = $1 RETURNING community_id`,
      [memberId]
    )

    if (result.length > 0) {
      await sql(
        `UPDATE communities SET member_count = member_count + 1 WHERE id = $1`,
        [result[0].community_id]
      )
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to approve member:", error)
    return { success: false, error: "Something went wrong." }
  }
}

// ── Update Member Role ─────────────────────────────────────────────────

export async function updateMemberRole(
  memberId: string,
  role: MemberRole
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (user.id === "guest") return { success: false, error: "auth_required" }

  try {
    // Get the target member's community + current role
    const target = await sql(
      `SELECT community_id, user_id, role FROM community_members WHERE id = $1`,
      [memberId]
    )
    if (target.length === 0) return { success: false, error: "Member not found." }

    const communityId = target[0].community_id as string
    const targetRole = target[0].role as Role
    const ctx = await getPermCtx(user.id, communityId)
    const effectiveRole = ctx.isSuperAdmin ? "superadmin" as Role : ctx.userRole

    // Permission: must have member:change_role
    if (!checkPermission(ctx, PERMISSIONS.member_change_role)) {
      return { success: false, error: "You don't have permission to change roles." }
    }
    // Hierarchy: can only change roles below your own
    if (!canModifyMember(effectiveRole, targetRole)) {
      return { success: false, error: "Cannot modify a member with equal or higher role." }
    }
    // Can only assign roles below your own
    const assignable = getAssignableRoles(effectiveRole)
    if (!assignable.includes(role as Role)) {
      return { success: false, error: "Cannot assign a role at or above your own." }
    }

    await sql(`UPDATE community_members SET role = $2 WHERE id = $1`, [memberId, role])

    await logAuditEvent({
      actorId: user.id,
      targetUserId: target[0].user_id as string,
      communityId,
      action: "role_changed",
      details: { from: targetRole, to: role },
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to update member role:", error)
    return { success: false, error: "Something went wrong." }
  }
}

// ── Remove Member ──────────────────────────────────────────────────────

export async function removeMember(
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (user.id === "guest") return { success: false, error: "auth_required" }

  try {
    // Get target member info
    const target = await sql(
      `SELECT community_id, user_id, role FROM community_members WHERE id = $1`,
      [memberId]
    )
    if (target.length === 0) return { success: false, error: "Member not found." }

    const communityId = target[0].community_id as string
    const targetRole = target[0].role as Role
    const ctx = await getPermCtx(user.id, communityId)
    const effectiveRole = ctx.isSuperAdmin ? "superadmin" as Role : ctx.userRole

    // Permission: must have member:remove
    if (!checkPermission(ctx, PERMISSIONS.member_remove)) {
      return { success: false, error: "You don't have permission to remove members." }
    }
    // Hierarchy: can only remove members below you
    if (!canModifyMember(effectiveRole, targetRole)) {
      return { success: false, error: "Cannot remove a member with equal or higher role." }
    }

    const result = await sql(
      `DELETE FROM community_members WHERE id = $1 AND role != 'owner' RETURNING community_id`,
      [memberId]
    )

    if (result.length > 0) {
      await sql(
        `UPDATE communities SET member_count = GREATEST(member_count - 1, 0) WHERE id = $1`,
        [result[0].community_id]
      )
    }

    await logAuditEvent({
      actorId: user.id,
      targetUserId: target[0].user_id as string,
      communityId,
      action: "member_removed",
      details: { role: targetRole },
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to remove member:", error)
    return { success: false, error: "Something went wrong." }
  }
}

// ── Update Tags ────────────────────────────────────────────────────────

export async function updateCommunityTags(
  communityId: string,
  tags: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Remove all existing tags
    await sql(`DELETE FROM community_tags WHERE community_id = $1`, [communityId])

    // Insert new ones
    for (const tag of tags) {
      await sql(
        `INSERT INTO community_tags (community_id, tag)
         VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [communityId, tag.toLowerCase().trim()]
      )
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to update tags:", error)
    return { success: false, error: "Something went wrong." }
  }
}

// ── Update Rules ───────────────────────────────────────────────────────

export async function updateCommunityRules(
  communityId: string,
  rules: { title: string; description: string }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Remove all existing rules
    await sql(`DELETE FROM community_rules WHERE community_id = $1`, [communityId])

    // Insert new ones
    for (let i = 0; i < rules.length; i++) {
      await sql(
        `INSERT INTO community_rules (community_id, title, description, sort_order)
         VALUES ($1, $2, $3, $4)`,
        [communityId, rules[i].title, rules[i].description, i + 1]
      )
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to update rules:", error)
    return { success: false, error: "Something went wrong." }
  }
}

// ── Analytics ──────────────────────────────────────────────────────────

// ── Get My Communities ─────────────────────────────────────────────────

export async function getMyCommunities(): Promise<CommunityWithMeta[]> {
  const user = await getCurrentUser()

  const rows = await sql(
    `
    SELECT
      c.*,
      COALESCE(
        (SELECT json_agg(ct.tag) FROM community_tags ct WHERE ct.community_id = c.id),
        '[]'::json
      ) AS tags,
      '[]'::json AS rules,
      cm.role AS current_user_role
    FROM communities c
    JOIN community_members cm ON cm.community_id = c.id AND cm.user_id = $1 AND cm.status = 'active'
    ORDER BY c.name ASC
    `,
    [user.id]
  )

  return rows.map((row) => ({
    ...row,
    tags: Array.isArray(row.tags) ? row.tags : JSON.parse(row.tags as string),
    rules: [],
    current_user_role: row.current_user_role || null,
  })) as CommunityWithMeta[]
}

// ── Analytics ──────────────────────────────────────────────────────────

export async function getCommunityAnalytics(communityId: string) {
  const [memberStats, roleBreakdown, recentMembers] = await Promise.all([
    sql(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'active') AS active_members,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending_members,
        COUNT(*) FILTER (WHERE status = 'banned') AS banned_members,
        COUNT(*) FILTER (WHERE joined_at > now() - interval '30 days' AND status = 'active') AS new_this_month,
        COUNT(*) FILTER (WHERE joined_at > now() - interval '7 days' AND status = 'active') AS new_this_week
      FROM community_members WHERE community_id = $1`,
      [communityId]
    ),
    sql(
      `SELECT role, COUNT(*) AS count
       FROM community_members
       WHERE community_id = $1 AND status = 'active'
       GROUP BY role ORDER BY count DESC`,
      [communityId]
    ),
    sql(
      `SELECT * FROM community_members
       WHERE community_id = $1 AND status = 'active'
       ORDER BY joined_at DESC LIMIT 5`,
      [communityId]
    ),
  ])

  return {
    stats: memberStats[0] as {
      active_members: number
      pending_members: number
      banned_members: number
      new_this_month: number
      new_this_week: number
    },
    roleBreakdown: roleBreakdown as { role: string; count: number }[],
    recentMembers: recentMembers as CommunityMember[],
  }
}
