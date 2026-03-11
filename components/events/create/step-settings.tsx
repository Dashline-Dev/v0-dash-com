"use client"

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
import { Globe, Lock, Link2 } from "lucide-react"
import type { EventFormData } from "./create-wizard"
import type { EventVisibility } from "@/types/event"

interface StepSettingsProps {
  formData: EventFormData
  updateFormData: (updates: Partial<EventFormData>) => void
  communities?: { id: string; name: string; slug: string }[]
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

export function StepSettings({ formData, updateFormData, communities = [] }: StepSettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure who can see your event and optional limits.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <Label>Who can see this event?</Label>
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

        {communities.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="community">Post to Community (optional)</Label>
            <Select
              value={formData.community_id || "none"}
              onValueChange={(val) => updateFormData({ community_id: val === "none" ? "" : val })}
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
            <p className="text-xs text-muted-foreground">
              Optionally share this event with a community you are a member of
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
