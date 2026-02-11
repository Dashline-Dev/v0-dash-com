import { MapPin, Mail, Globe, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { CommunityWithMeta } from "@/types/community"

export function CommunityAbout({ community }: { community: CommunityWithMeta }) {
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
    </div>
  )
}
