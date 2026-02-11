import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import {
  getCommunityBySlug,
  getCommunityMembers,
  getCommunityAnalytics,
} from "@/lib/actions/community-actions"
import { getCurrentUser } from "@/lib/mock-user"
import { AdminLayout } from "@/components/communities/admin/admin-layout"
import { Button } from "@/components/ui/button"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const community = await getCommunityBySlug(slug)

  return {
    title: community
      ? `Admin - ${community.name} - Community Circle`
      : "Admin - Community Circle",
  }
}

export default async function CommunityAdminPage({ params }: PageProps) {
  const { slug } = await params
  const community = await getCommunityBySlug(slug)

  if (!community) {
    notFound()
  }

  // Check admin access
  const user = getCurrentUser()
  if (
    community.current_user_role !== "owner" &&
    community.current_user_role !== "admin"
  ) {
    redirect(`/communities/${slug}`)
  }

  const [membersResult, analytics] = await Promise.all([
    getCommunityMembers(community.id),
    getCommunityAnalytics(community.id),
  ])

  return (
    <div className="px-4 py-5 md:px-6 lg:px-10 md:py-8">
      <div className="max-w-4xl">
        {/* Back link + Title */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/communities/${slug}`}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Admin Console
            </h1>
            <p className="text-sm text-muted-foreground">{community.name}</p>
          </div>
        </div>

        <AdminLayout
          community={community}
          members={membersResult.data}
          membersCursor={membersResult.nextCursor}
          membersHasMore={membersResult.hasMore}
          analytics={{
            stats: analytics.stats,
            roleBreakdown: analytics.roleBreakdown,
          }}
        />
      </div>
    </div>
  )
}
