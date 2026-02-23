import { notFound } from "next/navigation"
import { getCommunityBySlug } from "@/lib/actions/community-actions"
import { getSpacesByCommunity } from "@/lib/actions/space-actions"
import { CreateAnnouncementForm } from "@/components/announcements/create-announcement-form"

export default async function CommunityCreateAnnouncementPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const community = await getCommunityBySlug(slug)
  if (!community) notFound()

  const spaces = await getSpacesByCommunity(slug)

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8 pb-24 md:pb-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          New Announcement
        </h1>
        <p className="text-muted-foreground mt-1">
          Post to {community.name}
        </p>
      </div>

      <CreateAnnouncementForm
        communityId={community.id}
        communityName={community.name}
        spaces={spaces.map((s) => ({ id: s.id, name: s.name }))}
        redirectPath={`/communities/${slug}`}
      />
    </div>
  )
}
