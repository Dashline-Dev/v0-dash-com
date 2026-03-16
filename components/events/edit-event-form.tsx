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
} from "lucide-react"
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

// Helper to format date for datetime-local input
function formatDateTimeLocal(dateStr: string, timezone: string): string {
  try {
    const date = new Date(dateStr)
    // Get the local time string in the format required by datetime-local
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  } catch {
    return ""
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

  const [form, setForm] = useState({
    title: event.title,
    description: event.description ?? "",
    cover_image_url: event.cover_image_url,
    event_type: event.event_type as EventType,
    visibility: event.visibility ?? "public",
    status: event.status,
    start_time: formatDateTimeLocal(event.start_time, event.timezone),
    end_time: formatDateTimeLocal(event.end_time, event.timezone),
    timezone: event.timezone,
    location_name: event.location_name ?? "",
    location_address: event.location_address ?? "",
    virtual_link: event.virtual_link ?? "",
    max_attendees: event.max_attendees,
    contact_info: event.contact_info ?? "",
  })

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
        await updateEvent(event.id, {
          title: form.title,
          description: form.description || null,
          cover_image_url: form.cover_image_url,
          event_type: form.event_type,
          visibility: form.visibility,
          status: form.status,
          start_time: new Date(form.start_time).toISOString(),
          end_time: new Date(form.end_time).toISOString(),
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
