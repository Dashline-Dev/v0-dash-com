import { getCommunities } from "@/lib/actions/community-actions"
import { CommunityList } from "@/components/communities/community-list"

export const metadata = {
  title: "Communities | Community Circle",
  description: "Browse, search, and join communities near you.",
}

export default async function CommunitiesPage() {
  const result = await getCommunities({ limit: 12 })

  return (
    <div className="px-4 py-5 md:px-6 lg:px-10 md:py-8 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground text-balance">
          Communities
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Browse and join communities that match your interests
        </p>
      </div>

      <CommunityList
        initialData={result.data}
        initialCursor={result.nextCursor}
        initialHasMore={result.hasMore}
      />
    </div>
  )
}
