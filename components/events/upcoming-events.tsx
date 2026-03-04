import Link from "next/link"
import { CalendarDays, MapPin, Users, Clock, ChevronRight } from "lucide-react"

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
    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    time: d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
  }
}

export function UpcomingEventsList({ events }: { events: UpcomingEvent[] }) {
  if (events.length === 0) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5 text-primary" />
          Upcoming Events
        </h2>
        <Link
          href="/events"
          className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5"
        >
          All
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
        {events.map((event) => {
          const { day, month, time } = formatEventDate(event.startTime)
          return (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className="flex items-center gap-3 py-2 px-3 hover:bg-accent/50 transition-colors group"
            >
              {/* Date badge */}
              <div className="flex flex-col items-center justify-center rounded bg-primary/5 px-2 py-1 min-w-10 shrink-0">
                <span className="text-[9px] font-semibold tracking-wider text-primary leading-tight">
                  {month}
                </span>
                <span className="text-base font-bold text-foreground leading-tight">
                  {day}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {event.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    {time}
                  </span>
                  {event.locationName && (
                    <span className="flex items-center gap-0.5 truncate hidden sm:flex">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{event.locationName}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Right meta */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                {event.rsvpCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {event.rsvpCount}
                  </span>
                )}
                <span className="hidden sm:inline text-[11px] truncate max-w-[100px]">
                  {event.communityName}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
