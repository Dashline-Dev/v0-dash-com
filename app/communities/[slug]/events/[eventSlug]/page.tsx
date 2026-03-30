import { notFound } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/mock-user"
import { AuthRequiredModal } from "@/components/auth/auth-required-modal"
import { getEventBySlug, getEventRsvps, getEventSharedCommunities } from "@/lib/actions/event-actions"
import { getUserCommunities } from "@/lib/actions/user-actions"
import { EventDetailWrapper } from "@/components/events/event-detail-wrapper"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; eventSlug: string }>
}) {
  const { eventSlug } = await params
  const event = await getEventBySlug(eventSlug)
  if (!event) return { title: "Event Not Found" }
  return {
    title: `${event.title} | Community Circle`,
    description: event.description?.slice(0, 160) ?? "",
  }
}

export default async function CommunityEventDetailPage({
  params,
}: {
  params: Promise<{ slug: string; eventSlug: string }>
}) {
  const user = await getAuthenticatedUser()
  if (!user) return <AuthRequiredModal />

  const { slug, eventSlug } = await params
  const [event, userCommunities] = await Promise.all([
    getEventBySlug(eventSlug),
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
      <Button variant="ghost" size="sm" className="mb-4 gap-1.5" asChild>
        <Link href={`/communities/${slug}`}>
          <ArrowLeft className="w-4 h-4" />
          Back to community
        </Link>
      </Button>
      <EventDetailWrapper
        event={event}
        communities={communities}
        sharedCommunityIds={sharedCommunities.map((c) => c.id)}
        canEdit={canEdit}
        sharerName={user.name}
      />
    </div>
  )
}
