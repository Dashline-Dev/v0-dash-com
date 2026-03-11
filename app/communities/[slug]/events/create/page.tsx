import { notFound } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/mock-user"
import { AuthRequiredModal } from "@/components/auth/auth-required-modal"
import { getCommunityBySlug } from "@/lib/actions/community-actions"
import { CreateEventForm } from "@/components/events/create-event-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const community = await getCommunityBySlug(slug)
  if (!community) return { title: "Community Not Found" }
  return {
    title: `Create Event - ${community.name} | Dash`,
  }
}

export default async function CommunityCreateEventPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const user = await getAuthenticatedUser()
  if (!user) return <AuthRequiredModal />

  const { slug } = await params
  const community = await getCommunityBySlug(slug)

  if (!community) notFound()

  return (
    <div className="px-4 py-5 md:px-6 lg:px-10 md:py-8">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" size="sm" className="mb-4 gap-1.5" asChild>
          <Link href={`/communities/${slug}`}>
            <ArrowLeft className="w-4 h-4" />
            Back to {community.name}
          </Link>
        </Button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Create Event</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Add an event to {community.name}
          </p>
        </div>

        <CreateEventForm
          communityId={community.id}
          communitySlug={community.slug}
        />
      </div>
    </div>
  )
}
