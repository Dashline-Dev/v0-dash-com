"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plus, Bell, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const NAV_LINKS: { href: string; label: string }[] = [
  { href: "/", label: "Home" },
  { href: "/announcements", label: "Announcements" },
  { href: "/events", label: "Events" },
  { href: "/areas", label: "Areas" },
  { href: "/spaces", label: "Spaces" },
]

export function TopNav() {
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
          <Button asChild variant="default" size="sm" className="gap-1.5">
            <Link href="/communities/create">
              <Plus className="w-4 h-4" />
              <span>Create</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground" asChild>
            <Link href="/notifications" aria-label="Notifications">
              <Bell className="w-5 h-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground" asChild>
            <Link href="/profile" aria-label="Profile">
              <User className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
