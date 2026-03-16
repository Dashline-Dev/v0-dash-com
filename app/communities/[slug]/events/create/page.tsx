import { notFound } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/mock-user"
import { AuthRequiredModal } from "@/components/auth/auth-required-modal"
import { getCommunityBySlug } from "@/lib/actions/community-actions"
import { getUserCommunities } from "@/lib/actions/user-actions"
import { getAreas } from "@/lib/actions/area-actions"
import { CreateEventWizard } from "@/components/events/create/create-wizard"
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
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ space?: string }>
}) {
  const user = await getAuthenticatedUser()
  if (!user) return <AuthRequiredModal />

  const [{ slug }, sp] = await Promise.all([params, searchParams])
  const community = await getCommunityBySlug(slug)
  if (!community) notFound()

  const preSelectedSpaceId = sp.space ?? undefined

  // Fetch communities for the wizard's Settings step (community switcher)
  let communities: { id: string; name: string; slug: string }[] = []
  try {
    const memberships = await getUserCommunities(user.id)
    communities = memberships.map((m) => ({
      id: m.community_id as string,
      name: m.community_name as string,
      slug: m.community_slug as string,
    }))
  } catch {
    // Non-fatal — falls back to locked community display
  }

  // Get available areas for linking
  const { areas } = await getAreas({ limit: 100 })
  const availableAreas = areas.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    parentName: a.parent_name ?? null,
  }))

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

        <CreateEventWizard
          communities={communities}
          availableAreas={availableAreas}
          preSelectedCommunityId={community.id}
          preSelectedCommunityName={community.name}
          preSelectedCommunityVisibility={community.visibility}
          preSelectedCommunityTimezone={community.timezone}
          preSelectedSpaceId={preSelectedSpaceId}
        />
      </div>
    </div>
  )
}
