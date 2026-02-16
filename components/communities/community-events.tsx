"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EventCard } from "@/components/events/event-card"
import { CalendarPlus, Calendar } from "lucide-react"
import type { EventWithMeta } from "@/types/event"

interface CommunityEventsProps {
  communitySlug: string
  events: EventWithMeta[]
}

export function CommunityEvents({
  communitySlug,
  events,
}: CommunityEventsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {events.length} upcoming event{events.length !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <Link href="/events/calendar">
              <Calendar className="w-3.5 h-3.5" />
              Calendar
            </Link>
          </Button>
          <Button size="sm" className="gap-1.5" asChild>
            <Link href={`/communities/${communitySlug}/events/create`}>
              <CalendarPlus className="w-3.5 h-3.5" />
              Add Event
            </Link>
          </Button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CalendarPlus className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-foreground">No upcoming events</p>
          <p className="text-xs text-muted-foreground mt-1">
            Be the first to create an event for this community.
          </p>
          <Button size="sm" className="mt-4 gap-1.5" asChild>
            <Link href={`/communities/${communitySlug}/events/create`}>
              <CalendarPlus className="w-3.5 h-3.5" />
              Create Event
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              href={`/communities/${communitySlug}/events/${event.slug}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
