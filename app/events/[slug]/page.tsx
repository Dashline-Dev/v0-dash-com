import { notFound } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/mock-user"
import { AuthRequiredModal } from "@/components/auth/auth-required-modal"
import { getEventBySlug, getEventRsvps } from "@/lib/actions/event-actions"
import { EventDetail } from "@/components/events/event-detail"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const event = await getEventBySlug(slug)
  if (!event) return { title: "Event Not Found" }
  return {
    title: `${event.title} | Dash`,
    description: event.description?.slice(0, 160) ?? "",
  }
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const user = await getAuthenticatedUser()
  if (!user) return <AuthRequiredModal />

  const { slug } = await params
  const event = await getEventBySlug(slug)

  if (!event) notFound()

  const rsvps = await getEventRsvps(event.id)

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <EventDetail event={event} rsvps={rsvps} />
    </div>
  )
}
