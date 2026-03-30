"use client"

import dynamic from "next/dynamic"
import type { EventWithMeta } from "@/types/event"

const EventDetail = dynamic(
  () => import("./event-detail").then((m) => m.EventDetail),
  { ssr: false }
)

const EventPublicView = dynamic(
  () => import("./event-public-view").then((m) => m.EventPublicView),
  { ssr: false }
)

interface EventDetailWrapperProps {
  event: EventWithMeta
  communities?: Array<{ id: string; name: string; slug: string }>
  sharedCommunityIds?: string[]
  canEdit?: boolean
  rsvps?: Array<{ user_id: string; status: string }>
  variant?: "authenticated" | "public" | "community"
}

export function EventDetailWrapper({
  event,
  communities,
  sharedCommunityIds,
  canEdit,
  rsvps,
  variant = "authenticated",
}: EventDetailWrapperProps) {
  if (variant === "public") {
    return <EventPublicView event={event} />
  }

  return (
    <EventDetail
      event={event}
      communities={communities ?? []}
      sharedCommunityIds={sharedCommunityIds ?? []}
      canEdit={canEdit ?? false}
      rsvps={rsvps}
    />
  )
}
