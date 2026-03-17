import { redirect } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/mock-user"
import { getCommunities } from "@/lib/actions/community-actions"
import { CommunityList } from "@/components/communities/community-list"

export const metadata = {
  title: "Communities | Community Circle",
  description: "Browse, search, and join communities near you.",
}

export default async function CommunitiesPage() {
  const user = await getAuthenticatedUser()
  if (!user) redirect("/signin")

  const result = await getCommunities({ limit: 12 })

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 md:px-6 md:py-6 pb-24 md:pb-8">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground">Communities</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
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
