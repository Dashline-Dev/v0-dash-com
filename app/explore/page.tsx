import { Metadata } from "next"
import { ExploreView } from "@/components/explore/explore-view"
import { getTrending } from "@/lib/actions/search-actions"

export const metadata: Metadata = {
  title: "Explore | Kesher",
  description:
    "Discover communities, events, spaces, and areas. Search, filter, and find your community.",
}

export default async function ExplorePage() {
  const trending = await getTrending()

  return (
    <ExploreView
      initialTrending={trending}
    />
  )
}
