// ─── Announcement Enums & Constants ─────────────────────────────────────────

export type AnnouncementPriority = "normal" | "high" | "critical"
export type AnnouncementStatus = "draft" | "published" | "scheduled" | "archived"
export type RecurrenceRule = "none" | "daily" | "weekly" | "biweekly" | "monthly"

export const ANNOUNCEMENT_PRIORITY_LABELS: Record<AnnouncementPriority, string> = {
  normal: "Normal",
  high: "High",
  critical: "Critical",
}

export const ANNOUNCEMENT_PRIORITY_COLORS: Record<AnnouncementPriority, string> = {
  normal: "bg-secondary text-secondary-foreground",
  high: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

export const ANNOUNCEMENT_STATUS_LABELS: Record<AnnouncementStatus, string> = {
  draft: "Draft",
  published: "Published",
  scheduled: "Scheduled",
  archived: "Archived",
}

export const RECURRENCE_LABELS: Record<RecurrenceRule, string> = {
  none: "No repeat",
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
}

// ─── Core Interfaces ────────────────────────────────────────────────────────

export interface Announcement {
  id: string
  community_id: string
  space_id: string | null
  template_id: string | null
  title: string
  body: string
  priority: AnnouncementPriority
  is_pinned: boolean
  pinned_at: string | null
  status: AnnouncementStatus
  publish_time: string | null
  recurrence_rule: RecurrenceRule | null
  next_recurrence_at: string | null
  view_count: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface AnnouncementWithMeta extends Announcement {
  community_name: string
  community_slug: string
  space_name: string | null
  space_slug: string | null
}

export interface AnnouncementTemplate {
  id: string
  community_id: string
  name: string
  title_template: string
  body_template: string
  priority: AnnouncementPriority
  created_by: string
  created_at: string
}

// ─── Form Types ─────────────────────────────────────────────────────────────

export interface CreateAnnouncementInput {
  community_id: string
  space_id?: string
  template_id?: string
  title: string
  body: string
  priority: AnnouncementPriority
  status: "draft" | "published" | "scheduled"
  publish_time?: string
  recurrence_rule?: RecurrenceRule
}

export interface UpdateAnnouncementInput {
  title?: string
  body?: string
  priority?: AnnouncementPriority
  status?: AnnouncementStatus
  publish_time?: string | null
  recurrence_rule?: RecurrenceRule | null
}

export interface CreateTemplateInput {
  community_id: string
  name: string
  title_template: string
  body_template: string
  priority: AnnouncementPriority
}

// ─── Query Types ────────────────────────────────────────────────────────────

export interface AnnouncementListResult {
  announcements: AnnouncementWithMeta[]
  cursor: string | null
  hasMore: boolean
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function formatTimeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function isScheduledForFuture(announcement: Announcement): boolean {
  if (announcement.status !== "scheduled" || !announcement.publish_time) return false
  return new Date(announcement.publish_time) > new Date()
}

export function getNextRecurrenceDate(rule: RecurrenceRule, from: Date = new Date()): Date | null {
  if (rule === "none") return null
  const next = new Date(from)
  switch (rule) {
    case "daily":
      next.setDate(next.getDate() + 1)
      break
    case "weekly":
      next.setDate(next.getDate() + 7)
      break
    case "biweekly":
      next.setDate(next.getDate() + 14)
      break
    case "monthly":
      next.setMonth(next.getMonth() + 1)
      break
  }
  return next
}
