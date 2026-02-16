"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Plus, CalendarDays, User, Search, LogIn } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomNavProps {
  user: { id: string; name: string; avatar: string | null } | null
}

export function BottomNav({ user }: BottomNavProps) {
  const pathname = usePathname()
  const isAuthenticated = !!user

  const NAV_ITEMS = [
    { href: "/", label: "Home", icon: Home },
    { href: "/explore", label: "Explore", icon: Search },
    ...(isAuthenticated
      ? [{ href: "/communities/create", label: "Create", icon: Plus, isAction: true }]
      : []),
    { href: "/events", label: "Events", icon: CalendarDays },
    isAuthenticated
      ? { href: "/profile", label: "Profile", icon: User }
      : { href: "/signin", label: "Sign in", icon: LogIn },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-14">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href)
          const Icon = item.icon
          const isAction = "isAction" in item && item.isAction

          if (isAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-center -mt-4"
                aria-label={item.label}
              >
                <span className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg">
                  <Icon className="w-6 h-6" />
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[48px] px-2 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-none">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
