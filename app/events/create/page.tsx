import { redirect } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/mock-user"
import { getCommunities } from "@/lib/actions/community-actions"
import { EventCreatePicker } from "@/components/events/event-create-picker"

export const metadata = {
  title: "Create Event | Dash",
  description: "Create a new event for your community.",
}

export default async function CreateEventPage() {
  const user = await getAuthenticatedUser()
  if (!user) redirect("/signin")

  const result = await getCommunities({ limit: 50 })
  const communities = result.data ?? []

  if (communities.length === 0) {
    redirect("/communities/create")
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Create Event</h1>
        <p className="text-muted-foreground mt-1">
          Choose a community, then fill in the details.
        </p>
      </div>

      <EventCreatePicker communities={communities} />
    </div>
  )
}
