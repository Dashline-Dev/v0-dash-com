import { notFound } from "next/navigation"
import {
  getCommunityBySlug,
  getCommunityMembers,
} from "@/lib/actions/community-actions"
import { CommunityHeader } from "@/components/communities/community-header"
import { CommunityTabs } from "@/components/communities/community-tabs"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const community = await getCommunityBySlug(slug)

  if (!community) {
    return { title: "Community Not Found" }
  }

  return {
    title: `${community.name} - Community Circle`,
    description: community.description || `Join ${community.name} on Community Circle`,
  }
}

export default async function CommunityDetailPage({ params }: PageProps) {
  const { slug } = await params
  const community = await getCommunityBySlug(slug)

  if (!community) {
    notFound()
  }

  const membersResult = await getCommunityMembers(community.id)

  return (
    <div>
      <CommunityHeader community={community} />

      <div className="px-4 md:px-6 lg:px-10 py-6">
        <div className="max-w-4xl">
          <CommunityTabs
            community={community}
            members={membersResult.data}
            membersCursor={membersResult.nextCursor}
            membersHasMore={membersResult.hasMore}
          />
        </div>
      </div>
    </div>
  )
}
