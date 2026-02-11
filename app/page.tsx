import { getCommunities } from "@/lib/actions/community-actions"
import { CommunityList } from "@/components/communities/community-list"

export default async function HomePage() {
  const result = await getCommunities({ limit: 12 })

  return (
    <div className="px-4 py-5 md:px-6 lg:px-10 md:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground text-balance">
          Discover Communities
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Find your people and start connecting
        </p>
      </div>

      {/* Community list with search, filters, and infinite scroll */}
      <CommunityList
        initialData={result.data}
        initialCursor={result.nextCursor}
        initialHasMore={result.hasMore}
      />
    </div>
  )
}
