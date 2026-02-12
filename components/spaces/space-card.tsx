import Link from "next/link"
import { Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { SpaceIcon } from "./space-icon"
import type { SpaceWithMeta } from "@/types/space"
import { SPACE_TYPE_LABELS } from "@/types/space"
import { cn } from "@/lib/utils"

const TYPE_COLORS: Record<string, string> = {
  discussion: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  event: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  project: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  resource: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
}

export function SpaceCard({ space }: { space: SpaceWithMeta }) {
  const typeColor = TYPE_COLORS[space.type] || TYPE_COLORS.discussion

  const href = space.community_slug
    ? `/communities/${space.community_slug}/spaces/${space.slug}`
    : `/spaces/${space.slug}`

  return (
    <Link
      href={href}
      className="group flex items-start gap-3 p-4 rounded-xl border border-border bg-card transition-all hover:shadow-md hover:border-primary/20"
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
        <SpaceIcon name={space.icon} className="w-5 h-5 text-primary" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {space.name}
          </h3>
          <Badge variant="secondary" className={cn("text-[10px] shrink-0 font-medium", typeColor)}>
            {SPACE_TYPE_LABELS[space.type]}
          </Badge>
        </div>

        {space.description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {space.description}
          </p>
        )}

        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {space.member_count} members
          </span>
          {space.community_name && (
            <span className="truncate">
              in {space.community_name}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
