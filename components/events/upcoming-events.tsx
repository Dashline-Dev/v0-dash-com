import Link from "next/link"
import { CalendarDays, MapPin, Users, Clock, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface UpcomingEvent {
  id: string
  title: string
  slug: string
  eventType: string
  startTime: string
  endTime: string
  timezone: string
  locationName: string | null
  rsvpCount: number
  maxAttendees: number | null
  communityName: string
  communitySlug: string
}

function formatEventDate(startTime: string): { day: string; month: string; time: string } {
  const d = new Date(startTime)
  return {
    day: d.getDate().toString(),
    month: d.toLocaleDateString("en-US", { month: "short" }),
    time: d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
  }
}

export function UpcomingEventsList({ events }: { events: UpcomingEvent[] }) {
  if (events.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <CalendarDays className="w-4.5 h-4.5 text-primary" />
          Upcoming Events
        </h2>
        <Link
          href="/events"
          className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          View all
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {events.map((event) => {
          const { day, month, time } = formatEventDate(event.startTime)
          return (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors group"
            >
              {/* Date badge */}
              <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary shrink-0">
                <span className="text-[10px] font-medium uppercase leading-none">
                  {month}
                </span>
                <span className="text-lg font-bold leading-tight">
                  {day}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {event.title}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {time}
                  </span>
                  {event.locationName && (
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{event.locationName}</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {event.communityName}
                  {event.rsvpCount > 0 && (
                    <span className="ml-2 inline-flex items-center gap-0.5">
                      <Users className="w-3 h-3" />
                      {event.rsvpCount} going
                    </span>
                  )}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
