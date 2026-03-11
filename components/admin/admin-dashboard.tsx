"use client"

import { useState } from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  Users,
  Globe,
  CalendarDays,
  Layers,
  MapPin,
  ScrollText,
  Plus,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AdminOverview } from "./admin-overview"
import { AdminUsers } from "./admin-users"
import { AdminCommunities } from "./admin-communities"
import { AdminAreas } from "./admin-areas"
import { AdminEvents } from "./admin-events"
import { AdminSpaces } from "./admin-spaces"
import { AdminAuditLog } from "./admin-audit-log"
import type {
  PlatformStats,
  AdminUser,
  AdminCommunity,
  AdminArea,
  AdminEvent,
  AdminSpace,
} from "@/lib/actions/admin-actions"

type Section =
  | "overview"
  | "users"
  | "communities"
  | "areas"
  | "events"
  | "spaces"
  | "audit"

interface NavItem {
  id: Section
  label: string
  icon: typeof LayoutDashboard
  count?: number
}

interface AdminDashboardProps {
  stats: PlatformStats
  initialUsers: AdminUser[]
  initialUsersTotal: number
  initialCommunities: AdminCommunity[]
  initialCommunitiesTotal: number
  initialAreas: AdminArea[]
  initialAreasTotal: number
  initialEvents: AdminEvent[]
  initialEventsTotal: number
  initialSpaces: AdminSpace[]
  initialSpacesTotal: number
  initialAuditEntries: {
    id: string
    actor_id: string
    actor_name: string | null
    target_user_id: string | null
    target_name: string | null
    community_id: string | null
    community_name: string | null
    action: string
    details: Record<string, unknown>
    created_at: string
  }[]
  initialAuditTotal: number
}

export function AdminDashboard({
  stats,
  initialUsers,
  initialUsersTotal,
  initialCommunities,
  initialCommunitiesTotal,
  initialAreas,
  initialAreasTotal,
  initialEvents,
  initialEventsTotal,
  initialSpaces,
  initialSpacesTotal,
  initialAuditEntries,
  initialAuditTotal,
}: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState<Section>("overview")

  const navItems: NavItem[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "users", label: "Users", icon: Users, count: stats.totalUsers },
    {
      id: "communities",
      label: "Communities",
      icon: Globe,
      count: stats.totalCommunities,
    },
    { id: "areas", label: "Areas", icon: MapPin, count: stats.totalAreas },
    {
      id: "events",
      label: "Events",
      icon: CalendarDays,
      count: stats.totalEvents,
    },
    { id: "spaces", label: "Spaces", icon: Layers, count: stats.totalSpaces },
    { id: "audit", label: "Audit Log", icon: ScrollText },
  ]

  return (
    <div className="flex gap-6">
      {/* Sidebar Navigation */}
      <aside className="w-56 shrink-0 hidden md:block">
        <nav className="sticky top-24 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.count !== undefined && (
                  <span
                    className={cn(
                      "text-xs tabular-nums",
                      isActive
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}
                  >
                    {item.count.toLocaleString()}
                  </span>
                )}
              </button>
            )
          })}

          <div className="pt-4 border-t border-border mt-4">
            <p className="px-3 text-xs font-medium text-muted-foreground mb-2">
              Quick Actions
            </p>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground"
            >
              <Link href="/areas/create">
                <Plus className="w-4 h-4" />
                Create Area
                <ChevronRight className="w-3 h-3 ml-auto" />
              </Link>
            </Button>
          </div>
        </nav>
      </aside>

      {/* Mobile Navigation */}
      <div className="md:hidden mb-4 w-full overflow-x-auto">
        <div className="flex gap-1 pb-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {activeSection === "overview" && <AdminOverview stats={stats} />}

        {activeSection === "users" && (
          <AdminUsers
            initialUsers={initialUsers}
            initialTotal={initialUsersTotal}
          />
        )}

        {activeSection === "communities" && (
          <AdminCommunities
            initialCommunities={initialCommunities}
            initialTotal={initialCommunitiesTotal}
          />
        )}

        {activeSection === "areas" && (
          <AdminAreas
            initialAreas={initialAreas}
            initialTotal={initialAreasTotal}
          />
        )}

        {activeSection === "events" && (
          <AdminEvents
            initialEvents={initialEvents}
            initialTotal={initialEventsTotal}
          />
        )}

        {activeSection === "spaces" && (
          <AdminSpaces
            initialSpaces={initialSpaces}
            initialTotal={initialSpacesTotal}
          />
        )}

        {activeSection === "audit" && (
          <AdminAuditLog
            initialEntries={initialAuditEntries}
            initialTotal={initialAuditTotal}
          />
        )}
      </main>
    </div>
  )
}
