"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CalendarPlus } from "lucide-react"
import { EventsView } from "@/components/events/events-view"
import type { EventWithMeta } from "@/types/event"

interface CommunityEventsProps {
  communitySlug: string
  communityId?: string
  events: EventWithMeta[]
}

export function CommunityEvents({
  communitySlug,
  communityId,
  events,
}: CommunityEventsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <Button size="sm" className="gap-1.5 h-8 text-xs" asChild>
          <Link href={`/communities/${communitySlug}/events/create`}>
            <CalendarPlus className="w-3.5 h-3.5" />
            Add Event
          </Link>
        </Button>
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
        <EventsView
          initialEvents={events}
          initialTotal={events.length}
          communityId={communityId}
          communitySlug={communitySlug}
          basePath={`/communities/${communitySlug}/events`}
          defaultView="calendar"
          defaultCalendarMode="today"
        />
      )}
    </div>
  )
}
