"use client"

import Link from "next/link"
import { Pin, Megaphone, AlertTriangle, AlertCircle, Eye } from "lucide-react"
import type { AnnouncementWithMeta } from "@/types/announcement"
import {
  ANNOUNCEMENT_PRIORITY_LABELS,
  formatTimeAgo,
} from "@/types/announcement"
import { cn } from "@/lib/utils"

interface AnnouncementCardProps {
  announcement: AnnouncementWithMeta
  basePath?: string
}

const PRIORITY_ICON: Record<string, React.ElementType> = {
  normal: Megaphone,
  high: AlertCircle,
  critical: AlertTriangle,
}

const PRIORITY_COLOR: Record<string, string> = {
  normal: "text-primary",
  high: "text-amber-500",
  critical: "text-red-500",
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
      className={cn(
        "group flex items-start gap-3 py-2.5 px-3 border-b last:border-b-0 transition-colors hover:bg-accent/50",
        isCritical
          ? "border-red-200/50 dark:border-red-900/30"
          : isHigh
            ? "border-amber-200/50 dark:border-amber-900/30"
            : "border-border"
      )}
    >
      {/* Icon */}
      <div className={cn("mt-0.5 shrink-0", PRIORITY_COLOR[announcement.priority])}>
        <Icon className="w-4 h-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {announcement.is_pinned && (
            <Pin className="w-3 h-3 text-primary shrink-0 fill-primary" />
          )}
          <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {announcement.title}
          </h3>
          <span className={cn("text-[10px] font-medium shrink-0", PRIORITY_COLOR[announcement.priority])}>
            {ANNOUNCEMENT_PRIORITY_LABELS[announcement.priority]}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate leading-snug mt-0.5">
          {announcement.body}
        </p>
      </div>

      {/* Right meta */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground shrink-0">
        <span className="hidden sm:inline truncate max-w-[100px]">{announcement.community_name}</span>
        <span>{formatTimeAgo(announcement.created_at)}</span>
        {announcement.view_count > 0 && (
          <span className="flex items-center gap-0.5">
            <Eye className="w-3 h-3" />
            {announcement.view_count}
          </span>
        )}
      </div>
    </Link>
  )
}
