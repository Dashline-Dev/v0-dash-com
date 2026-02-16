import { notFound } from "next/navigation"
import { getAnnouncementById } from "@/lib/actions/announcement-actions"
import { AnnouncementDetail } from "@/components/announcements/announcement-detail"

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const announcement = await getAnnouncementById(id)

  if (!announcement) notFound()

  return (
    <div className="px-4 md:px-6 py-6 md:py-8 pb-24 md:pb-6">
      <AnnouncementDetail announcement={announcement} />
    </div>
  )
}
