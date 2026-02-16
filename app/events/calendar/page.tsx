import { getEventsForMonth } from "@/lib/actions/event-actions"
import { EventCalendar } from "@/components/events/event-calendar"

export const metadata = {
  title: "Event Calendar | Dash",
  description: "Browse events in calendar view.",
}

export default async function EventCalendarPage() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const events = await getEventsForMonth(year, month)

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Calendar
        </h1>
        <p className="text-muted-foreground mt-1">
          Browse events by date
        </p>
      </div>

      <EventCalendar initialEvents={events} initialYear={year} initialMonth={month} />
    </div>
  )
}
