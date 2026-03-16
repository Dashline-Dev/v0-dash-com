"use client"

import { CreateEventWizard } from "./create/create-wizard"
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
  // Resolve the pre-selected community's metadata so the wizard can default
  // visibility, timezone, and lock the community picker
  const preselectedCommunity = preselectedCommunityId
    ? communities.find((c) => c.id === preselectedCommunityId)
    : undefined

  // Slim list for the wizard's Settings step community selector
  const wizardCommunities = communities.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
  }))

  return (
    <CreateEventWizard
      communities={wizardCommunities}
      preSelectedCommunityId={preselectedCommunityId}
      preSelectedCommunityName={preselectedCommunity?.name}
      preSelectedCommunityVisibility={preselectedCommunity?.visibility}
      preSelectedCommunityTimezone={preselectedCommunity?.timezone}
      preSelectedSpaceId={preselectedSpaceId}
    />
  )
}
