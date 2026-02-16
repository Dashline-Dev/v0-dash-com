"use client"

import Link from "next/link"
import { Pin, Megaphone, AlertTriangle, AlertCircle, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { AnnouncementWithMeta } from "@/types/announcement"
import {
  ANNOUNCEMENT_PRIORITY_LABELS,
  ANNOUNCEMENT_PRIORITY_COLORS,
  formatTimeAgo,
} from "@/types/announcement"

interface AnnouncementCardProps {
  announcement: AnnouncementWithMeta
  basePath?: string
}

const PRIORITY_ICON: Record<string, React.ElementType> = {
  normal: Megaphone,
  high: AlertCircle,
  critical: AlertTriangle,
}

export function AnnouncementCard({ announcement, basePath }: AnnouncementCardProps) {
  const href = basePath
    ? `${basePath}/${announcement.id}`
    : `/announcements/${announcement.id}`
  const Icon = PRIORITY_ICON[announcement.priority] ?? Megaphone
  const isCritical = announcement.priority === "critical"
  const isHigh = announcement.priority === "high"

  return (
    <Link
      href={href}
      className={`group flex gap-3 rounded-xl border p-4 transition-colors hover:bg-card/80 ${
        isCritical
          ? "border-red-200 bg-red-50/50 hover:border-red-300 dark:border-red-900/40 dark:bg-red-950/20"
          : isHigh
          ? "border-amber-200 bg-amber-50/30 hover:border-amber-300 dark:border-amber-900/40 dark:bg-amber-950/10"
          : "border-border bg-card hover:border-primary/30"
      }`}
    >
      {/* Priority icon */}
      <div
        className={`flex items-center justify-center rounded-lg w-10 h-10 shrink-0 ${
          isCritical
            ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
            : isHigh
            ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
            : "bg-primary/5 text-primary"
        }`}
      >
        <Icon className="w-4.5 h-4.5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {announcement.is_pinned && (
              <Pin className="w-3 h-3 text-primary shrink-0 fill-primary" />
            )}
            <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {announcement.title}
            </h3>
          </div>
          <Badge
            variant="secondary"
            className={`shrink-0 text-[10px] px-1.5 py-0 ${ANNOUNCEMENT_PRIORITY_COLORS[announcement.priority]}`}
          >
            {ANNOUNCEMENT_PRIORITY_LABELS[announcement.priority]}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {announcement.body}
        </p>

        <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
          <span>
            {announcement.community_name}
            {announcement.space_name ? ` / ${announcement.space_name}` : ""}
          </span>
          <span>{formatTimeAgo(announcement.created_at)}</span>
          {announcement.view_count > 0 && (
            <span className="flex items-center gap-0.5">
              <Eye className="w-3 h-3" />
              {announcement.view_count}
            </span>
          )}
          {announcement.status === "scheduled" && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              Scheduled
            </Badge>
          )}
        </div>
      </div>
    </Link>
  )
}
