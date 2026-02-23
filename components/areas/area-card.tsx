import Link from "next/link"
import { MapPin, Users, CalendarDays, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { AreaWithMeta } from "@/types/area"
import { AREA_TYPE_LABELS } from "@/types/area"
import { cn } from "@/lib/utils"

const TYPE_COLOR: Record<string, string> = {
  city: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  neighborhood: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
}

interface AreaCardProps {
  area: AreaWithMeta
  basePath?: string
}

export function AreaCard({ area, basePath = "/areas" }: AreaCardProps) {
  return (
    <Link
      href={`${basePath}/${area.slug}`}
      className="group block rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-md hover:border-primary/20"
    >
      {/* Cover / gradient */}
      <div className="relative aspect-[16/7] bg-secondary overflow-hidden">
        {area.cover_image_url ? (
          <img
            src={area.cover_image_url}
            alt=""
            className="w-full h-full object-cover transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/15 via-primary/5 to-accent/15 flex items-center justify-center">
            <MapPin className="w-10 h-10 text-primary/20" />
          </div>
        )}
        <Badge
          variant="secondary"
          className={cn("absolute top-3 right-3 text-[10px] font-medium", TYPE_COLOR[area.type])}
        >
          {AREA_TYPE_LABELS[area.type]}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {area.name}
          </h3>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
        </div>

        {area.parent_name && (
          <p className="text-xs text-muted-foreground mt-0.5">{area.parent_name}</p>
        )}

        {area.description && (
          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {area.description}
          </p>
        )}

        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {area.community_count} {area.community_count === 1 ? "community" : "communities"}
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5" />
            {area.event_count} {area.event_count === 1 ? "event" : "events"}
          </span>
          {area.neighborhood_count > 0 && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {area.neighborhood_count} areas
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
