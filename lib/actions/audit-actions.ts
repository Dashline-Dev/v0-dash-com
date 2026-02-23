"use server"

import { sql } from "@/lib/db"

export interface AuditEntry {
  id: string
  actor_id: string
  actor_name: string | null
  target_user_id: string | null
  target_name: string | null
  community_id: string | null
  action: string
  details: Record<string, unknown>
  created_at: string
}

export async function logAuditEvent(params: {
  actorId: string
  targetUserId?: string
  communityId?: string
  action: string
  details?: Record<string, unknown>
}) {
  await sql(
    `INSERT INTO permission_audit_log (actor_id, target_user_id, community_id, action, details)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      params.actorId,
      params.targetUserId || null,
      params.communityId || null,
      params.action,
      JSON.stringify(params.details || {}),
    ]
  )
}

export async function getAuditLog(
  communityId: string,
  limit = 50,
  offset = 0
): Promise<{ entries: AuditEntry[]; total: number }> {
  const [rows, countRows] = await Promise.all([
    sql(
      `SELECT
        pal.*,
        au_actor.display_name as actor_name,
        au_target.display_name as target_name
       FROM permission_audit_log pal
       LEFT JOIN auth_users au_actor ON au_actor.id::text = pal.actor_id
       LEFT JOIN auth_users au_target ON au_target.id::text = pal.target_user_id
       WHERE pal.community_id = $1
       ORDER BY pal.created_at DESC
       LIMIT $2 OFFSET $3`,
      [communityId, limit, offset]
    ),
    sql(
      `SELECT COUNT(*) as count FROM permission_audit_log WHERE community_id = $1`,
      [communityId]
    ),
  ])

  return {
    entries: rows as AuditEntry[],
    total: Number(countRows[0]?.count ?? 0),
  }
}
