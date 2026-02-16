"use server"

import { sql } from "@/lib/db"
import { revalidateTag } from "next/cache"
import type { CommunityMemberRow, MemberRole } from "@/types/user"

/* ------------------------------------------------------------------ */
/*  Join / leave                                                       */
/* ------------------------------------------------------------------ */

export async function joinCommunity(communityId: string, userId: string) {
  // Check if already a member
  const existing = await sql(
    `SELECT id, status FROM community_members WHERE community_id = $1 AND user_id = $2`,
    [communityId, userId]
  )

  if (existing.length > 0) {
    const row = existing[0] as { id: string; status: string }
    if (row.status === "active") {
      return { success: false, error: "Already a member" }
    }
    // Re-activate if previously left
    await sql(
      `UPDATE community_members SET status = 'active', joined_at = now() WHERE id = $1`,
      [row.id]
    )
  } else {
    await sql(
      `INSERT INTO community_members (community_id, user_id, role, status) VALUES ($1, $2, 'member', 'active')`,
      [communityId, userId]
    )
  }

  // Increment member_count
  await sql(
    `UPDATE communities SET member_count = member_count + 1 WHERE id = $1`,
    [communityId]
  )

  revalidateTag("community-detail", "max")
  return { success: true }
}

export async function leaveCommunity(communityId: string, userId: string) {
  const existing = await sql(
    `SELECT id, role FROM community_members WHERE community_id = $1 AND user_id = $2 AND status = 'active'`,
    [communityId, userId]
  )

  if (existing.length === 0) {
    return { success: false, error: "Not a member" }
  }

  const row = existing[0] as { id: string; role: string }
  if (row.role === "owner") {
    return { success: false, error: "Owners cannot leave. Transfer ownership first." }
  }

  await sql(
    `UPDATE community_members SET status = 'inactive' WHERE id = $1`,
    [row.id]
  )
  await sql(
    `UPDATE communities SET member_count = GREATEST(member_count - 1, 0) WHERE id = $1`,
    [communityId]
  )

  revalidateTag("community-detail", "max")
  return { success: true }
}

/* ------------------------------------------------------------------ */
/*  Membership check                                                   */
/* ------------------------------------------------------------------ */

export async function getMembership(communityId: string, userId: string) {
  const rows = await sql(
    `SELECT id, role, status, notification_preference, joined_at
     FROM community_members
     WHERE community_id = $1 AND user_id = $2 AND status = 'active'`,
    [communityId, userId]
  )
  return rows[0] as { id: string; role: MemberRole; status: string; notification_preference: string; joined_at: string } | undefined
}

/* ------------------------------------------------------------------ */
/*  List community members                                             */
/* ------------------------------------------------------------------ */

export async function getCommunityMembers(
  communityId: string,
  opts?: { limit?: number; offset?: number }
): Promise<{ members: CommunityMemberRow[]; total: number }> {
  const limit = opts?.limit ?? 20
  const offset = opts?.offset ?? 0

  const countRows = await sql(
    `SELECT COUNT(*) as count FROM community_members WHERE community_id = $1 AND status = 'active'`,
    [communityId]
  )
  const total = Number(countRows[0]?.count ?? 0)

  const rows = await sql(
    `SELECT
      cm.id, cm.user_id, cm.role, cm.status, cm.joined_at,
      up.display_name, up.avatar_url
    FROM community_members cm
    LEFT JOIN user_profiles up ON up.neon_auth_id = cm.user_id
    WHERE cm.community_id = $1 AND cm.status = 'active'
    ORDER BY
      CASE cm.role
        WHEN 'owner' THEN 0
        WHEN 'admin' THEN 1
        WHEN 'moderator' THEN 2
        ELSE 3
      END,
      cm.joined_at ASC
    LIMIT $2 OFFSET $3`,
    [communityId, limit, offset]
  )

  return { members: rows as CommunityMemberRow[], total }
}

/* ------------------------------------------------------------------ */
/*  Update member role                                                 */
/* ------------------------------------------------------------------ */

export async function updateMemberRole(
  memberId: string,
  newRole: MemberRole,
  actingUserId: string,
  communityId: string
) {
  // Check acting user is owner/admin
  const actor = await getMembership(communityId, actingUserId)
  if (!actor || !["owner", "admin"].includes(actor.role)) {
    return { success: false, error: "Insufficient permissions" }
  }

  await sql(`UPDATE community_members SET role = $1 WHERE id = $2`, [newRole, memberId])
  revalidateTag("community-detail", "max")
  return { success: true }
}

/* ------------------------------------------------------------------ */
/*  Update notification preferences                                    */
/* ------------------------------------------------------------------ */

export async function updateNotificationPreference(
  communityId: string,
  userId: string,
  preference: "all" | "important" | "none"
) {
  await sql(
    `UPDATE community_members SET notification_preference = $1
     WHERE community_id = $2 AND user_id = $3 AND status = 'active'`,
    [preference, communityId, userId]
  )
  return { success: true }
}
