import { getAuthenticatedUser } from "@/lib/mock-user"
import { AuthRequiredModal } from "@/components/auth/auth-required-modal"
import { getAnnouncements } from "@/lib/actions/announcement-actions"
import { AnnouncementList } from "@/components/announcements/announcement-list"

export const metadata = {
  title: "Announcements | Dash",
  description: "Browse announcements from your communities",
}

export default async function AnnouncementsPage() {
  const user = await getAuthenticatedUser()
  if (!user) return <AuthRequiredModal />

  const result = await getAnnouncements({ limit: 20 })

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-5 md:py-6 pb-24 md:pb-8">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground">Announcements</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Latest updates from your communities
        </p>
      </div>

      <AnnouncementList
        initialAnnouncements={result.announcements}
        initialCursor={result.cursor}
        initialHasMore={result.hasMore}
      />
    </div>
  )
}
