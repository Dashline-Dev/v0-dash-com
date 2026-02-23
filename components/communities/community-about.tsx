import Link from "next/link"
import { MapPin, Mail, Globe, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { CommunityWithMeta } from "@/types/community"
import type { AreaWithMeta } from "@/types/area"

interface CommunityAboutProps {
  community: CommunityWithMeta
  areas?: AreaWithMeta[]
}

export function CommunityAbout({ community, areas = [] }: CommunityAboutProps) {
  return (
    <div className="space-y-6">
      {/* Description */}
      {community.description && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">About</h3>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {community.description}
          </p>
        </div>
      )}

      {/* Tags */}
      {community.tags.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Tags</h3>
          <div className="flex flex-wrap gap-1.5">
            {community.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs font-normal"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Details */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">Details</h3>
        <div className="space-y-2.5">
          {community.location_name && (
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>{community.location_name}</span>
            </div>
          )}
          {community.contact_email && (
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Mail className="w-4 h-4 shrink-0" />
              <a
                href={`mailto:${community.contact_email}`}
                className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
              >
                {community.contact_email}
              </a>
            </div>
          )}
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <Globe className="w-4 h-4 shrink-0" />
            <span className="capitalize">{community.type} community</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 shrink-0" />
            <span>
              Created{" "}
              {new Date(community.created_at).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Areas */}
      {areas.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Areas</h3>
          <div className="flex flex-wrap gap-2">
            {areas.map((area) => (
              <Link key={area.id} href={`/areas/${area.slug}`}>
                <Badge
                  variant="secondary"
                  className="text-xs font-normal hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer gap-1"
                >
                  <MapPin className="w-3 h-3" />
                  {area.name}
                </Badge>
              </Link>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Events from this community appear in these areas.
          </p>
        </div>
      )}
    </div>
  )
}
