"use client"

import Link from "next/link"
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  Monitor,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { EventWithMeta } from "@/types/event"
import {
  EVENT_TYPE_LABELS,
  formatEventDate,
  formatEventTime,
  getEventCapacityText,
  isEventPast,
} from "@/types/event"

interface EventCardProps {
  event: EventWithMeta
  basePath?: string
}

const TYPE_ICON: Record<string, React.ElementType> = {
  in_person: MapPin,
  virtual: Monitor,
  hybrid: Video,
}

const TYPE_COLOR: Record<string, string> = {
  in_person: "bg-chart-5/10 text-chart-5",
  virtual: "bg-chart-1/10 text-chart-1",
  hybrid: "bg-chart-2/10 text-chart-2",
}

export function EventCard({ event, basePath }: EventCardProps) {
  const past = isEventPast(event.end_time)
  const capacityText = getEventCapacityText(event)
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
      className={`group flex gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-card/80 ${past ? "opacity-60" : ""}`}
    >
      {/* Date block */}
      <div className="flex flex-col items-center justify-center rounded-lg bg-primary/5 px-3 py-2 min-w-14 shrink-0">
        <span className="text-[10px] font-semibold tracking-wider text-primary">
          {month}
        </span>
        <span className="text-xl font-bold text-foreground leading-tight">
          {day}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {event.title}
          </h3>
          <Badge
            variant="secondary"
            className={`shrink-0 text-[10px] px-1.5 py-0 ${TYPE_COLOR[event.event_type] ?? ""}`}
          >
            <Icon className="w-3 h-3 mr-1" />
            {EVENT_TYPE_LABELS[event.event_type]}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatEventTime(event.start_time, event.timezone)}
          </span>

          {event.location_name && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 shrink-0" />
              {event.location_name}
            </span>
          )}

          {event.virtual_link && !event.location_name && (
            <span className="flex items-center gap-1">
              <Video className="w-3 h-3" />
              Online
            </span>
          )}

          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {event.rsvp_count} going
          </span>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <span className="text-[11px] text-muted-foreground">
            {event.community_name}
            {event.space_name ? ` / ${event.space_name}` : ""}
          </span>
          {capacityText && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {capacityText}
            </Badge>
          )}
          {past && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              Past
            </Badge>
          )}
          {event.current_user_rsvp === "going" && !past && (
            <Badge className="text-[10px] px-1.5 py-0 bg-chart-5/10 text-chart-5">
              Going
            </Badge>
          )}
          {event.current_user_rsvp === "interested" && !past && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              Interested
            </Badge>
          )}
        </div>
      </div>
    </Link>
  )
}
