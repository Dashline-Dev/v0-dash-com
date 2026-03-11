"use client"

import { SpaceIcon } from "../space-icon"
import {
  SPACE_TYPE_LABELS,
  SPACE_VISIBILITY_LABELS,
  SPACE_JOIN_POLICY_LABELS,
  type CreateSpaceInput,
} from "@/types/space"

interface StepReviewProps {
  data: CreateSpaceInput
  communityName?: string
}

export function StepReview({ data, communityName }: StepReviewProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-foreground">Review your space</h3>
        <p className="text-sm text-muted-foreground">
          Make sure everything looks good before creating
        </p>
      </div>

      {/* Preview Card */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Cover image area */}
        {data.cover_image_url ? (
          <div
            className="h-24 bg-cover bg-center"
            style={{ backgroundImage: `url(${data.cover_image_url})` }}
          />
        ) : (
          <div className="h-24 bg-gradient-to-br from-muted to-muted/50" />
        )}

        <div className="p-4 relative">
          {/* Icon */}
          <div className="absolute -top-6 left-4 w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center shadow-sm">
            <SpaceIcon name={data.icon || "Layers"} className="w-6 h-6 text-primary" />
          </div>

          <div className="pt-6 space-y-3">
            <div>
              <h4 className="font-semibold text-lg text-foreground">{data.name || "Untitled Space"}</h4>
              {communityName && (
                <p className="text-sm text-muted-foreground">in {communityName}</p>
              )}
            </div>

            {data.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {data.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="rounded-lg border border-border p-3">
          <span className="text-muted-foreground">Type</span>
          <p className="font-medium text-foreground">{SPACE_TYPE_LABELS[data.type]}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <span className="text-muted-foreground">Visibility</span>
          <p className="font-medium text-foreground">{SPACE_VISIBILITY_LABELS[data.visibility]}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <span className="text-muted-foreground">Join Policy</span>
          <p className="font-medium text-foreground">{SPACE_JOIN_POLICY_LABELS[data.join_policy]}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <span className="text-muted-foreground">URL Slug</span>
          <p className="font-medium text-foreground truncate">{data.slug || "..."}</p>
        </div>
      </div>
    </div>
  )
}
