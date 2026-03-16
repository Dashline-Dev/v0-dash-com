import Link from "next/link"
import { MapPin, Mail, Globe, Clock, Users, Lock, CalendarDays, LayoutGrid } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { CommunityWithMeta } from "@/types/community"
import type { AreaWithMeta } from "@/types/area"

interface CommunityAboutProps {
  community: CommunityWithMeta
  areas?: AreaWithMeta[]
}

export function CommunityAbout({ community, areas = [] }: CommunityAboutProps) {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Description */}
      {community.description && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            About
          </h3>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
            {community.description}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground leading-none">
              {community.member_count.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Members</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Clock className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">
              {new Date(community.created_at).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Founded</p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Details
        </h3>
        <div className="space-y-3">
          {community.location_name && (
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground">{community.location_name}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            {community.type === "private" ? (
              <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
            ) : (
              <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
            <span className="text-sm text-foreground capitalize">
              {community.type} community
              {community.join_policy === "approval" && (
                <span className="text-muted-foreground ml-1">· Requires approval</span>
              )}
            </span>
          </div>
          {community.contact_email && (
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
              <a
                href={`mailto:${community.contact_email}`}
                className="text-sm text-primary hover:underline underline-offset-4"
              >
                {community.contact_email}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      {community.tags.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Topics
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {community.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Areas */}
      {areas.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Areas
          </h3>
          <div className="flex flex-wrap gap-2">
            {areas.map((area) => (
              <Link key={area.id} href={`/areas/${area.slug}`}>
                <Badge
                  variant="outline"
                  className="text-xs font-normal hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors cursor-pointer gap-1.5"
                >
                  <MapPin className="w-3 h-3" />
                  {area.name}
                </Badge>
              </Link>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Events from this community appear in these areas.
          </p>
        </div>
      )}
    </div>
  )
}
