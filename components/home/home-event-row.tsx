"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import {
  MapPin,
  Clock,
  Check,
  Star,
  X,
  ChevronDown,
  Loader2,
  Globe,
  Video,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { rsvpToEvent, cancelRsvp } from "@/lib/actions/event-actions"
import type { EventWithMeta, RsvpStatus } from "@/types/event"
import { cn } from "@/lib/utils"

interface HomeEventRowProps {
  event: EventWithMeta
  /** Called when the RSVP changes so the parent can re-sort sections */
  onRsvpChange?: (eventId: string, newStatus: RsvpStatus | null) => void
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

export function HomeEventRow({ event, onRsvpChange }: HomeEventRowProps) {
  const [status, setStatus] = useState<RsvpStatus | null>(event.current_user_rsvp)
  const [isPending, startTransition] = useTransition()
  const { day, month, weekday, time } = formatDate(event.start_time)
  const LocationIcon = TYPE_ICON[event.event_type] ?? MapPin

  function handleRsvp(newStatus: RsvpStatus) {
    startTransition(async () => {
      await rsvpToEvent(event.id, newStatus)
      setStatus(newStatus)
      onRsvpChange?.(event.id, newStatus)
    })
  }

  function handleCancel() {
    startTransition(async () => {
      await cancelRsvp(event.id)
      setStatus(null)
      onRsvpChange?.(event.id, null)
    })
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/40 transition-colors group">
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
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/events/${event.slug}`}
          className="text-sm font-medium text-foreground truncate block group-hover:text-primary transition-colors"
        >
          {event.title}
        </Link>
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

      {/* RSVP control */}
      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
        {isPending ? (
          <div className="w-[90px] flex items-center justify-center py-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
          </div>
        ) : status ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors border",
                  status === "going"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-foreground border-border hover:border-primary/30"
                )}
              >
                {status === "going" ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Star className="w-3 h-3" />
                )}
                {status === "going" ? "Going" : "Interested"}
                <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              {status !== "going" && (
                <DropdownMenuItem onClick={() => handleRsvp("going")}>
                  <Check className="w-3.5 h-3.5 mr-2" />
                  Going
                </DropdownMenuItem>
              )}
              {status !== "interested" && (
                <DropdownMenuItem onClick={() => handleRsvp("interested")}>
                  <Star className="w-3.5 h-3.5 mr-2" />
                  Interested
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleRsvp("not_going")}>
                <X className="w-3.5 h-3.5 mr-2" />
                Not Going
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleCancel}
                className="text-destructive focus:text-destructive"
              >
                Cancel RSVP
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
                RSVP
                <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => handleRsvp("going")}>
                <Check className="w-3.5 h-3.5 mr-2" />
                Going
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRsvp("interested")}>
                <Star className="w-3.5 h-3.5 mr-2" />
                Interested
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRsvp("not_going")}>
                <X className="w-3.5 h-3.5 mr-2" />
                Not Going
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}
