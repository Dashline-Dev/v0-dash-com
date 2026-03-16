"use client"

import Link from "next/link"
import {
  MapPin,
  Clock,
  Globe,
  Video,
} from "lucide-react"
import type { EventWithMeta } from "@/types/event"
import { cn } from "@/lib/utils"
import { hebrewDayStr } from "@/lib/hebrew-date"

interface HomeEventRowProps {
  event: EventWithMeta
}

function formatDate(str: string) {
  const d = new Date(str)
  return {
    day: d.getDate().toString(),
    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  }
}

const TYPE_ICON = {
  virtual: Video,
  hybrid: Globe,
  in_person: MapPin,
}

export function HomeEventRow({ event }: HomeEventRowProps) {
  const { day, month, weekday, time } = formatDate(event.start_time)
  const LocationIcon = TYPE_ICON[event.event_type] ?? MapPin
  const hebrewDay = hebrewDayStr(new Date(event.start_time))

  return (
    <Link
      href={`/events/${event.slug}`}
      className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/40 transition-colors group"
    >
      {/* Date badge */}
      <div className="flex flex-col items-center justify-center rounded-md bg-primary/8 px-2 py-1.5 min-w-[2.75rem] shrink-0 text-center">
        <span className="text-[9px] font-bold tracking-widest text-primary leading-tight uppercase">
          {month}
        </span>
        <span className="text-lg font-bold text-foreground leading-tight">
          {day}
        </span>
        <span className="text-[9px] text-muted-foreground leading-tight">
          {weekday}
        </span>
        <span
          className="text-[8px] text-muted-foreground/70 leading-tight mt-0.5"
          dir="rtl"
          lang="he"
        >
          {hebrewDay}
        </span>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-foreground truncate block group-hover:text-primary transition-colors">
          {event.title}
        </span>
        <div className="flex items-center gap-2.5 mt-0.5 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-0.5">
            <Clock className="w-3 h-3 shrink-0" />
            {time}
          </span>
          {(event.location_name || event.event_type !== "in_person") && (
            <span className="flex items-center gap-0.5 truncate max-w-[160px]">
              <LocationIcon className="w-3 h-3 shrink-0" />
              <span className="truncate">
                {event.event_type === "virtual"
                  ? "Virtual"
                  : event.event_type === "hybrid"
                  ? event.location_name ?? "Hybrid"
                  : event.location_name}
              </span>
            </span>
          )}
          {event.space_name && (
            <span className="text-muted-foreground/70 truncate hidden sm:inline">
              {event.space_name}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
