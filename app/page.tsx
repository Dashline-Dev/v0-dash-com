import Link from "next/link"
import { MapPin, ChevronRight } from "lucide-react"
import { getCommunities } from "@/lib/actions/community-actions"
import { getAreas } from "@/lib/actions/area-actions"
import { CommunityList } from "@/components/communities/community-list"
import { AreaCard } from "@/components/areas/area-card"

export default async function HomePage() {
  const [result, areasResult] = await Promise.all([
    getCommunities({ limit: 12 }),
    getAreas({ type: "city", limit: 4 }),
  ])

  return (
    <div className="px-4 py-5 md:px-6 lg:px-10 md:py-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground text-balance">
          Discover Communities
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Find your people and start connecting
        </p>
      </div>

      {/* Areas discovery */}
      {areasResult.areas.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <MapPin className="w-4.5 h-4.5 text-primary" />
              Explore by Area
            </h2>
            <Link
              href="/areas"
              className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              View all
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {areasResult.areas.map((area) => (
              <AreaCard key={area.id} area={area} />
            ))}
          </div>
        </div>
      )}

      {/* Community list with search, filters, and infinite scroll */}
      <CommunityList
        initialData={result.data}
        initialCursor={result.nextCursor}
        initialHasMore={result.hasMore}
      />
    </div>
  )
}
