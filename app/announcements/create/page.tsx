import { redirect } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/mock-user"
import { AnnouncementCreatePicker } from "@/components/announcements/announcement-create-picker"

export const metadata = {
  title: "Create Announcement | Dash",
  description: "Create a new announcement for your community",
}

export default async function CreateAnnouncementPage() {
  const user = await getAuthenticatedUser()
  if (!user) redirect("/signin")
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8 pb-24 md:pb-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          New Announcement
        </h1>
        <p className="text-muted-foreground mt-1">
          Select a community, then compose your announcement
        </p>
      </div>

      <AnnouncementCreatePicker />
    </div>
  )
}
