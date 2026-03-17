"use client"

import dynamic from "next/dynamic"
import type { ComponentProps } from "react"
import type { TopNav } from "./top-nav"

const TopNavDynamic = dynamic(
  () => import("./top-nav").then((m) => m.TopNav),
  { ssr: false }
)

export function TopNavClient(props: ComponentProps<typeof TopNav>) {
  return <TopNavDynamic {...props} />
}
