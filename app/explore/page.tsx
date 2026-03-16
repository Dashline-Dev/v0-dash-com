import { Metadata } from "next"
import { getAuthenticatedUser } from "@/lib/mock-user"
import { AuthRequiredModal } from "@/components/auth/auth-required-modal"
import { ExploreView } from "@/components/explore/explore-view"
import { getTrending } from "@/lib/actions/search-actions"

export const metadata: Metadata = {
  title: "Explore | Kesher",
  description:
    "Discover communities, events, spaces, and areas. Search, filter, and find your community.",
}

export default async function ExplorePage() {
  const [user, trending] = await Promise.all([
    getAuthenticatedUser(),
    getTrending(),
  ])

  const content = (
    <ExploreView
      initialTrending={trending}
    />
  )

  if (!user) {
    return <AuthRequiredModal>{content}</AuthRequiredModal>
  }

  return content
}
