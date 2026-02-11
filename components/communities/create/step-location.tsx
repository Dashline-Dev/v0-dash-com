"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CreateCommunityInput } from "@/types/community"

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
]

interface StepLocationProps {
  data: CreateCommunityInput
  onChange: (data: Partial<CreateCommunityInput>) => void
}

export function StepLocation({ data, onChange }: StepLocationProps) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Optionally add a location and timezone. This helps local members find
        your community.
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="location">Location name</Label>
        <Input
          id="location"
          placeholder="e.g. Austin, TX"
          value={data.location_name || ""}
          onChange={(e) => onChange({ location_name: e.target.value || null })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Contact email (optional)</Label>
        <Input
          id="email"
          type="email"
          placeholder="community@example.com"
          value={data.contact_email || ""}
          onChange={(e) => onChange({ contact_email: e.target.value || null })}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Timezone</Label>
        <Select
          value={data.timezone || "UTC"}
          onValueChange={(val) => onChange({ timezone: val })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
