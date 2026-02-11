import Link from "next/link"
import { MapPin, Users, BadgeCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { CommunityListItem } from "@/types/community"
import { cn } from "@/lib/utils"

const CATEGORY_COLORS: Record<string, string> = {
  technology: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  sports: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  arts: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  neighborhood: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  wellness: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  education: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  music: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300",
  food: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  gaming: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  business: "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
  social: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  general: "bg-secondary text-secondary-foreground",
}

export function CommunityCard({ community }: { community: CommunityListItem }) {
  const categoryColor = CATEGORY_COLORS[community.category] || CATEGORY_COLORS.general

  return (
    <Link
      href={`/communities/${community.slug}`}
      className="group block rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-md hover:border-primary/20"
    >
      {/* Cover image */}
      <div className="relative aspect-[16/7] bg-secondary overflow-hidden">
        {community.cover_image_url ? (
          <img
            src={community.cover_image_url}
            alt=""
            className="w-full h-full object-cover transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20" />
        )}
        {/* Avatar overlay */}
        <div className="absolute -bottom-5 left-4">
          <div className="w-10 h-10 rounded-lg border-2 border-card bg-card overflow-hidden shadow-sm">
            {community.avatar_url ? (
              <img
                src={community.avatar_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                {community.name.charAt(0)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pt-7">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {community.name}
            </h3>
            {community.is_verified && (
              <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
            )}
          </div>
          <Badge variant="secondary" className={cn("text-[10px] shrink-0 font-medium", categoryColor)}>
            {community.category}
          </Badge>
        </div>

        {community.description && (
          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {community.description}
          </p>
        )}

        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {community.member_count.toLocaleString()} members
          </span>
          {community.location_name && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{community.location_name}</span>
            </span>
          )}
        </div>

        {community.tags.length > 0 && (
          <div className="flex items-center gap-1 mt-2.5 overflow-hidden">
            {community.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 bg-secondary text-muted-foreground rounded text-[10px] truncate"
              >
                {tag}
              </span>
            ))}
            {community.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{community.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
