import { getAuthenticatedUser } from "@/lib/mock-user"
import { AuthRequiredModal } from "@/components/auth/auth-required-modal"
import { getUserCommunities } from "@/lib/actions/user-actions"
import { getAreas } from "@/lib/actions/area-actions"
import { CreateEventWizard } from "@/components/events/create/create-wizard"
import { Card } from "@/components/ui/card"

export const metadata = {
  title: "Create Event | Dash",
  description: "Create a new event - share it publicly or with your communities.",
}

export default async function CreateEventPage() {
  const user = await getAuthenticatedUser()
  if (!user) return <AuthRequiredModal />

  // Get communities the user is a member of
  let communities: { id: string; name: string; slug: string }[] = []
  try {
    const memberships = await getUserCommunities(user.id)
    communities = memberships.map((m) => ({
      id: m.community_id as string,
      name: m.community_name as string,
      slug: m.community_slug as string,
    }))
  } catch {
    // User may not be in any communities - that's fine
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
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <Card className="p-6 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Create Event</h1>
        <p className="text-muted-foreground mt-1">
          Plan a gathering, celebration, or meetup. Share it with anyone via link or post to your communities.
        </p>
      </Card>

      <CreateEventWizard communities={communities} availableAreas={availableAreas} />
    </div>
  )
}
