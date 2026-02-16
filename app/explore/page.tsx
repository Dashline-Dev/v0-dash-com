import { Metadata } from "next"
import { ExploreView } from "@/components/explore/explore-view"
import { getTrending, getExploreMapMarkers } from "@/lib/actions/search-actions"

export const metadata: Metadata = {
  title: "Explore | Community Circle",
  description:
    "Discover communities, events, spaces, and areas near you. Search, filter, and explore on the map.",
}

export default async function ExplorePage() {
  const [trending, markers] = await Promise.all([
    getTrending(),
    getExploreMapMarkers({ type: "all" }),
  ])

  return (
    <ExploreView
      initialTrending={trending}
      initialMarkers={markers}
    />
  )
}
