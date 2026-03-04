import Link from "next/link"
import { MapPin, Users, BadgeCheck } from "lucide-react"
import type { CommunityListItem } from "@/types/community"
import { cn } from "@/lib/utils"

const CATEGORY_COLORS: Record<string, string> = {
  technology: "text-blue-600 dark:text-blue-400",
  sports: "text-green-600 dark:text-green-400",
  arts: "text-pink-600 dark:text-pink-400",
  neighborhood: "text-amber-600 dark:text-amber-400",
  wellness: "text-teal-600 dark:text-teal-400",
  education: "text-indigo-600 dark:text-indigo-400",
  music: "text-fuchsia-600 dark:text-fuchsia-400",
  food: "text-orange-600 dark:text-orange-400",
  gaming: "text-cyan-600 dark:text-cyan-400",
  business: "text-slate-600 dark:text-slate-400",
  social: "text-rose-600 dark:text-rose-400",
  general: "text-muted-foreground",
}

export function CommunityCard({ community }: { community: CommunityListItem }) {
  const categoryColor = CATEGORY_COLORS[community.category] || CATEGORY_COLORS.general

  return (
    <Link
      href={`/communities/${community.slug}`}
      className="group flex items-center gap-3 py-2.5 px-3 border-b border-border last:border-b-0 transition-colors hover:bg-accent/50"
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-primary/10 overflow-hidden shrink-0">
        {community.avatar_url ? (
          <img src={community.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-primary text-xs font-bold">
            {community.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {community.name}
          </h3>
          {community.is_verified && (
            <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />
          )}
          <span className={cn("text-[11px] font-medium shrink-0", categoryColor)}>
            {community.category}
          </span>
        </div>
        {community.description && (
          <p className="text-xs text-muted-foreground truncate leading-snug mt-0.5">
            {community.description}
          </p>
        )}
      </div>

      {/* Right meta */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {community.member_count.toLocaleString()}
        </span>
        {community.location_name && (
          <span className="hidden sm:flex items-center gap-1 max-w-[120px]">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{community.location_name}</span>
          </span>
        )}
      </div>
    </Link>
  )
}
