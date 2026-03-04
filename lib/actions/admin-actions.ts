"use server"

import { sql } from "@/lib/db"
import { requireSuperAdmin } from "@/lib/superadmin"
import { logAuditEvent } from "@/lib/actions/audit-actions"
import { revalidatePath } from "next/cache"

// ── Types ────────────────────────────────────────────────────────────────

export interface PlatformStats {
  totalUsers: number
  totalCommunities: number
  totalEvents: number
  totalSpaces: number
  totalMembers: number
  recentSignups: number // last 7 days
}

export interface AdminUser {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  is_superadmin: boolean
  created_at: string
  community_count: number
}

export interface AdminCommunity {
  id: string
  name: string
  slug: string
  description: string | null
  avatar_url: string | null
  is_verified: boolean
  member_count: number
  created_at: string
  owner_name: string | null
  visibility: string
}

// ── Platform Stats ───────────────────────────────────────────────────────

export async function getAdminStats(): Promise<PlatformStats> {
  await requireSuperAdmin()

  const [users, communities, events, spaces, members, recent] =
    await Promise.all([
      sql(`SELECT COUNT(*) as count FROM auth_users`),
      sql(`SELECT COUNT(*) as count FROM communities`),
      sql(`SELECT COUNT(*) as count FROM events`),
      sql(`SELECT COUNT(*) as count FROM spaces`),
      sql(
        `SELECT COUNT(*) as count FROM community_members WHERE status = 'active'`
      ),
      sql(
        `SELECT COUNT(*) as count FROM auth_users WHERE created_at > now() - interval '7 days'`
      ),
    ])

  return {
    totalUsers: Number(users[0]?.count ?? 0),
    totalCommunities: Number(communities[0]?.count ?? 0),
    totalEvents: Number(events[0]?.count ?? 0),
    totalSpaces: Number(spaces[0]?.count ?? 0),
    totalMembers: Number(members[0]?.count ?? 0),
    recentSignups: Number(recent[0]?.count ?? 0),
  }
}

// ── User Management ──────────────────────────────────────────────────────

export async function getAllUsers(params: {
  search?: string
  limit?: number
  offset?: number
}): Promise<{ users: AdminUser[]; total: number }> {
  await requireSuperAdmin()

  const { search, limit = 50, offset = 0 } = params

  let whereClause = ""
  const queryParams: (string | number)[] = []
  let paramIdx = 1

  if (search && search.trim()) {
    whereClause = `WHERE u.email ILIKE $${paramIdx} OR u.display_name ILIKE $${paramIdx}`
    queryParams.push(`%${search.trim()}%`)
    paramIdx++
  }

  const [rows, countRows] = await Promise.all([
    sql(
      `SELECT u.id, u.email, u.display_name, u.avatar_url, u.is_superadmin, u.created_at,
              COALESCE(mc.cnt, 0) as community_count
       FROM auth_users u
       LEFT JOIN (
         SELECT user_id, COUNT(*) as cnt FROM community_members WHERE status = 'active' GROUP BY user_id
       ) mc ON mc.user_id = u.id::text
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...queryParams, limit, offset]
    ),
    sql(
      `SELECT COUNT(*) as count FROM auth_users u ${whereClause}`,
      queryParams
    ),
  ])

  return {
    users: rows as AdminUser[],
    total: Number(countRows[0]?.count ?? 0),
  }
}

export async function toggleSuperAdmin(
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireSuperAdmin()

  if (admin.id === userId) {
    return { ok: false, error: "You cannot remove your own superadmin status." }
  }

  try {
    const rows = await sql(
      `UPDATE auth_users SET is_superadmin = NOT is_superadmin WHERE id = $1::uuid
       RETURNING is_superadmin, display_name`,
      [userId]
    )
    if (rows.length === 0) return { ok: false, error: "User not found." }

    await logAuditEvent({
      actorId: admin.id,
      targetUserId: userId,
      action: rows[0].is_superadmin
        ? "superadmin_granted"
        : "superadmin_revoked",
      details: { target_name: rows[0].display_name },
    })

    revalidatePath("/admin")
    return { ok: true }
  } catch (e) {
    console.error("toggleSuperAdmin error:", e)
    return { ok: false, error: "Something went wrong." }
  }
}

export async function adminDeleteUser(
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireSuperAdmin()

  if (admin.id === userId) {
    return { ok: false, error: "You cannot delete your own account from here." }
  }

  try {
    const userRows = await sql(
      `SELECT display_name, email FROM auth_users WHERE id = $1::uuid`,
      [userId]
    )
    if (userRows.length === 0) return { ok: false, error: "User not found." }

    // Remove memberships (decrement member counts)
    await sql(
      `UPDATE communities SET member_count = member_count - 1
       WHERE id IN (SELECT community_id FROM community_members WHERE user_id = $1 AND status = 'active')`,
      [userId]
    )

    // Remove sessions, memberships, then user
    await sql(`DELETE FROM auth_sessions WHERE user_id = $1::uuid`, [userId])
    await sql(`DELETE FROM community_members WHERE user_id = $1`, [userId])
    await sql(`DELETE FROM auth_users WHERE id = $1::uuid`, [userId])

    await logAuditEvent({
      actorId: admin.id,
      targetUserId: userId,
      action: "user_deleted_by_admin",
      details: {
        target_name: userRows[0].display_name,
        target_email: userRows[0].email,
      },
    })

    revalidatePath("/admin")
    return { ok: true }
  } catch (e) {
    console.error("adminDeleteUser error:", e)
    return { ok: false, error: "Something went wrong." }
  }
}

// ── Community Management ─────────────────────────────────────────────────

export async function getAllCommunities(params: {
  search?: string
  limit?: number
  offset?: number
}): Promise<{ communities: AdminCommunity[]; total: number }> {
  await requireSuperAdmin()

  const { search, limit = 50, offset = 0 } = params

  let whereClause = ""
  const queryParams: (string | number)[] = []
  let paramIdx = 1

  if (search && search.trim()) {
    whereClause = `WHERE c.name ILIKE $${paramIdx} OR c.slug ILIKE $${paramIdx}`
    queryParams.push(`%${search.trim()}%`)
    paramIdx++
  }

  const [rows, countRows] = await Promise.all([
    sql(
      `SELECT c.id, c.name, c.slug, c.description, c.avatar_url, c.is_verified,
              c.member_count, c.created_at, c.visibility,
              owner.display_name as owner_name
       FROM communities c
       LEFT JOIN community_members cm ON cm.community_id = c.id AND cm.role = 'owner'
       LEFT JOIN auth_users owner ON owner.id::text = cm.user_id
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...queryParams, limit, offset]
    ),
    sql(
      `SELECT COUNT(*) as count FROM communities c ${whereClause}`,
      queryParams
    ),
  ])

  return {
    communities: rows as AdminCommunity[],
    total: Number(countRows[0]?.count ?? 0),
  }
}

export async function toggleCommunityVerified(
  communityId: string
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireSuperAdmin()

  try {
    const rows = await sql(
      `UPDATE communities SET is_verified = NOT is_verified WHERE id = $1 RETURNING name, is_verified`,
      [communityId]
    )
    if (rows.length === 0)
      return { ok: false, error: "Community not found." }

    await logAuditEvent({
      actorId: admin.id,
      communityId,
      action: rows[0].is_verified
        ? "community_verified"
        : "community_unverified",
      details: { community_name: rows[0].name },
    })

    revalidatePath("/admin")
    return { ok: true }
  } catch (e) {
    console.error("toggleCommunityVerified error:", e)
    return { ok: false, error: "Something went wrong." }
  }
}

export async function adminDeleteCommunity(
  communityId: string
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireSuperAdmin()

  try {
    const communityRows = await sql(
      `SELECT name FROM communities WHERE id = $1`,
      [communityId]
    )
    if (communityRows.length === 0)
      return { ok: false, error: "Community not found." }

    await sql(`DELETE FROM communities WHERE id = $1`, [communityId])

    await logAuditEvent({
      actorId: admin.id,
      communityId,
      action: "community_deleted_by_admin",
      details: { community_name: communityRows[0].name },
    })

    revalidatePath("/admin")
    revalidatePath("/communities")
    return { ok: true }
  } catch (e) {
    console.error("adminDeleteCommunity error:", e)
    return { ok: false, error: "Something went wrong." }
  }
}

// ── Global Audit Log ─────────────────────────────────────────────────────

export async function getGlobalAuditLog(params: {
  limit?: number
  offset?: number
}): Promise<{
  entries: {
    id: string
    actor_id: string
    actor_name: string | null
    target_user_id: string | null
    target_name: string | null
    community_id: string | null
    community_name: string | null
    action: string
    details: Record<string, unknown>
    created_at: string
  }[]
  total: number
}> {
  await requireSuperAdmin()

  const { limit = 50, offset = 0 } = params

  const [rows, countRows] = await Promise.all([
    sql(
      `SELECT
        pal.*,
        au_actor.display_name as actor_name,
        au_target.display_name as target_name,
        c.name as community_name
       FROM permission_audit_log pal
       LEFT JOIN auth_users au_actor ON au_actor.id::text = pal.actor_id
       LEFT JOIN auth_users au_target ON au_target.id::text = pal.target_user_id
       LEFT JOIN communities c ON c.id::text = pal.community_id
       ORDER BY pal.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
    sql(`SELECT COUNT(*) as count FROM permission_audit_log`),
  ])

  return {
    entries: rows as {
      id: string
      actor_id: string
      actor_name: string | null
      target_user_id: string | null
      target_name: string | null
      community_id: string | null
      community_name: string | null
      action: string
      details: Record<string, unknown>
      created_at: string
    }[],
    total: Number(countRows[0]?.count ?? 0),
  }
}
