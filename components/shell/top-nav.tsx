"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import dynamic from "next/dynamic"
import { Plus, Users, CalendarPlus, Layers, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
const UserMenu = dynamic(() => import("./user-menu").then((m) => m.UserMenu), { ssr: false })
import { GuestNavLink } from "@/components/auth/guest-nav-link"

const CommandPalette = dynamic(
  () => import("./command-palette").then((m) => m.CommandPalette),
  { ssr: false }
)

// Client-only to avoid Radix ID hydration mismatches
function CreateMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          <span>Create</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href="/events/create" className="flex items-center gap-2 cursor-pointer">
            <CalendarPlus className="w-4 h-4" />
            <span>Event</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/communities/create" className="flex items-center gap-2 cursor-pointer">
            <Users className="w-4 h-4" />
            <span>Community</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/spaces/create" className="flex items-center gap-2 cursor-pointer">
            <Layers className="w-4 h-4" />
            <span>Space</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/areas/create" className="flex items-center gap-2 cursor-pointer">
            <MapPin className="w-4 h-4" />
            <span>Area</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const CreateMenuDynamic = dynamic(() => Promise.resolve(CreateMenu), { ssr: false })

// Routes that require authentication
const PROTECTED_HREFS = new Set(["/explore", "/communities", "/events", "/areas"])

const NAV_LINKS: { href: string; label: string }[] = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/communities", label: "Communities" },
  { href: "/events", label: "Events" },
  { href: "/areas", label: "Areas" },
]

interface TopNavProps {
  user: { id: string; name: string; avatar: string | null; isSuperAdmin: boolean } | null
}

export function TopNav({ user }: TopNavProps) {
  const pathname = usePathname()
  const isGuest = !user

  return (
    <header suppressHydrationWarning className="hidden md:block sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
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

            const linkClass = cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )

            if (isGuest && PROTECTED_HREFS.has(link.href)) {
              return (
                <GuestNavLink
                  key={link.href}
                  href={link.href}
                  isGuest
                  className={linkClass}
                >
                  {link.label}
                </GuestNavLink>
              )
            }

            return (
              <Link key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <CommandPalette />
          {user && <CreateMenuDynamic />}
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  )
}
