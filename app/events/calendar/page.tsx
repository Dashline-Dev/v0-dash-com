import { getAuthenticatedUser } from "@/lib/mock-user"
import { AuthRequiredModal } from "@/components/auth/auth-required-modal"
import { getEvents } from "@/lib/actions/event-actions"
import { EventsView } from "@/components/events/events-view"

export const metadata = {
  title: "Event Calendar | Dash",
  description: "Browse events in calendar view.",
}

export default async function EventCalendarPage() {
  const user = await getAuthenticatedUser()
  if (!user) return <AuthRequiredModal />

  const { events, total } = await getEvents({ limit: 20, upcoming: true })

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-5 md:py-6 pb-24 md:pb-8">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground">Calendar</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Browse events by date
        </p>
      </div>

      <EventsView
        initialEvents={events}
        initialTotal={total}
        defaultView="calendar"
        defaultCalendarMode="month"
      />
    </div>
  )
}
