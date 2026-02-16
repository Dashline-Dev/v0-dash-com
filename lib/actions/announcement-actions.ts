"use server"

import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/mock-user"
import type {
  AnnouncementWithMeta,
  AnnouncementListResult,
  AnnouncementTemplate,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
  CreateTemplateInput,
  RecurrenceRule,
} from "@/types/announcement"
import { getNextRecurrenceDate } from "@/types/announcement"

function getDb() {
  return neon(process.env.DATABASE_URL!)
}

// ─── List Announcements ─────────────────────────────────────────────────────

export async function getAnnouncements(opts: {
  communityId?: string
  spaceId?: string
  search?: string
  priority?: string
  pinnedOnly?: boolean
  status?: string
  limit?: number
  cursor?: string
} = {}): Promise<AnnouncementListResult> {
  const sql = getDb()
  const user = getCurrentUser()
  const limit = opts.limit ?? 20

  const conditions: string[] = []
  const params: (string | number)[] = []
  let paramIdx = 1

  // Only show published (+ scheduled that are past their publish_time) for non-admin views
  if (opts.status) {
    conditions.push(`a.status = $${paramIdx}`)
    params.push(opts.status)
    paramIdx++
  } else {
    conditions.push(`(a.status = 'published' OR (a.status = 'scheduled' AND a.publish_time <= now()))`)
  }

  if (opts.communityId) {
    conditions.push(`a.community_id = $${paramIdx}`)
    params.push(opts.communityId)
    paramIdx++
  }
  if (opts.spaceId) {
    conditions.push(`a.space_id = $${paramIdx}`)
    params.push(opts.spaceId)
    paramIdx++
  }
  if (opts.search) {
    conditions.push(`(a.title ILIKE $${paramIdx} OR a.body ILIKE $${paramIdx})`)
    params.push(`%${opts.search}%`)
    paramIdx++
  }
  if (opts.priority && opts.priority !== "all") {
    conditions.push(`a.priority = $${paramIdx}`)
    params.push(opts.priority)
    paramIdx++
  }
  if (opts.pinnedOnly) {
    conditions.push(`a.is_pinned = true`)
  }
  if (opts.cursor) {
    conditions.push(`a.created_at < $${paramIdx}`)
    params.push(opts.cursor)
    paramIdx++
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

  params.push(limit + 1)
  const limitParam = `$${paramIdx}`

  const rows = await sql(`
    SELECT
      a.*,
      c.name AS community_name,
      c.slug AS community_slug,
      s.name AS space_name,
      s.slug AS space_slug
    FROM announcements a
    JOIN communities c ON a.community_id = c.id
    LEFT JOIN spaces s ON a.space_id = s.id
    ${where}
    ORDER BY a.is_pinned DESC, a.created_at DESC
    LIMIT ${limitParam}
  `, params) as AnnouncementWithMeta[]

  const hasMore = rows.length > limit
  const announcements = hasMore ? rows.slice(0, limit) : rows
  const cursor = hasMore && announcements.length > 0
    ? announcements[announcements.length - 1].created_at
    : null

  return { announcements, cursor, hasMore }
}

// ─── Get Single Announcement ────────────────────────────────────────────────

export async function getAnnouncementById(id: string): Promise<AnnouncementWithMeta | null> {
  const sql = getDb()

  const rows = await sql(`
    SELECT
      a.*,
      c.name AS community_name,
      c.slug AS community_slug,
      s.name AS space_name,
      s.slug AS space_slug
    FROM announcements a
    JOIN communities c ON a.community_id = c.id
    LEFT JOIN spaces s ON a.space_id = s.id
    WHERE a.id = $1
  `, [id]) as AnnouncementWithMeta[]

  return rows[0] ?? null
}

// ─── Increment View Count ───────────────────────────────────────────────────

export async function incrementViewCount(id: string): Promise<void> {
  const sql = getDb()
  await sql(`UPDATE announcements SET view_count = view_count + 1 WHERE id = $1`, [id])
}

// ─── Create Announcement ────────────────────────────────────────────────────

export async function createAnnouncement(input: CreateAnnouncementInput): Promise<AnnouncementWithMeta> {
  const sql = getDb()
  const user = getCurrentUser()

  let nextRecurrence: string | null = null
  if (input.recurrence_rule && input.recurrence_rule !== "none") {
    const base = input.publish_time ? new Date(input.publish_time) : new Date()
    const next = getNextRecurrenceDate(input.recurrence_rule as RecurrenceRule, base)
    nextRecurrence = next ? next.toISOString() : null
  }

  const rows = await sql(`
    INSERT INTO announcements (
      community_id, space_id, template_id, title, body, priority,
      status, publish_time, recurrence_rule, next_recurrence_at, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `, [
    input.community_id,
    input.space_id ?? null,
    input.template_id ?? null,
    input.title,
    input.body,
    input.priority,
    input.status,
    input.publish_time ?? (input.status === "published" ? new Date().toISOString() : null),
    input.recurrence_rule ?? "none",
    nextRecurrence,
    user.id,
  ]) as AnnouncementWithMeta[]

  // Re-fetch with joins
  return (await getAnnouncementById(rows[0].id))!
}

// ─── Update Announcement ────────────────────────────────────────────────────

export async function updateAnnouncement(
  id: string,
  input: UpdateAnnouncementInput
): Promise<AnnouncementWithMeta> {
  const sql = getDb()

  const sets: string[] = []
  const params: (string | number | boolean | null)[] = []
  let paramIdx = 1

  if (input.title !== undefined) {
    sets.push(`title = $${paramIdx}`)
    params.push(input.title)
    paramIdx++
  }
  if (input.body !== undefined) {
    sets.push(`body = $${paramIdx}`)
    params.push(input.body)
    paramIdx++
  }
  if (input.priority !== undefined) {
    sets.push(`priority = $${paramIdx}`)
    params.push(input.priority)
    paramIdx++
  }
  if (input.status !== undefined) {
    sets.push(`status = $${paramIdx}`)
    params.push(input.status)
    paramIdx++
  }
  if (input.publish_time !== undefined) {
    sets.push(`publish_time = $${paramIdx}`)
    params.push(input.publish_time)
    paramIdx++
  }
  if (input.recurrence_rule !== undefined) {
    sets.push(`recurrence_rule = $${paramIdx}`)
    params.push(input.recurrence_rule)
    paramIdx++

    if (input.recurrence_rule && input.recurrence_rule !== "none") {
      const base = input.publish_time ? new Date(input.publish_time) : new Date()
      const next = getNextRecurrenceDate(input.recurrence_rule as RecurrenceRule, base)
      sets.push(`next_recurrence_at = $${paramIdx}`)
      params.push(next ? next.toISOString() : null)
      paramIdx++
    } else {
      sets.push(`next_recurrence_at = NULL`)
    }
  }

  sets.push(`updated_at = now()`)
  params.push(id)

  await sql(`
    UPDATE announcements SET ${sets.join(", ")} WHERE id = $${paramIdx}
  `, params)

  return (await getAnnouncementById(id))!
}

// ─── Pin / Unpin ────────────────────────────────────────────────────────────

export async function togglePin(id: string): Promise<AnnouncementWithMeta> {
  const sql = getDb()

  const current = await getAnnouncementById(id)
  if (!current) throw new Error("Announcement not found")

  const newPinned = !current.is_pinned
  await sql(`
    UPDATE announcements
    SET is_pinned = $1, pinned_at = $2, updated_at = now()
    WHERE id = $3
  `, [newPinned, newPinned ? new Date().toISOString() : null, id])

  return (await getAnnouncementById(id))!
}

// ─── Delete Announcement ────────────────────────────────────────────────────

export async function deleteAnnouncement(id: string): Promise<void> {
  const sql = getDb()
  await sql(`DELETE FROM announcements WHERE id = $1`, [id])
}

// ─── Archive Announcement ───────────────────────────────────────────────────

export async function archiveAnnouncement(id: string): Promise<AnnouncementWithMeta> {
  return updateAnnouncement(id, { status: "archived" })
}

// ─── Templates ──────────────────────────────────────────────────────────────

export async function getTemplates(communityId: string): Promise<AnnouncementTemplate[]> {
  const sql = getDb()
  const rows = await sql(`
    SELECT * FROM announcement_templates
    WHERE community_id = $1
    ORDER BY created_at DESC
  `, [communityId]) as AnnouncementTemplate[]
  return rows
}

export async function createTemplate(input: CreateTemplateInput): Promise<AnnouncementTemplate> {
  const sql = getDb()
  const user = getCurrentUser()

  const rows = await sql(`
    INSERT INTO announcement_templates (community_id, name, title_template, body_template, priority, created_by)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [
    input.community_id,
    input.name,
    input.title_template,
    input.body_template,
    input.priority,
    user.id,
  ]) as AnnouncementTemplate[]

  return rows[0]
}

export async function deleteTemplate(id: string): Promise<void> {
  const sql = getDb()
  await sql(`DELETE FROM announcement_templates WHERE id = $1`, [id])
}

// ─── Analytics Helper ───────────────────────────────────────────────────────

export async function getAnnouncementStats(communityId: string): Promise<{
  total: number
  published: number
  scheduled: number
  drafts: number
  totalViews: number
  pinnedCount: number
}> {
  const sql = getDb()

  const rows = await sql(`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'published') AS published,
      COUNT(*) FILTER (WHERE status = 'scheduled') AS scheduled,
      COUNT(*) FILTER (WHERE status = 'draft') AS drafts,
      COALESCE(SUM(view_count), 0) AS total_views,
      COUNT(*) FILTER (WHERE is_pinned = true) AS pinned_count
    FROM announcements
    WHERE community_id = $1
  `, [communityId]) as { total: string; published: string; scheduled: string; drafts: string; total_views: string; pinned_count: string }[]

  const r = rows[0]
  return {
    total: Number(r.total),
    published: Number(r.published),
    scheduled: Number(r.scheduled),
    drafts: Number(r.drafts),
    totalViews: Number(r.total_views),
    pinnedCount: Number(r.pinned_count),
  }
}
