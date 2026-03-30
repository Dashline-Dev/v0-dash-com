"use client"

import dynamic from "next/dynamic"
import type { TopEvent, TopCommunity } from "@/lib/actions/landing-actions"

const GuestLanding = dynamic(
  () => import("@/components/home/guest-landing").then((m) => m.GuestLanding),
  { ssr: false }
)

interface GuestLandingWrapperProps {
  topEvents: TopEvent[]
  topCommunities: TopCommunity[]
  totalEvents: number
  totalCommunities: number
}

export function GuestLandingWrapper(props: GuestLandingWrapperProps) {
  return <GuestLanding {...props} />
}
