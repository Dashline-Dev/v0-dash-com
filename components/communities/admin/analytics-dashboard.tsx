import { Users, UserPlus, Clock, ShieldAlert } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MEMBER_ROLE_LABELS } from "@/types/community"

interface AnalyticsData {
  stats: {
    active_members: number
    pending_members: number
    banned_members: number
    new_this_month: number
    new_this_week: number
  }
  roleBreakdown: { role: string; count: number }[]
}

export function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  const { stats, roleBreakdown } = data

  const statCards = [
    {
      label: "Active Members",
      value: Number(stats.active_members),
      icon: Users,
      color: "text-primary",
    },
    {
      label: "New This Month",
      value: Number(stats.new_this_month),
      icon: UserPlus,
      color: "text-green-600 dark:text-green-400",
    },
    {
      label: "New This Week",
      value: Number(stats.new_this_week),
      icon: Clock,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Pending",
      value: Number(stats.pending_members),
      icon: ShieldAlert,
      color: "text-amber-600 dark:text-amber-400",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold text-foreground">
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Role breakdown */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Role Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {roleBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data available.</p>
          ) : (
            <div className="space-y-3">
              {roleBreakdown.map((item) => {
                const total = roleBreakdown.reduce(
                  (sum, r) => sum + Number(r.count),
                  0
                )
                const percentage = total > 0 ? (Number(item.count) / total) * 100 : 0

                return (
                  <div key={item.role} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {MEMBER_ROLE_LABELS[item.role as keyof typeof MEMBER_ROLE_LABELS] || item.role}
                        </Badge>
                      </span>
                      <span className="text-muted-foreground font-medium">
                        {item.count}
                      </span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
