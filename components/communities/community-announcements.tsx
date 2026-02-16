"use client"

import Link from "next/link"
import { Plus, Megaphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AnnouncementCard } from "@/components/announcements/announcement-card"
import type { AnnouncementWithMeta } from "@/types/announcement"

interface CommunityAnnouncementsProps {
  communitySlug: string
  announcements: AnnouncementWithMeta[]
}

export function CommunityAnnouncements({ communitySlug, announcements }: CommunityAnnouncementsProps) {
  if (announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Megaphone className="w-10 h-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-foreground">No announcements yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Community announcements will appear here
        </p>
        <Button asChild variant="outline" size="sm" className="mt-4 gap-1.5">
          <Link href={`/communities/${communitySlug}/announcements/create`}>
            <Plus className="w-4 h-4" />
            Create Announcement
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {announcements.length} announcement{announcements.length !== 1 ? "s" : ""}
        </p>
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href={`/communities/${communitySlug}/announcements/create`}>
            <Plus className="w-4 h-4" />
            New
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {announcements.map((a) => (
          <AnnouncementCard key={a.id} announcement={a} />
        ))}
      </div>
    </div>
  )
}
