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
  Plus,
  X,
  Clock,
  Calendar,
} from "lucide-react"
import { PlacesAutocomplete, type PlaceResult } from "@/components/ui/places-autocomplete"
import { GoogleMapsProvider } from "@/components/maps/google-maps-provider"

const COMMON_TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Phoenix", label: "Arizona (MST)" },
  { value: "America/Anchorage", label: "Alaska Time" },
  { value: "Pacific/Honolulu", label: "Hawaii Time" },
  { value: "UTC", label: "UTC" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Asia/Jerusalem", label: "Israel (IST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
]

const QUICK_DURATIONS = [
  { label: "1 hr", hours: 1 },
  { label: "1.5 hrs", hours: 1.5 },
  { label: "2 hrs", hours: 2 },
  { label: "3 hrs", hours: 3 },
  { label: "4 hrs", hours: 4 },
]

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
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTimeState] = useState("")
  const [endDate, setEndDate] = useState("")
  const [endTimeVal, setEndTimeVal] = useState("")
  const [showEndTime, setShowEndTime] = useState(false)
  const [showMultiDay, setShowMultiDay] = useState(false)

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

  function applyDuration(hours: number) {
    if (!startTime) return
    const [h, m] = startTime.split(":").map(Number)
    const endMinutes = h * 60 + m + hours * 60
    const endH = Math.floor(endMinutes / 60) % 24
    const endM = endMinutes % 60
    setEndTimeVal(`${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`)
  }

  function toggleEndTime() {
    if (showEndTime) { setEndTimeVal(""); setShowEndTime(false) }
    else setShowEndTime(true)
  }

  function toggleMultiDay() {
    if (showMultiDay) { setEndDate(startDate); setShowMultiDay(false) }
    else setShowMultiDay(true)
  }

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
    if (!startDate || !startTime) {
      setError("Start date and time are required.")
      return
    }

    const builtStartTime = `${startDate}T${startTime}:00`
    let resolvedEndTime = endTimeVal
    if (!resolvedEndTime) {
      const [h, m] = startTime.split(":").map(Number)
      const endH = (h + 1) % 24
      resolvedEndTime = `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`
    }
    const resolvedEndDate = (showMultiDay && endDate) ? endDate : startDate
    const builtEndTime = `${resolvedEndDate}T${resolvedEndTime}:00`

    if (new Date(builtEndTime) <= new Date(builtStartTime)) {
      setError("End time must be after start time.")
      return
    }

    startTransition(async () => {
      try {
        const result = await createEvent({ ...form, start_time: builtStartTime, end_time: builtEndTime })
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
          {/* Start date + time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date" className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Date
              </Label>
              <Input
                id="start_date"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  if (!showMultiDay) setEndDate(e.target.value)
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_time_input" className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                Start Time
              </Label>
              <Input
                id="start_time_input"
                type="time"
                value={startTime}
                onChange={(e) => setStartTimeState(e.target.value)}
              />
            </div>
          </div>

          {/* End time — expandable */}
          {showEndTime && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <Label htmlFor="end_time_input" className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  End Time
                </Label>
                <Button type="button" variant="ghost" size="sm" onClick={toggleEndTime} className="h-6 px-2 text-muted-foreground hover:text-foreground">
                  <X className="w-3 h-3 mr-1" />
                  Remove
                </Button>
              </div>
              <Input
                id="end_time_input"
                type="time"
                value={endTimeVal}
                onChange={(e) => setEndTimeVal(e.target.value)}
              />
              {startTime && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground self-center">Quick:</span>
                  {QUICK_DURATIONS.map((d) => (
                    <Button key={d.label} type="button" variant="outline" size="sm" onClick={() => applyDuration(d.hours)} className="h-7 text-xs">
                      {d.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* End date — multi-day expandable */}
          {showMultiDay && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <Label htmlFor="end_date" className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  End Date
                </Label>
                <Button type="button" variant="ghost" size="sm" onClick={toggleMultiDay} className="h-6 px-2 text-muted-foreground hover:text-foreground">
                  <X className="w-3 h-3 mr-1" />
                  Remove
                </Button>
              </div>
              <Input
                id="end_date"
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          )}

          {/* Add optional fields */}
          {(!showEndTime || !showMultiDay) && (
            <div className="flex gap-2 pt-1">
              {!showEndTime && (
                <Button type="button" variant="outline" size="sm" onClick={toggleEndTime} className="text-muted-foreground">
                  <Plus className="w-4 h-4 mr-1" />
                  Add End Time
                </Button>
              )}
              {!showMultiDay && (
                <Button type="button" variant="outline" size="sm" onClick={toggleMultiDay} className="text-muted-foreground">
                  <Plus className="w-4 h-4 mr-1" />
                  Multi-Day Event
                </Button>
              )}
            </div>
          )}

          {/* Timezone */}
          <div className="pt-3 border-t space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={form.timezone}
              onValueChange={(v) => update("timezone", v)}
            >
              <SelectTrigger id="timezone">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <GoogleMapsProvider>
                <PlacesAutocomplete
                  id="location_address"
                  value={form.location_address ?? ""}
                  onChange={(val) => update("location_address", val)}
                  onPlaceSelect={(place: PlaceResult) => {
                    update("location_address", place.formattedAddress)
                    if (!form.location_name) {
                      update("location_name", place.name)
                    }
                  }}
                  placeholder="Search for an address..."
                  types={["address", "establishment"]}
                />
              </GoogleMapsProvider>
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

          {/* Area info */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              Area Discovery
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This event will automatically appear in any areas linked to its
              community, making it discoverable by geographic location.
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
