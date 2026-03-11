// ── Event enums & constants ──────────────────────────────────

export type EventType = "in_person" | "virtual" | "hybrid"
export type EventStatus = "draft" | "published" | "cancelled" | "completed"
export type RsvpStatus = "going" | "interested" | "not_going"

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  in_person: "In Person",
  virtual: "Virtual",
  hybrid: "Hybrid",
}

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: "Draft",
  published: "Published",
  cancelled: "Cancelled",
  completed: "Completed",
}

export const RSVP_STATUS_LABELS: Record<RsvpStatus, string> = {
  going: "Going",
  interested: "Interested",
  not_going: "Not Going",
}

export const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "in_person", label: "In Person" },
  { value: "virtual", label: "Virtual" },
  { value: "hybrid", label: "Hybrid" },
]

// ── Core interfaces ─────────────────────────────────────────

export type EventVisibility = "public" | "private" | "unlisted"

export const EVENT_VISIBILITY_LABELS: Record<EventVisibility, string> = {
  public: "Public",
  private: "Private",
  unlisted: "Unlisted (link only)",
}

export interface Event {
  id: string
  community_id: string | null
  space_id: string | null
  title: string
  slug: string
  description: string | null
  cover_image_url: string | null
  event_type: EventType
  status: EventStatus
  visibility: EventVisibility
  start_time: string
  end_time: string
  timezone: string
  location_name: string | null
  location_address: string | null
  latitude: number | null
  longitude: number | null
  virtual_link: string | null
  max_attendees: number | null
  rsvp_count: number
  organizer_id: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface EventWithMeta extends Event {
  community_name: string | null
  community_slug: string | null
  space_name: string | null
  space_slug: string | null
  current_user_rsvp: RsvpStatus | null
  organizer_name: string | null
  organizer_avatar: string | null
}

export interface EventRsvp {
  id: string
  event_id: string
  user_id: string
  status: RsvpStatus
  rsvped_at: string
}

// ── Form data ───────────────────────────────────────────────

export interface CreateEventData {
  community_id?: string | null
  space_id?: string | null
  title: string
  description?: string
  cover_image_url?: string
  event_type: EventType
  visibility?: EventVisibility
  start_time: string
  end_time: string
  timezone: string
  location_name?: string
  location_address?: string
  latitude?: number
  longitude?: number
  virtual_link?: string
  max_attendees?: number
}

export interface UpdateEventData {
  title?: string
  description?: string
  cover_image_url?: string
  event_type?: EventType
  status?: EventStatus
  start_time?: string
  end_time?: string
  timezone?: string
  location_name?: string
  location_address?: string
  latitude?: number
  longitude?: number
  virtual_link?: string
  max_attendees?: number | null
}

// ── Helpers ─────────────────────────────────────────────────

export function formatEventDate(dateStr: string, timezone?: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: timezone || "UTC",
  })
}

export function formatEventTime(dateStr: string, timezone?: string) {
  const date = new Date(dateStr)
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone || "UTC",
  })
}

export function formatEventDateRange(
  startStr: string,
  endStr: string,
  timezone?: string
) {
  const start = new Date(startStr)
  const end = new Date(endStr)
  const sameDay = start.toDateString() === end.toDateString()

  if (sameDay) {
    return `${formatEventDate(startStr, timezone)}, ${formatEventTime(startStr, timezone)} - ${formatEventTime(endStr, timezone)}`
  }
  return `${formatEventDate(startStr, timezone)}, ${formatEventTime(startStr, timezone)} - ${formatEventDate(endStr, timezone)}, ${formatEventTime(endStr, timezone)}`
}

export function isEventPast(endStr: string) {
  return new Date(endStr) < new Date()
}

export function isEventFull(event: Event) {
  return event.max_attendees !== null && event.rsvp_count >= event.max_attendees
}

export function getEventCapacityText(event: Event) {
  if (!event.max_attendees) return null
  const remaining = event.max_attendees - event.rsvp_count
  if (remaining <= 0) return "Sold out"
  if (remaining <= 5) return `${remaining} spots left`
  return `${event.rsvp_count} / ${event.max_attendees}`
}
