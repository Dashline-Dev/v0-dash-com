"use client"

import { Users, Globe, CalendarDays, Layout, UserPlus, UsersRound } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PlatformStats } from "@/lib/actions/admin-actions"

interface AdminOverviewProps {
  stats: PlatformStats
}

const STAT_CARDS: {
  key: keyof PlatformStats
  label: string
  icon: typeof Users
  color: string
}[] = [
  {
    key: "totalUsers",
    label: "Total Users",
    icon: Users,
    color: "text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300",
  },
  {
    key: "totalCommunities",
    label: "Communities",
    icon: Globe,
    color:
      "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  {
    key: "totalEvents",
    label: "Events",
    icon: CalendarDays,
    color:
      "text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300",
  },
  {
    key: "totalSpaces",
    label: "Spaces",
    icon: Layout,
    color:
      "text-violet-600 bg-violet-100 dark:bg-violet-900/40 dark:text-violet-300",
  },
  {
    key: "totalMembers",
    label: "Active Memberships",
    icon: UsersRound,
    color:
      "text-cyan-600 bg-cyan-100 dark:bg-cyan-900/40 dark:text-cyan-300",
  },
  {
    key: "recentSignups",
    label: "New Users (7d)",
    icon: UserPlus,
    color:
      "text-rose-600 bg-rose-100 dark:bg-rose-900/40 dark:text-rose-300",
  },
]

export function AdminOverview({ stats }: AdminOverviewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {STAT_CARDS.map(({ key, label, icon: Icon, color }) => (
        <Card key={key}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {label}
            </CardTitle>
            <div className={`p-2 rounded-lg ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {stats[key].toLocaleString()}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
