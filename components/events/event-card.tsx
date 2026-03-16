"use client"

import Link from "next/link"
import {
  Clock,
  MapPin,
  Video,
  Users,
  Monitor,
  Calendar,
} from "lucide-react"
import type { EventWithMeta } from "@/types/event"
import {
  EVENT_TYPE_LABELS,
  formatEventTime,
  isEventPast,
} from "@/types/event"
import { cn } from "@/lib/utils"
import { hebrewDayStr } from "@/lib/hebrew-date"

interface EventCardProps {
  event: EventWithMeta
  basePath?: string
}

const TYPE_ICON: Record<string, React.ElementType> = {
  in_person: MapPin,
  virtual: Monitor,
  hybrid: Video,
}

export function EventCard({ event, basePath }: EventCardProps) {
  const past = isEventPast(event.end_time)
  const Icon = TYPE_ICON[event.event_type] ?? Calendar
  const href = basePath
    ? `${basePath}/${event.slug}`
    : `/events/${event.slug}`

  const startDate = new Date(event.start_time)
  const month = startDate.toLocaleString("en-US", { month: "short", timeZone: event.timezone || "UTC" }).toUpperCase()
  const day = startDate.toLocaleDateString("en-US", { day: "numeric", timeZone: event.timezone || "UTC" })

  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 py-2.5 px-3 border-b border-border last:border-b-0 transition-colors hover:bg-accent/50",
        past && "opacity-50"
      )}
    >
      {/* Date block */}
      <div className="flex flex-col items-center justify-center rounded bg-primary/5 px-2 py-1 min-w-10 shrink-0">
        <span className="text-[9px] font-semibold tracking-wider text-primary leading-tight">
          {month}
        </span>
        <span className="text-base font-bold text-foreground leading-tight">
          {day}
        </span>
        <span
          className="text-[8px] text-muted-foreground leading-tight mt-0.5"
          dir="rtl"
          lang="he"
        >
          {hebrewDayStr(startDate)}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {event.title}
          </h3>
          {past && (
            <span className="text-[10px] text-muted-foreground shrink-0">Past</span>
          )}
          {event.current_user_rsvp === "going" && !past && (
            <span className="text-[10px] text-chart-5 font-medium shrink-0">Going</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <Clock className="w-3 h-3" />
            {formatEventTime(event.start_time, event.timezone)}
          </span>
          <span className="flex items-center gap-0.5">
            <Icon className="w-3 h-3" />
            {EVENT_TYPE_LABELS[event.event_type]}
          </span>
          {event.location_name && (
            <span className="flex items-center gap-0.5 truncate hidden sm:flex">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{event.location_name}</span>
            </span>
          )}
        </div>
      </div>

      {/* Right meta */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {event.rsvp_count}
        </span>
        <span className="hidden sm:inline text-[11px] truncate max-w-[100px]">
          {event.community_name}
        </span>
      </div>
    </Link>
  )
}
