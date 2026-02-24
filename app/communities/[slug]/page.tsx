import { notFound } from "next/navigation"
import {
  getCommunityBySlug,
  getCommunityMembers,
} from "@/lib/actions/community-actions"
import { getSpacesByCommunity } from "@/lib/actions/space-actions"
import { getEvents } from "@/lib/actions/event-actions"
import { getAnnouncements } from "@/lib/actions/announcement-actions"
import { getCommunityAreas } from "@/lib/actions/area-actions"
import { getSuperAdminSession } from "@/lib/superadmin"
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

  const superAdmin = await getSuperAdminSession()

  const [membersResult, spaces, eventsResult, announcementsResult, areas] = await Promise.all([
    getCommunityMembers(community.id),
    getSpacesByCommunity(slug),
    getEvents({ communityId: community.id, limit: 10, upcomingOnly: true }),
    getAnnouncements({ communityId: community.id, limit: 20 }),
    getCommunityAreas(community.id),
  ])

  return (
    <div>
      <CommunityHeader community={community} isSuperAdmin={!!superAdmin} />

      <div className="px-4 md:px-6 lg:px-10 py-6">
        <div className="max-w-4xl">
          <CommunityTabs
            community={community}
            members={membersResult.data}
            membersCursor={membersResult.nextCursor}
            membersHasMore={membersResult.hasMore}
            spaces={spaces}
            events={eventsResult.events}
            announcements={announcementsResult.announcements}
            areas={areas}
          />
        </div>
      </div>
    </div>
  )
}
