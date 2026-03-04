import Link from "next/link"
import { Users } from "lucide-react"
import { SpaceIcon } from "./space-icon"
import type { SpaceWithMeta } from "@/types/space"
import { SPACE_TYPE_LABELS } from "@/types/space"
import { cn } from "@/lib/utils"

const TYPE_COLORS: Record<string, string> = {
  discussion: "text-blue-600 dark:text-blue-400",
  event: "text-amber-600 dark:text-amber-400",
  project: "text-green-600 dark:text-green-400",
  resource: "text-teal-600 dark:text-teal-400",
}

export function SpaceCard({ space }: { space: SpaceWithMeta }) {
  const typeColor = TYPE_COLORS[space.type] || TYPE_COLORS.discussion

  const href = space.community_slug
    ? `/communities/${space.community_slug}/spaces/${space.slug}`
    : `/spaces/${space.slug}`

  return (
    <Link
      href={href}
      className="group flex items-center gap-3 py-2.5 px-3 border-b border-border last:border-b-0 transition-colors hover:bg-accent/50"
    >
      {/* Icon */}
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <SpaceIcon name={space.icon} className="w-4 h-4 text-primary" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {space.name}
          </h3>
          <span className={cn("text-[11px] font-medium shrink-0", typeColor)}>
            {SPACE_TYPE_LABELS[space.type]}
          </span>
          {space.community_name && (
            <span className="text-[11px] text-muted-foreground truncate hidden sm:inline">
              in {space.community_name}
            </span>
          )}
        </div>
        {space.description && (
          <p className="text-xs text-muted-foreground truncate leading-snug mt-0.5">
            {space.description}
          </p>
        )}
      </div>

      {/* Right meta */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {space.member_count}
        </span>
      </div>
    </Link>
  )
}
