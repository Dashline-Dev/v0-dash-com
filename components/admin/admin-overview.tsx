"use client"

import {
  Users,
  Globe,
  CalendarDays,
  Layers,
  MapPin,
  UserPlus,
  UsersRound,
  TrendingUp,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { PlatformStats } from "@/lib/actions/admin-actions"

interface AdminOverviewProps {
  stats: PlatformStats
}

const STAT_CARDS: {
  key: keyof PlatformStats
  label: string
  icon: typeof Users
  color: string
  bgColor: string
}[] = [
  {
    key: "totalUsers",
    label: "Total Users",
    icon: Users,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    key: "totalCommunities",
    label: "Communities",
    icon: Globe,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  {
    key: "totalEvents",
    label: "Events",
    icon: CalendarDays,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
  {
    key: "totalSpaces",
    label: "Spaces",
    icon: Layers,
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
  },
  {
    key: "totalAreas",
    label: "Areas",
    icon: MapPin,
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-100 dark:bg-rose-900/30",
  },
  {
    key: "totalMembers",
    label: "Active Memberships",
    icon: UsersRound,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
  },
]

export function AdminOverview({ stats }: AdminOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {STAT_CARDS.map(({ key, label, icon: Icon, color, bgColor }) => (
          <Card key={key} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {label}
                  </p>
                  <p className="text-2xl font-bold text-foreground tabular-nums">
                    {stats[key].toLocaleString()}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${bgColor}`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Highlighted Stat */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <UserPlus className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">New Users (7 days)</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-foreground">
                  {stats.recentSignups.toLocaleString()}
                </p>
                {stats.totalUsers > 0 && (
                  <span className="flex items-center gap-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="w-3 h-3" />
                    {((stats.recentSignups / stats.totalUsers) * 100).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Avg Members per Community
            </p>
            <p className="text-xl font-bold text-foreground">
              {stats.totalCommunities > 0
                ? (stats.totalMembers / stats.totalCommunities).toFixed(1)
                : "0"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Events per Community
            </p>
            <p className="text-xl font-bold text-foreground">
              {stats.totalCommunities > 0
                ? (stats.totalEvents / stats.totalCommunities).toFixed(1)
                : "0"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
