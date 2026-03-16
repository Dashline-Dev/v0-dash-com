import { notFound } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/mock-user"
import {
  getEventBySlug,
  getPublicEventBySlug,
  getEventSharedCommunities,
} from "@/lib/actions/event-actions"
import { getUserCommunities } from "@/lib/actions/user-actions"
import { EventDetail } from "@/components/events/event-detail"
import { EventPublicView } from "@/components/events/event-public-view"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const event = await getPublicEventBySlug(slug)
  if (!event) return { title: "Event Not Found" }

  // Use invitation image or cover image as OG preview
  const ogImage =
    event.invitation_image_url || event.cover_image_url || undefined

  return {
    title: `${event.title} | Dash`,
    description: event.description?.slice(0, 160) ?? "",
    openGraph: {
      title: event.title,
      description: event.description?.slice(0, 160) ?? "",
      type: "website",
      ...(ogImage && {
        images: [{ url: ogImage, width: 1200, height: 630, alt: event.title }],
      }),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: event.title,
      description: event.description?.slice(0, 160) ?? "",
      ...(ogImage && { images: [ogImage] }),
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

  if (user) {
    const [event, userCommunities] = await Promise.all([
      getEventBySlug(slug),
      getUserCommunities(user.id).catch(() => []),
    ])
    if (!event) notFound()

    const sharedCommunities = await getEventSharedCommunities(event.id).catch(() => [])

    const communities = userCommunities.map((m) => ({
      id: m.community_id as string,
      name: m.community_name as string,
      slug: m.community_slug as string,
    }))

    const canEdit = event.created_by === user.id || (user as { role?: string }).role === "admin"

    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <EventDetail
          event={event}
          communities={communities}
          sharedCommunityIds={sharedCommunities.map((c) => c.id)}
          canEdit={canEdit}
        />
      </div>
    )
  }

  const event = await getPublicEventBySlug(slug)
  if (!event) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <EventPublicView event={event} />
    </div>
  )
}
