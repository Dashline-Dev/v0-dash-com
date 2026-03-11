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
  totalAreas: number
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

  const [users, communities, events, spaces, areas, members, recent] =
    await Promise.all([
      sql(`SELECT COUNT(*) as count FROM auth_users`),
      sql(`SELECT COUNT(*) as count FROM communities`),
      sql(`SELECT COUNT(*) as count FROM events`),
      sql(`SELECT COUNT(*) as count FROM spaces`),
      sql(`SELECT COUNT(*) as count FROM areas WHERE status = 'active'`),
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
    totalAreas: Number(areas[0]?.count ?? 0),
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

export async function adminUpdateUser(
  userId: string,
  data: { display_name?: string; email?: string }
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireSuperAdmin()

  try {
    const updates: string[] = []
    const params: (string | number)[] = []
    let idx = 1

    if (data.display_name !== undefined) {
      updates.push(`display_name = $${idx++}`)
      params.push(data.display_name)
    }
    if (data.email !== undefined) {
      updates.push(`email = $${idx++}`)
      params.push(data.email)
    }

    if (updates.length === 0) return { ok: true }

    params.push(userId)
    await sql(
      `UPDATE auth_users SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${idx}::uuid`,
      params
    )

    await logAuditEvent({
      actorId: admin.id,
      targetUserId: userId,
      action: "user_updated_by_admin",
      details: data,
    })

    revalidatePath("/admin")
    return { ok: true }
  } catch (e) {
    console.error("adminUpdateUser error:", e)
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

export async function adminUpdateCommunity(
  communityId: string,
  data: { name?: string; slug?: string; description?: string; visibility?: string }
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireSuperAdmin()

  try {
    const updates: string[] = []
    const params: (string | number)[] = []
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
    if (data.visibility !== undefined) {
      updates.push(`visibility = $${idx++}`)
      params.push(data.visibility)
    }

    if (updates.length === 0) return { ok: true }

    params.push(communityId)
    await sql(
      `UPDATE communities SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${idx}`,
      params
    )

    await logAuditEvent({
      actorId: admin.id,
      communityId,
      action: "community_updated_by_admin",
      details: data,
    })

    revalidatePath("/admin")
    revalidatePath("/communities")
    return { ok: true }
  } catch (e) {
    console.error("adminUpdateCommunity error:", e)
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

// ── Area Management ──────────────────────────────────────────────────────

export interface AdminArea {
  id: string
  name: string
  slug: string
  type: string
  description: string | null
  latitude: number
  longitude: number
  status: string
  parent_name: string | null
  community_count: number
  created_at: string
}

export async function getAllAreas(params: {
  search?: string
  limit?: number
  offset?: number
}): Promise<{ areas: AdminArea[]; total: number }> {
  await requireSuperAdmin()

  const { search, limit = 50, offset = 0 } = params

  let whereClause = ""
  const queryParams: (string | number)[] = []
  let paramIdx = 1

  if (search && search.trim()) {
    whereClause = `WHERE a.name ILIKE $${paramIdx} OR a.slug ILIKE $${paramIdx}`
    queryParams.push(`%${search.trim()}%`)
    paramIdx++
  }

  const [rows, countRows] = await Promise.all([
    sql(
      `SELECT a.id, a.name, a.slug, a.type, a.description, a.latitude, a.longitude,
              a.status, a.created_at,
              p.name as parent_name,
              COALESCE(ca.cnt, 0) as community_count
       FROM areas a
       LEFT JOIN areas p ON a.parent_id = p.id
       LEFT JOIN (
         SELECT area_id, COUNT(*) as cnt FROM community_areas GROUP BY area_id
       ) ca ON ca.area_id = a.id
       ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...queryParams, limit, offset]
    ),
    sql(`SELECT COUNT(*) as count FROM areas a ${whereClause}`, queryParams),
  ])

  return {
    areas: rows as AdminArea[],
    total: Number(countRows[0]?.count ?? 0),
  }
}

export async function adminUpdateArea(
  areaId: string,
  data: { name?: string; slug?: string; description?: string; type?: string; status?: string }
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireSuperAdmin()

  try {
    const updates: string[] = []
    const params: (string | number)[] = []
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
    if (data.type !== undefined) {
      updates.push(`type = $${idx++}`)
      params.push(data.type)
    }
    if (data.status !== undefined) {
      updates.push(`status = $${idx++}`)
      params.push(data.status)
    }

    if (updates.length === 0) return { ok: true }

    params.push(areaId)
    await sql(
      `UPDATE areas SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${idx}`,
      params
    )

    await logAuditEvent({
      actorId: admin.id,
      action: "area_updated_by_admin",
      details: { area_id: areaId, ...data },
    })

    revalidatePath("/admin")
    revalidatePath("/areas")
    return { ok: true }
  } catch (e) {
    console.error("adminUpdateArea error:", e)
    return { ok: false, error: "Something went wrong." }
  }
}

export async function adminDeleteArea(
  areaId: string
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireSuperAdmin()

  try {
    const areaRows = await sql(`SELECT name FROM areas WHERE id = $1`, [areaId])
    if (areaRows.length === 0) return { ok: false, error: "Area not found." }

    // Soft delete
    await sql(
      `UPDATE areas SET status = 'inactive', updated_at = NOW() WHERE id = $1`,
      [areaId]
    )

    await logAuditEvent({
      actorId: admin.id,
      action: "area_deleted_by_admin",
      details: { area_name: areaRows[0].name, area_id: areaId },
    })

    revalidatePath("/admin")
    revalidatePath("/areas")
    return { ok: true }
  } catch (e) {
    console.error("adminDeleteArea error:", e)
    return { ok: false, error: "Something went wrong." }
  }
}

// ── Event Management ─────────────────────────────────────────────────────

export interface AdminEvent {
  id: string
  title: string
  slug: string
  event_type: string
  status: string
  start_time: string
  end_time: string
  community_name: string | null
  community_slug: string | null
  rsvp_count: number
  created_at: string
}

export async function getAllEvents(params: {
  search?: string
  limit?: number
  offset?: number
}): Promise<{ events: AdminEvent[]; total: number }> {
  await requireSuperAdmin()

  const { search, limit = 50, offset = 0 } = params

  let whereClause = ""
  const queryParams: (string | number)[] = []
  let paramIdx = 1

  if (search && search.trim()) {
    whereClause = `WHERE e.title ILIKE $${paramIdx} OR e.slug ILIKE $${paramIdx}`
    queryParams.push(`%${search.trim()}%`)
    paramIdx++
  }

  const [rows, countRows] = await Promise.all([
    sql(
      `SELECT e.id, e.title, e.slug, e.event_type, e.status, e.start_time, e.end_time,
              e.rsvp_count, e.created_at,
              c.name as community_name, c.slug as community_slug
       FROM events e
       LEFT JOIN communities c ON c.id = e.community_id
       ${whereClause}
       ORDER BY e.start_time DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...queryParams, limit, offset]
    ),
    sql(`SELECT COUNT(*) as count FROM events e ${whereClause}`, queryParams),
  ])

  return {
    events: rows as AdminEvent[],
    total: Number(countRows[0]?.count ?? 0),
  }
}

export async function adminUpdateEvent(
  eventId: string,
  data: { title?: string; slug?: string; status?: string; event_type?: string }
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireSuperAdmin()

  try {
    const updates: string[] = []
    const params: (string | number)[] = []
    let idx = 1

    if (data.title !== undefined) {
      updates.push(`title = $${idx++}`)
      params.push(data.title)
    }
    if (data.slug !== undefined) {
      updates.push(`slug = $${idx++}`)
      params.push(data.slug)
    }
    if (data.status !== undefined) {
      updates.push(`status = $${idx++}`)
      params.push(data.status)
    }
    if (data.event_type !== undefined) {
      updates.push(`event_type = $${idx++}`)
      params.push(data.event_type)
    }

    if (updates.length === 0) return { ok: true }

    params.push(eventId)
    await sql(
      `UPDATE events SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${idx}`,
      params
    )

    await logAuditEvent({
      actorId: admin.id,
      action: "event_updated_by_admin",
      details: { event_id: eventId, ...data },
    })

    revalidatePath("/admin")
    revalidatePath("/events")
    return { ok: true }
  } catch (e) {
    console.error("adminUpdateEvent error:", e)
    return { ok: false, error: "Something went wrong." }
  }
}

export async function adminDeleteEvent(
  eventId: string
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireSuperAdmin()

  try {
    const eventRows = await sql(`SELECT title FROM events WHERE id = $1`, [
      eventId,
    ])
    if (eventRows.length === 0) return { ok: false, error: "Event not found." }

    await sql(`DELETE FROM events WHERE id = $1`, [eventId])

    await logAuditEvent({
      actorId: admin.id,
      action: "event_deleted_by_admin",
      details: { event_title: eventRows[0].title, event_id: eventId },
    })

    revalidatePath("/admin")
    revalidatePath("/events")
    return { ok: true }
  } catch (e) {
    console.error("adminDeleteEvent error:", e)
    return { ok: false, error: "Something went wrong." }
  }
}

// ── Space Management ─────────────────────────────────────────────────────

export interface AdminSpace {
  id: string
  name: string
  slug: string
  type: string
  visibility: string
  status: string
  community_name: string | null
  community_slug: string | null
  member_count: number
  created_at: string
}

export async function getAllSpaces(params: {
  search?: string
  limit?: number
  offset?: number
}): Promise<{ spaces: AdminSpace[]; total: number }> {
  await requireSuperAdmin()

  const { search, limit = 50, offset = 0 } = params

  let whereClause = ""
  const queryParams: (string | number)[] = []
  let paramIdx = 1

  if (search && search.trim()) {
    whereClause = `WHERE s.name ILIKE $${paramIdx} OR s.slug ILIKE $${paramIdx}`
    queryParams.push(`%${search.trim()}%`)
    paramIdx++
  }

  const [rows, countRows] = await Promise.all([
    sql(
      `SELECT s.id, s.name, s.slug, s.type, s.visibility, s.status, s.created_at,
              c.name as community_name, c.slug as community_slug,
              COALESCE(sm.cnt, 0) as member_count
       FROM spaces s
       LEFT JOIN communities c ON c.id = s.community_id
       LEFT JOIN (
         SELECT space_id, COUNT(*) as cnt FROM space_members GROUP BY space_id
       ) sm ON sm.space_id = s.id
       ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...queryParams, limit, offset]
    ),
    sql(`SELECT COUNT(*) as count FROM spaces s ${whereClause}`, queryParams),
  ])

  return {
    spaces: rows as AdminSpace[],
    total: Number(countRows[0]?.count ?? 0),
  }
}

export async function adminUpdateSpace(
  spaceId: string,
  data: { name?: string; slug?: string; type?: string; visibility?: string }
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireSuperAdmin()

  try {
    const updates: string[] = []
    const params: (string | number)[] = []
    let idx = 1

    if (data.name !== undefined) {
      updates.push(`name = $${idx++}`)
      params.push(data.name)
    }
    if (data.slug !== undefined) {
      updates.push(`slug = $${idx++}`)
      params.push(data.slug)
    }
    if (data.type !== undefined) {
      updates.push(`type = $${idx++}`)
      params.push(data.type)
    }
    if (data.visibility !== undefined) {
      updates.push(`visibility = $${idx++}`)
      params.push(data.visibility)
    }

    if (updates.length === 0) return { ok: true }

    params.push(spaceId)
    await sql(
      `UPDATE spaces SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${idx}`,
      params
    )

    await logAuditEvent({
      actorId: admin.id,
      action: "space_updated_by_admin",
      details: { space_id: spaceId, ...data },
    })

    revalidatePath("/admin")
    return { ok: true }
  } catch (e) {
    console.error("adminUpdateSpace error:", e)
    return { ok: false, error: "Something went wrong." }
  }
}

export async function adminDeleteSpace(
  spaceId: string
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireSuperAdmin()

  try {
    const spaceRows = await sql(`SELECT name FROM spaces WHERE id = $1`, [
      spaceId,
    ])
    if (spaceRows.length === 0) return { ok: false, error: "Space not found." }

    await sql(`DELETE FROM spaces WHERE id = $1`, [spaceId])

    await logAuditEvent({
      actorId: admin.id,
      action: "space_deleted_by_admin",
      details: { space_name: spaceRows[0].name, space_id: spaceId },
    })

    revalidatePath("/admin")
    return { ok: true }
  } catch (e) {
    console.error("adminDeleteSpace error:", e)
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
