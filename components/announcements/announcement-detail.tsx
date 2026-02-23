"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Pin,
  Megaphone,
  AlertTriangle,
  AlertCircle,
  Eye,
  ArrowLeft,
  Trash2,
  Archive,
  Loader2,
  Clock,
  Repeat,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { AnnouncementWithMeta } from "@/types/announcement"
import {
  ANNOUNCEMENT_PRIORITY_LABELS,
  ANNOUNCEMENT_PRIORITY_COLORS,
  ANNOUNCEMENT_STATUS_LABELS,
  RECURRENCE_LABELS,
  formatTimeAgo,
  type RecurrenceRule,
} from "@/types/announcement"
import {
  togglePin,
  deleteAnnouncement,
  archiveAnnouncement,
  incrementViewCount,
} from "@/lib/actions/announcement-actions"

interface AnnouncementDetailProps {
  announcement: AnnouncementWithMeta
  backHref?: string
}

const PRIORITY_ICON: Record<string, React.ElementType> = {
  normal: Megaphone,
  high: AlertCircle,
  critical: AlertTriangle,
}

export function AnnouncementDetail({ announcement: initial, backHref = "/announcements" }: AnnouncementDetailProps) {
  const router = useRouter()
  const [announcement, setAnnouncement] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const Icon = PRIORITY_ICON[announcement.priority] ?? Megaphone
  const isCritical = announcement.priority === "critical"
  const isHigh = announcement.priority === "high"

  // Increment view on mount
  useEffect(() => {
    incrementViewCount(announcement.id)
  }, [announcement.id])

  function handleTogglePin() {
    startTransition(async () => {
      const updated = await togglePin(announcement.id)
      setAnnouncement(updated)
    })
  }

  function handleArchive() {
    startTransition(async () => {
      const updated = await archiveAnnouncement(announcement.id)
      setAnnouncement(updated)
    })
  }

  function handleDelete() {
    if (!confirm("Delete this announcement permanently?")) return
    startTransition(async () => {
      await deleteAnnouncement(announcement.id)
      router.push(backHref)
    })
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back link */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      {/* Header */}
      <div
        className={`rounded-xl border p-6 ${
          isCritical
            ? "border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20"
            : isHigh
            ? "border-amber-200 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/10"
            : "border-border bg-card"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex items-center justify-center rounded-lg w-10 h-10 shrink-0 mt-0.5 ${
              isCritical
                ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                : isHigh
                ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                : "bg-primary/5 text-primary"
            }`}
          >
            <Icon className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {announcement.is_pinned && (
                  <Pin className="w-3.5 h-3.5 text-primary shrink-0 fill-primary" />
                )}
                <h1 className="text-xl md:text-2xl font-bold text-foreground text-balance">
                  {announcement.title}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap mt-2">
              <Badge
                variant="secondary"
                className={`text-xs ${ANNOUNCEMENT_PRIORITY_COLORS[announcement.priority]}`}
              >
                {ANNOUNCEMENT_PRIORITY_LABELS[announcement.priority]}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {ANNOUNCEMENT_STATUS_LABELS[announcement.status]}
              </Badge>
              {announcement.recurrence_rule && announcement.recurrence_rule !== "none" && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Repeat className="w-3 h-3" />
                  {RECURRENCE_LABELS[announcement.recurrence_rule as RecurrenceRule]}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
              <span>
                {announcement.community_name}
                {announcement.space_name ? ` / ${announcement.space_name}` : ""}
              </span>
              <span>{formatTimeAgo(announcement.created_at)}</span>
              {announcement.view_count > 0 && (
                <span className="flex items-center gap-0.5">
                  <Eye className="w-3 h-3" />
                  {announcement.view_count} views
                </span>
              )}
              {announcement.publish_time && announcement.status === "scheduled" && (
                <span className="flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />
                  Scheduled for {new Date(announcement.publish_time).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="mt-6 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
          {announcement.body}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-border/50 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTogglePin}
            disabled={isPending}
            className="gap-1.5"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Pin className={`w-3.5 h-3.5 ${announcement.is_pinned ? "fill-current" : ""}`} />
            )}
            {announcement.is_pinned ? "Unpin" : "Pin"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleArchive}
            disabled={isPending || announcement.status === "archived"}
            className="gap-1.5"
          >
            <Archive className="w-3.5 h-3.5" />
            Archive
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
            className="gap-1.5 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
