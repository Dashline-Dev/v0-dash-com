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
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Announcements
        </h1>
        <p className="text-muted-foreground mt-1">
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
