"use client"

import { Badge } from "@/components/ui/badge"
import { COMMUNITY_CATEGORIES } from "@/types/community"
import type { CreateCommunityInput } from "@/types/community"

interface StepReviewProps {
  data: CreateCommunityInput
}

export function StepReview({ data }: StepReviewProps) {
  const categoryLabel =
    COMMUNITY_CATEGORIES.find((c) => c.value === data.category)?.label ||
    data.category

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Review the details below before creating your community.
      </p>

      {/* Preview header */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="aspect-[16/5] bg-secondary overflow-hidden">
          {data.cover_image_url ? (
            <img
              src={data.cover_image_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20" />
          )}
        </div>
        <div className="p-4 flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg border border-border bg-card overflow-hidden shrink-0 -mt-8">
            {data.avatar_url ? (
              <img
                src={data.avatar_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-lg font-bold">
                {data.name ? data.name.charAt(0) : "?"}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground">
              {data.name || "Untitled Community"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              /communities/{data.slug || "..."}
            </p>
          </div>
        </div>
      </div>

      {/* Details table */}
      <div className="space-y-3 text-sm">
        <DetailRow label="Category" value={categoryLabel} />
        <DetailRow label="Visibility" value={data.visibility} />
        <DetailRow label="Join Policy" value={data.join_policy.replace("_", " ")} />
        <DetailRow label="Posting Policy" value={data.posting_policy.replace("_", " ")} />
        {data.location_name && (
          <DetailRow label="Location" value={data.location_name} />
        )}
        {data.contact_email && (
          <DetailRow label="Contact" value={data.contact_email} />
        )}
        <DetailRow label="Timezone" value={data.timezone || "UTC"} />
      </div>

      {/* Description */}
      {data.description && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Description
          </p>
          <p className="text-sm text-foreground leading-relaxed">
            {data.description}
          </p>
        </div>
      )}

      {/* Tags */}
      {data.tags && data.tags.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
            Tags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {data.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Rules */}
      {data.rules && data.rules.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
            Rules ({data.rules.length})
          </p>
          <ol className="space-y-1.5">
            {data.rules.map((rule, i) => (
              <li key={i} className="text-sm text-foreground">
                <span className="font-medium">{i + 1}. {rule.title}</span>
                {rule.description && (
                  <span className="text-muted-foreground">
                    {" "}&mdash; {rule.description}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground capitalize">{value}</span>
    </div>
  )
}
