import { notFound } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/mock-user"
import {
  getEventBySlug,
  getPublicEventBySlug,
  getEventSharedCommunities,
} from "@/lib/actions/event-actions"
import { getUserCommunities } from "@/lib/actions/user-actions"
import { EventDetailWrapper } from "@/components/events/event-detail-wrapper"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const event = await getPublicEventBySlug(slug)
  if (!event) return { title: "Event Not Found" }

  // Build a rich description: date, time, host, location, then event description
  const descParts: string[] = []
  if (event.start_time) {
    const d = new Date(event.start_time)
    const dateStr = d.toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
      timeZone: event.timezone || "UTC",
    })
    const timeStr = d.toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit",
      timeZone: event.timezone || "UTC",
    })
    descParts.push(`${dateStr} at ${timeStr}`)
  }
  const host = (event as { community_name?: string | null; space_name?: string | null; organizer_name?: string | null }).community_name
    || (event as { space_name?: string | null }).space_name
    || (event as { organizer_name?: string | null }).organizer_name
  if (host) descParts.push(`Hosted by ${host}`)
  if (event.location_name) descParts.push(event.location_name)
  if (event.description) descParts.push(event.description.slice(0, 120))

  const description = descParts.join(" · ").slice(0, 300)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dashline.tech"
  const ogImageUrl = `${baseUrl}/api/og/event/${slug}`

  return {
    title: `${event.title} | Community Circle`,
    description,
    openGraph: {
      title: event.title,
      description,
      type: "website",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: event.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description,
      images: [ogImageUrl],
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
        <EventDetailWrapper
          event={event}
          communities={communities}
          sharedCommunityIds={sharedCommunities.map((c) => c.id)}
          canEdit={canEdit}
        />
      </div>
    )
  }

  const event = await getPublicEventBySlug(slug)
  // Unauthenticated users may only view explicitly public events.
  // Unlisted/private events require sign-in.
  if (!event || event.visibility !== "public") notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <EventDetailWrapper event={event} variant="public" />
    </div>
  )
}
