"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { MapPin, Video, Users } from "lucide-react"
import type { EventFormData } from "./create-wizard"
import type { EventType } from "@/types/event"

interface StepBasicsProps {
  formData: EventFormData
  updateFormData: (updates: Partial<EventFormData>) => void
}

const EVENT_TYPES: { value: EventType; label: string; description: string; icon: typeof MapPin }[] = [
  {
    value: "in_person",
    label: "In Person",
    description: "Meet at a physical location",
    icon: MapPin,
  },
  {
    value: "virtual",
    label: "Virtual",
    description: "Online event via video call",
    icon: Video,
  },
  {
    value: "hybrid",
    label: "Hybrid",
    description: "Both in-person and online",
    icon: Users,
  },
]

export function StepBasics({ formData, updateFormData }: StepBasicsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Event Details</h2>
        <p className="text-sm text-muted-foreground">
          Give your event a name and tell people what it is about.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Event Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => updateFormData({ title: e.target.value })}
            placeholder="e.g., David's Wedding Reception"
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground">
            {formData.title.length}/100 characters
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            placeholder="Tell your guests what to expect..."
            rows={4}
            maxLength={2000}
          />
          <p className="text-xs text-muted-foreground">
            {formData.description.length}/2000 characters
          </p>
        </div>

        <div className="space-y-3">
          <Label>Event Type</Label>
          <RadioGroup
            value={formData.event_type}
            onValueChange={(val) => updateFormData({ event_type: val as EventType })}
            className="grid gap-3"
          >
            {EVENT_TYPES.map((type) => {
              const Icon = type.icon
              const isSelected = formData.event_type === type.value
              return (
                <label
                  key={type.value}
                  className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <RadioGroupItem value={type.value} className="mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{type.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {type.description}
                    </p>
                  </div>
                </label>
              )
            })}
          </RadioGroup>
        </div>
      </div>
    </div>
  )
}
