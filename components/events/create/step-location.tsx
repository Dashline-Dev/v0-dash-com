"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Video } from "lucide-react"
import type { EventFormData } from "./create-wizard"

interface StepLocationProps {
  formData: EventFormData
  updateFormData: (updates: Partial<EventFormData>) => void
}

export function StepLocation({ formData, updateFormData }: StepLocationProps) {
  const showPhysical = formData.event_type === "in_person" || formData.event_type === "hybrid"
  const showVirtual = formData.event_type === "virtual" || formData.event_type === "hybrid"

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Location</h2>
        <p className="text-sm text-muted-foreground">
          {formData.event_type === "virtual"
            ? "Where will people join online?"
            : formData.event_type === "hybrid"
            ? "Add both physical and virtual location details."
            : "Where will the event take place?"}
        </p>
      </div>

      <div className="space-y-6">
        {showPhysical && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Physical Location</span>
            </div>

            <div className="space-y-4 pl-6">
              <div className="space-y-2">
                <Label htmlFor="location_name">Venue Name</Label>
                <Input
                  id="location_name"
                  value={formData.location_name}
                  onChange={(e) => updateFormData({ location_name: e.target.value })}
                  placeholder="e.g., Grand Ballroom, Community Center"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location_address">Address (optional)</Label>
                <Input
                  id="location_address"
                  value={formData.location_address}
                  onChange={(e) => updateFormData({ location_address: e.target.value })}
                  placeholder="e.g., 123 Main St, New York, NY 10001"
                />
              </div>
            </div>
          </div>
        )}

        {showVirtual && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Virtual Location</span>
            </div>

            <div className="space-y-2 pl-6">
              <Label htmlFor="virtual_link">Meeting Link</Label>
              <Input
                id="virtual_link"
                type="url"
                value={formData.virtual_link}
                onChange={(e) => updateFormData({ virtual_link: e.target.value })}
                placeholder="e.g., https://zoom.us/j/..."
              />
              <p className="text-xs text-muted-foreground">
                Zoom, Google Meet, Teams, or any video call link
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
