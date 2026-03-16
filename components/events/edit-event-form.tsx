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
import { updateEvent } from "@/lib/actions/event-actions"
import {
  EVENT_TYPE_LABELS,
  type EventType,
  type EventWithMeta,
} from "@/types/event"
import {
  Loader2,
  CalendarPlus,
  MapPin,
  Video,
  Globe,
  Info,
  Save,
  Trash2,
  Plus,
  X,
  Clock,
  Calendar,
} from "lucide-react"

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
import { PlacesAutocomplete, type PlaceResult } from "@/components/ui/places-autocomplete"
import { GoogleMapsProvider } from "@/components/maps/google-maps-provider"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface EditEventFormProps {
  event: EventWithMeta
  canDelete?: boolean
  onDelete?: () => Promise<void>
  returnUrl?: string
}

// Split an ISO datetime string into { date: "YYYY-MM-DD", time: "HH:MM" }
function splitDateTime(dateStr: string): { date: string; time: string } {
  try {
    const d = new Date(dateStr)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    const hours = String(d.getHours()).padStart(2, "0")
    const minutes = String(d.getMinutes()).padStart(2, "0")
    return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` }
  } catch {
    return { date: "", time: "" }
  }
}

export function EditEventForm({
  event,
  canDelete = false,
  onDelete,
  returnUrl,
}: EditEventFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const parsedStart = splitDateTime(event.start_time)
  const parsedEnd = splitDateTime(event.end_time)
  const initialMultiDay = parsedEnd.date !== parsedStart.date && !!parsedEnd.date

  const [startDate, setStartDate] = useState(parsedStart.date)
  const [startTime, setStartTimeState] = useState(parsedStart.time)
  const [endDate, setEndDate] = useState(parsedEnd.date)
  const [endTimeVal, setEndTimeVal] = useState(parsedEnd.time)
  const [showEndTime, setShowEndTime] = useState(!!parsedEnd.time)
  const [showMultiDay, setShowMultiDay] = useState(initialMultiDay)

  const [form, setForm] = useState({
    title: event.title,
    description: event.description ?? "",
    cover_image_url: event.cover_image_url,
    event_type: event.event_type as EventType,
    visibility: event.visibility ?? "public",
    status: event.status,
    timezone: event.timezone,
    location_name: event.location_name ?? "",
    location_address: event.location_address ?? "",
    virtual_link: event.virtual_link ?? "",
    max_attendees: event.max_attendees,
    contact_info: event.contact_info ?? "",
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

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSuccess(false)
  }

  const showLocationFields =
    form.event_type === "in_person" || form.event_type === "hybrid"
  const showVirtualFields =
    form.event_type === "virtual" || form.event_type === "hybrid"

  function handleSubmit() {
    setError(null)
    setSuccess(false)

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
        await updateEvent(event.id, {
          title: form.title,
          description: form.description || null,
          cover_image_url: form.cover_image_url,
          event_type: form.event_type,
          visibility: form.visibility,
          status: form.status,
          start_time: new Date(builtStartTime).toISOString(),
          end_time: new Date(builtEndTime).toISOString(),
          timezone: form.timezone,
          location_name: form.location_name || null,
          location_address: form.location_address || null,
          virtual_link: form.virtual_link || null,
          max_attendees: form.max_attendees,
          contact_info: form.contact_info || null,
        })
        setSuccess(true)
        // Optionally redirect after save
        if (returnUrl) {
          router.push(returnUrl)
        } else {
          router.refresh()
        }
      } catch {
        setError("Failed to update event. Please try again.")
      }
    })
  }

  async function handleDelete() {
    if (!onDelete) return
    setIsDeleting(true)
    try {
      await onDelete()
      router.push(returnUrl || "/events")
    } catch {
      setError("Failed to delete event.")
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-400">
          Event updated successfully!
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
              placeholder="What is this event about?"
              value={form.description}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => update("status", v)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Select
              value={form.visibility}
              onValueChange={(v) => update("visibility", v)}
            >
              <SelectTrigger id="visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public - Visible to everyone</SelectItem>
                <SelectItem value="unlisted">Unlisted - Only accessible via link</SelectItem>
                <SelectItem value="private">Private - Only community members</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Public events appear in explore and search results
            </p>
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
                placeholder="e.g. WeWork Midtown"
                value={form.location_name}
                onChange={(e) => update("location_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location_address">Address</Label>
              <GoogleMapsProvider>
                <PlacesAutocomplete
                  id="location_address"
                  value={form.location_address}
                  onChange={(val) => update("location_address", val)}
                  onPlaceSelect={(place: PlaceResult) => {
                    update("location_address", place.formattedAddress)
                    if (!form.location_name) {
                      update("location_name", place.name)
                    }
                  }}
                  placeholder="Search for an address..."
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
                value={form.virtual_link}
                onChange={(e) => update("virtual_link", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings */}
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
                update("max_attendees", e.target.value ? Number(e.target.value) : null)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_info">Contact Info (optional)</Label>
            <Input
              id="contact_info"
              placeholder="e.g. email@example.com or phone number"
              value={form.contact_info}
              onChange={(e) => update("contact_info", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <div>
          {canDelete && onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isPending || isDeleting}>
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Delete Event
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this event?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{event.title}" and all its RSVPs.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        <div className="flex items-center gap-3">
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
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
