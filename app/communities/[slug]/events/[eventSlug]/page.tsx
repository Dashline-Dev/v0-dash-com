import { notFound } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/mock-user"
import { AuthRequiredModal } from "@/components/auth/auth-required-modal"
import { getEventBySlug, getEventRsvps } from "@/lib/actions/event-actions"
import { EventDetailClient as EventDetail } from "@/components/events/event-detail-client"
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
  const event = await getEventBySlug(eventSlug)

  if (!event) notFound()

  const rsvps = await getEventRsvps(event.id)

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <Button variant="ghost" size="sm" className="mb-4 gap-1.5" asChild>
        <Link href={`/communities/${slug}`}>
          <ArrowLeft className="w-4 h-4" />
          Back to community
        </Link>
      </Button>
      <EventDetail event={event} rsvps={rsvps} />
    </div>
  )
}
