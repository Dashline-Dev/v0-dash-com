import { Metadata } from "next"
import { getAuthenticatedUser } from "@/lib/mock-user"
import { AuthRequiredModal } from "@/components/auth/auth-required-modal"
import { ExploreView } from "@/components/explore/explore-view"
import { getTrending, getExploreMapMarkers } from "@/lib/actions/search-actions"

export const metadata: Metadata = {
  title: "Explore | Community Circle",
  description:
    "Discover communities, events, spaces, and areas near you. Search, filter, and explore on the map.",
}

export default async function ExplorePage() {
  const [user, trending, markers] = await Promise.all([
    getAuthenticatedUser(),
    getTrending(),
    getExploreMapMarkers({ type: "all" }),
  ])

  const content = (
    <ExploreView
      initialTrending={trending}
      initialMarkers={markers}
    />
  )

  if (!user) {
    return <AuthRequiredModal>{content}</AuthRequiredModal>
  }

  return content
}
