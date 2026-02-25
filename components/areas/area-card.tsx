import Link from "next/link"
import { MapPin, Users, CalendarDays } from "lucide-react"
import type { AreaWithMeta } from "@/types/area"
import { AREA_TYPE_LABELS } from "@/types/area"
import { cn } from "@/lib/utils"

const TYPE_COLOR: Record<string, string> = {
  city: "text-blue-600 dark:text-blue-400",
  neighborhood: "text-emerald-600 dark:text-emerald-400",
}

interface AreaCardProps {
  area: AreaWithMeta
  basePath?: string
}

export function AreaCard({ area, basePath = "/areas" }: AreaCardProps) {
  return (
    <Link
      href={`${basePath}/${area.slug}`}
      className="group flex items-center gap-3 py-2.5 px-3 border-b border-border last:border-b-0 transition-colors hover:bg-accent/50"
    >
      {/* Icon */}
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <MapPin className="w-4 h-4 text-primary" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {area.name}
          </h3>
          <span className={cn("text-[11px] font-medium shrink-0", TYPE_COLOR[area.type] || "text-muted-foreground")}>
            {AREA_TYPE_LABELS[area.type]}
          </span>
          {area.parent_name && (
            <span className="text-[11px] text-muted-foreground truncate hidden sm:inline">
              {area.parent_name}
            </span>
          )}
        </div>
        {area.description && (
          <p className="text-xs text-muted-foreground truncate leading-snug mt-0.5">
            {area.description}
          </p>
        )}
      </div>

      {/* Right meta */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {area.community_count}
        </span>
        <span className="flex items-center gap-1">
          <CalendarDays className="w-3 h-3" />
          {area.event_count}
        </span>
      </div>
    </Link>
  )
}
