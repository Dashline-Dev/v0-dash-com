import { notFound } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/mock-user"
import { getEventBySlug, getPublicEventBySlug, getEventRsvps } from "@/lib/actions/event-actions"
import { getUserCommunities } from "@/lib/actions/user-actions"
import { EventDetail } from "@/components/events/event-detail"
import { EventPublicView } from "@/components/events/event-public-view"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  // Try public first for SEO
  const event = await getPublicEventBySlug(slug)
  if (!event) return { title: "Event Not Found" }
  return {
    title: `${event.title} | Dash`,
    description: event.description?.slice(0, 160) ?? "",
    openGraph: {
      title: event.title,
      description: event.description?.slice(0, 160) ?? "",
      type: "website",
    },
  }
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const user = await getAuthenticatedUser()

  // If user is logged in, get full event with their RSVP status
  if (user) {
    const event = await getEventBySlug(slug)
    if (!event) notFound()

    const rsvps = await getEventRsvps(event.id)

    // Get user's communities for sharing
    let communities: { id: string; name: string; slug: string }[] = []
    try {
      const memberships = await getUserCommunities(user.id)
      communities = memberships.map((m) => ({
        id: m.community_id as string,
        name: m.community_name as string,
        slug: m.community_slug as string,
      }))
    } catch {
      // User may not be in any communities
    }

    // Check if user can edit (creator or admin)
    const canEdit = event.created_by === user.id || user.role === "admin"

    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <EventDetail event={event} rsvps={rsvps} communities={communities} canEdit={canEdit} />
      </div>
    )
  }

  // For public/anonymous users, show public view if event allows it
  const event = await getPublicEventBySlug(slug)
  if (!event) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <EventPublicView event={event} />
    </div>
  )
}
