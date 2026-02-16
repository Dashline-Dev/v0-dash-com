"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CommandPalette } from "./command-palette"
import { UserMenu } from "./user-menu"

const NAV_LINKS: { href: string; label: string }[] = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/communities", label: "Communities" },
  { href: "/events", label: "Events" },
  { href: "/areas", label: "Areas" },
]

interface TopNavProps {
  user: { id: string; name: string; avatar: string | null } | null
}

export function TopNav({ user }: TopNavProps) {
  const pathname = usePathname()

  return (
    <header className="hidden md:block sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="flex items-center justify-between h-16 px-6 lg:px-10">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            CC
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Community Circle
          </span>
        </Link>

        {/* Center nav */}
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href)

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <CommandPalette />
          {user && (
            <Button asChild variant="default" size="sm" className="gap-1.5">
              <Link href="/communities/create">
                <Plus className="w-4 h-4" />
                <span>Create</span>
              </Link>
            </Button>
          )}
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  )
}
