"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Globe, Lock, Link2, Loader2, LayoutGrid, Info, Building2 } from "lucide-react"
import type { EventFormData } from "./create-wizard"
import type { EventVisibility } from "@/types/event"
import { getSpacesByCommunity } from "@/lib/actions/space-actions"

interface StepSettingsProps {
  formData: EventFormData
  updateFormData: (updates: Partial<EventFormData>) => void
  communities?: { id: string; name: string; slug: string }[]
  preSelectedCommunityId?: string
  preSelectedCommunityName?: string
  preSelectedCommunityVisibility?: "public" | "unlisted" | "private"
  preSelectedSpaceId?: string
}

const VISIBILITY_OPTIONS: {
  value: EventVisibility
  label: string
  description: string
  icon: typeof Globe
}[] = [
  {
    value: "public",
    label: "Public",
    description: "Anyone can discover and view this event",
    icon: Globe,
  },
  {
    value: "unlisted",
    label: "Unlisted",
    description: "Only people with the link can view this event",
    icon: Link2,
  },
  {
    value: "private",
    label: "Private",
    description: "Only invited guests can view this event",
    icon: Lock,
  },
]

export function StepSettings({
  formData,
  updateFormData,
  communities = [],
  preSelectedCommunityId,
  preSelectedCommunityName,
  preSelectedCommunityVisibility,
  preSelectedSpaceId,
}: StepSettingsProps) {
  const [spaces, setSpaces] = useState<{ id: string; name: string; slug: string }[]>([])
  const [loadingSpaces, setLoadingSpaces] = useState(false)

  // When created from a community/space context the community is locked
  const isCommunityLocked = !!preSelectedCommunityId

  // Derive visibility hint text from the community setting
  const visibilityHint =
    preSelectedCommunityVisibility === "private"
      ? `This is a private community — events default to private and are only visible to members.`
      : preSelectedCommunityVisibility === "unlisted"
        ? `This community is unlisted — events default to unlisted (accessible via link only).`
        : null

  // Load spaces when community changes
  useEffect(() => {
    if (!formData.community_id) {
      setSpaces([])
      if (!isCommunityLocked) updateFormData({ space_id: "" })
      return
    }

    // Find the slug from either the locked community or the communities list
    const communitySlug =
      isCommunityLocked
        ? communities.find(c => c.id === formData.community_id)?.slug
        : communities.find(c => c.id === formData.community_id)?.slug

    if (!communitySlug) return

    async function loadSpaces() {
      setLoadingSpaces(true)
      try {
        const communitySpaces = await getSpacesByCommunity(communitySlug!)
        setSpaces(communitySpaces.map(s => ({ id: s.id, name: s.name, slug: s.slug })))
      } catch (error) {
        console.error("Failed to load spaces:", error)
        setSpaces([])
      } finally {
        setLoadingSpaces(false)
      }
    }

    loadSpaces()
  }, [formData.community_id, communities])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure who can see your event and where to post it.
        </p>
      </div>

      <div className="space-y-6">
        {/* Visibility section */}
        <div className="space-y-3">
          <Label>Who can see this event?</Label>

          {/* Community-derived visibility hint */}
          {visibilityHint && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/60 border border-border text-sm text-muted-foreground">
              <Info className="w-4 h-4 mt-0.5 shrink-0 text-foreground/60" />
              <span>{visibilityHint} You can still change this below.</span>
            </div>
          )}

          <RadioGroup
            value={formData.visibility}
            onValueChange={(val) => updateFormData({ visibility: val as EventVisibility })}
            className="grid gap-3"
          >
            {VISIBILITY_OPTIONS.map((option) => {
              const Icon = option.icon
              const isSelected = formData.visibility === option.value
              return (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <RadioGroupItem value={option.value} className="mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{option.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {option.description}
                    </p>
                  </div>
                </label>
              )
            })}
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_attendees">Maximum Attendees (optional)</Label>
          <Input
            id="max_attendees"
            type="number"
            min="1"
            value={formData.max_attendees}
            onChange={(e) => updateFormData({ max_attendees: e.target.value })}
            placeholder="Leave empty for unlimited"
          />
          <p className="text-xs text-muted-foreground">
            Set a limit to control how many people can RSVP
          </p>
        </div>

        {/* Community & space selection */}
        <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
          <div className="space-y-2">
            <Label htmlFor="community" className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" />
              {isCommunityLocked ? "Community" : "Post to Community (optional)"}
            </Label>

            {isCommunityLocked ? (
              /* Locked: show the community name as read-only */
              <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-muted/50 text-sm">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{preSelectedCommunityName || "Community"}</span>
                <span className="ml-auto text-xs text-muted-foreground">Set from context</span>
              </div>
            ) : communities.length > 0 ? (
              <Select
                value={formData.community_id || "none"}
                onValueChange={(val) => {
                  updateFormData({
                    community_id: val === "none" ? "" : val,
                    space_id: "",
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No community - personal event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No community - personal event</SelectItem>
                  {communities.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-xs text-muted-foreground py-1">
                You are not a member of any community yet.
              </p>
            )}

            {!isCommunityLocked && (
              <p className="text-xs text-muted-foreground">
                Share this event with a community you are a member of
              </p>
            )}
          </div>

          {/* Space selection — show when a community is chosen */}
          {formData.community_id && (
            <div className="space-y-2">
              <Label htmlFor="space" className="flex items-center gap-2">
                <LayoutGrid className="w-3.5 h-3.5" />
                Post to Space (optional)
              </Label>
              {loadingSpaces ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading spaces...
                </div>
              ) : spaces.length > 0 ? (
                <Select
                  value={formData.space_id || "none"}
                  onValueChange={(val) => updateFormData({ space_id: val === "none" ? "" : val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No specific space" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific space — community feed</SelectItem>
                    {spaces.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-muted-foreground py-2">
                  No spaces available in this community
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Post this event to a specific space within the community
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
