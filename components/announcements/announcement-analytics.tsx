import { Eye, Megaphone, Pin, Clock, FileText, Archive } from "lucide-react"

interface AnnouncementAnalyticsProps {
  stats: {
    total: number
    published: number
    scheduled: number
    drafts: number
    totalViews: number
    pinnedCount: number
  }
}

const STAT_ITEMS = [
  { key: "total" as const, label: "Total", icon: Megaphone },
  { key: "published" as const, label: "Published", icon: FileText },
  { key: "scheduled" as const, label: "Scheduled", icon: Clock },
  { key: "drafts" as const, label: "Drafts", icon: Archive },
  { key: "totalViews" as const, label: "Total Views", icon: Eye },
  { key: "pinnedCount" as const, label: "Pinned", icon: Pin },
]

export function AnnouncementAnalytics({ stats }: AnnouncementAnalyticsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {STAT_ITEMS.map(({ key, label, icon: Icon }) => (
        <div
          key={key}
          className="rounded-xl border border-border bg-card p-4 flex flex-col items-center gap-1.5"
        >
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-xl font-bold text-foreground">{stats[key].toLocaleString()}</span>
          <span className="text-[11px] text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  )
}
