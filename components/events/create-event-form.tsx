"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageUpload } from "@/components/ui/image-upload"
import { createEvent } from "@/lib/actions/event-actions"
import {
  EVENT_TYPE_LABELS,
  type EventType,
  type CreateEventForm as CreateEventFormData,
} from "@/types/event"
import {
  Loader2,
  CalendarPlus,
  MapPin,
  Video,
  Globe,
  Info,
} from "lucide-react"

interface CreateEventFormProps {
  communityId: string
  communitySlug: string
  spaceId?: string
}

export function CreateEventForm({
  communityId,
  communitySlug,
  spaceId,
}: CreateEventFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<CreateEventFormData>({
    community_id: communityId,
    space_id: spaceId ?? null,
    title: "",
    description: "",
    cover_image_url: null,
    event_type: "in_person",
    start_time: "",
    end_time: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    location_name: "",
    location_address: "",
    virtual_link: "",
    max_attendees: null,
  })

  function update<K extends keyof CreateEventFormData>(
    key: K,
    value: CreateEventFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const showLocationFields =
    form.event_type === "in_person" || form.event_type === "hybrid"
  const showVirtualFields =
    form.event_type === "virtual" || form.event_type === "hybrid"

  function handleSubmit() {
    setError(null)

    if (!form.title.trim()) {
      setError("Event title is required.")
      return
    }
    if (!form.start_time || !form.end_time) {
      setError("Start and end times are required.")
      return
    }
    if (new Date(form.end_time) <= new Date(form.start_time)) {
      setError("End time must be after start time.")
      return
    }

    startTransition(async () => {
      try {
        const result = await createEvent(form)
        if (result.slug) {
          router.push(`/events/${result.slug}`)
        }
      } catch {
        setError("Failed to create event. Please try again.")
      }
    })
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Basic info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              placeholder="Give your event a clear, catchy name"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              maxLength={120}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What is this event about? Include details like what to bring, what to expect, etc."
              value={form.description ?? ""}
              onChange={(e) => update("description", e.target.value)}
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label>Cover Image</Label>
            <ImageUpload
              value={form.cover_image_url}
              onChange={(url) => update("cover_image_url", url)}
              aspectRatio="landscape"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event_type">Event Format</Label>
            <Select
              value={form.event_type}
              onValueChange={(v) => update("event_type", v as EventType)}
            >
              <SelectTrigger id="event_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Date & Time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarPlus className="w-4 h-4 text-muted-foreground" />
            Date & Time
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start</Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={form.start_time}
                onChange={(e) => update("start_time", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End</Label>
              <Input
                id="end_time"
                type="datetime-local"
                value={form.end_time}
                onChange={(e) => update("end_time", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              value={form.timezone}
              onChange={(e) => update("timezone", e.target.value)}
              placeholder="e.g. America/New_York"
            />
            <p className="text-xs text-muted-foreground">
              Auto-detected from your browser. Change if the event is in a different timezone.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      {showLocationFields && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location_name">Venue Name</Label>
              <Input
                id="location_name"
                placeholder="e.g. WeWork Midtown, Central Park"
                value={form.location_name ?? ""}
                onChange={(e) => update("location_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location_address">Address</Label>
              <Input
                id="location_address"
                placeholder="Full street address"
                value={form.location_address ?? ""}
                onChange={(e) => update("location_address", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Virtual link */}
      {showVirtualFields && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Video className="w-4 h-4 text-muted-foreground" />
              Virtual Meeting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="virtual_link">Meeting Link</Label>
              <Input
                id="virtual_link"
                placeholder="https://meet.google.com/... or https://zoom.us/..."
                value={form.virtual_link ?? ""}
                onChange={(e) => update("virtual_link", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Capacity & Publish */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="max_attendees">Max Attendees (optional)</Label>
            <Input
              id="max_attendees"
              type="number"
              min={1}
              placeholder="Leave empty for unlimited"
              value={form.max_attendees ?? ""}
              onChange={(e) =>
                update(
                  "max_attendees",
                  e.target.value ? Number(e.target.value) : null
                )
              }
            />
          </div>

          {/* Area stub */}
          <div className="rounded-lg border border-dashed border-border p-4">
            <p className="text-sm font-medium text-muted-foreground">
              Publish to Area
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Area-based event publishing is coming soon. Events will be
              discoverable by geographic area.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex items-center gap-3 justify-end">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isPending} className="gap-2">
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CalendarPlus className="w-4 h-4" />
          )}
          Create Event
        </Button>
      </div>
    </div>
  )
}
