"use client"

import dynamic from "next/dynamic"

const TopNav = dynamic(() => import("./top-nav").then((m) => m.TopNav), { ssr: false })
const BottomNav = dynamic(() => import("./bottom-nav").then((m) => m.BottomNav), { ssr: false })

interface NavShellProps {
  user: { id: string; name: string; avatar: string | null; isSuperAdmin: boolean } | null
}

export function NavShell({ user }: NavShellProps) {
  return (
    <>
      <TopNav user={user} />
      <BottomNav user={user} />
    </>
  )
}
