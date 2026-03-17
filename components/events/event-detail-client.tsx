"use client"

import dynamic from "next/dynamic"
import type { ComponentProps } from "react"
import type { EventDetail } from "./event-detail"

const EventDetailDynamic = dynamic(
  () => import("./event-detail").then((m) => m.EventDetail),
  { ssr: false }
)

export function EventDetailClient(props: ComponentProps<typeof EventDetail>) {
  return <EventDetailDynamic {...props} />
}
