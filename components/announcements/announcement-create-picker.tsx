"use client"

import { useState, useEffect, useTransition } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreateAnnouncementForm } from "./create-announcement-form"
import { getMyCommunities } from "@/lib/actions/community-actions"
import { getSpacesByCommunity } from "@/lib/actions/space-actions"
import type { CommunityWithMeta } from "@/types/community"

export function AnnouncementCreatePicker() {
  const [communities, setCommunities] = useState<CommunityWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityWithMeta | null>(null)
  const [spaces, setSpaces] = useState<{ id: string; name: string }[]>([])
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    getMyCommunities().then((c) => {
      setCommunities(c)
      setLoading(false)
    })
  }, [])

  function handleSelectCommunity(community: CommunityWithMeta) {
    setSelectedCommunity(community)
    startTransition(async () => {
      const s = await getSpacesByCommunity(community.slug)
      setSpaces(s.map((sp) => ({ id: sp.id, name: sp.name })))
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!selectedCommunity) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground mb-4">Select a community:</p>
        {communities.map((c) => (
          <Button
            key={c.id}
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-3"
            onClick={() => handleSelectCommunity(c)}
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
              {c.name.charAt(0)}
            </div>
            <div className="text-left">
              <div className="text-sm font-medium">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.member_count} members</div>
            </div>
          </Button>
        ))}
        {communities.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            You need to be a member of a community to create announcements.
          </p>
        )}
      </div>
    )
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <CreateAnnouncementForm
      communityId={selectedCommunity.id}
      communityName={selectedCommunity.name}
      spaces={spaces}
    />
  )
}
