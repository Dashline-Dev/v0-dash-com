"use client"

import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { CreateEventForm } from "./create-event-form"
import type { CommunityWithMeta } from "@/types/community"

interface EventCreatePickerProps {
  communities: CommunityWithMeta[]
  preselectedCommunityId?: string
  preselectedCommunitySlug?: string
  preselectedSpaceId?: string
}

export function EventCreatePicker({
  communities,
  preselectedCommunityId,
  preselectedCommunitySlug,
  preselectedSpaceId,
}: EventCreatePickerProps) {
  const [selectedId, setSelectedId] = useState(preselectedCommunityId ?? "")

  const selectedCommunity = communities.find((c) => c.id === selectedId)
  const slug = preselectedCommunitySlug ?? selectedCommunity?.slug ?? ""

  if (preselectedCommunityId && slug) {
    return (
      <CreateEventForm
        communityId={preselectedCommunityId}
        communitySlug={slug}
        spaceId={preselectedSpaceId}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="community-select">Community</Label>
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger id="community-select">
            <SelectValue placeholder="Select a community" />
          </SelectTrigger>
          <SelectContent>
            {communities.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCommunity && (
        <CreateEventForm
          communityId={selectedCommunity.id}
          communitySlug={selectedCommunity.slug}
        />
      )}
    </div>
  )
}
