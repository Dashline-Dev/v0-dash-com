"use client"

import { X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
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
  availableAreas?: { id: string; name: string; type: string; parentName: string | null }[]
}

export function StepLocation({ data, onChange, availableAreas = [] }: StepLocationProps) {
  const selectedAreaIds = data.areaIds || []

  function toggleArea(areaId: string) {
    const current = selectedAreaIds
    if (current.includes(areaId)) {
      onChange({ areaIds: current.filter((id) => id !== areaId) })
    } else {
      onChange({ areaIds: [...current, areaId] })
    }
  }

  function removeArea(areaId: string) {
    onChange({ areaIds: selectedAreaIds.filter((id) => id !== areaId) })
  }

  const selectedAreas = availableAreas.filter((a) => selectedAreaIds.includes(a.id))

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

      {availableAreas.length > 0 && (
        <div className="space-y-1.5">
          <Label>Areas (optional)</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Link your community to geographic areas so local users can discover it.
          </p>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                {selectedAreas.length > 0
                  ? `${selectedAreas.length} area${selectedAreas.length > 1 ? "s" : ""} selected`
                  : "Select areas..."}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                {availableAreas.map((area) => (
                  <label
                    key={area.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedAreaIds.includes(area.id)}
                      onCheckedChange={() => toggleArea(area.id)}
                    />
                    <span className="text-sm flex-1">
                      {area.name}
                      {area.parentName && (
                        <span className="text-muted-foreground text-xs ml-1">
                          ({area.parentName})
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {area.type}
                    </span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {selectedAreas.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {selectedAreas.map((area) => (
                <Badge key={area.id} variant="secondary" className="gap-1 pr-1">
                  {area.name}
                  <button
                    type="button"
                    onClick={() => removeArea(area.id)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

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
