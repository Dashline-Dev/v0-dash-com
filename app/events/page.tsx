import { getEvents } from "@/lib/actions/event-actions"
import { EventList } from "@/components/events/event-list"

export const metadata = {
  title: "Events | Dash",
  description: "Discover upcoming events across all communities.",
}

export default async function EventsPage() {
  const { events, hasMore, cursor } = await getEvents({
    limit: 12,
    upcomingOnly: true,
  })

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground text-balance">
          Events
        </h1>
        <p className="text-muted-foreground mt-1">
          Discover upcoming events across all communities
        </p>
      </div>

      <EventList
        initialEvents={events}
        initialCursor={cursor}
        initialHasMore={hasMore}
      />
    </div>
  )
}
