// ── Area enums & constants ──────────────────────────────────

export type AreaType = "city" | "neighborhood"
export type AreaStatus = "active" | "inactive"

export const AREA_TYPE_LABELS: Record<AreaType, string> = {
  city: "City",
  neighborhood: "Neighborhood",
}

// ── Core interfaces ─────────────────────────────────────────

export interface Area {
  id: string
  name: string
  slug: string
  description: string | null
  type: AreaType
  parent_id: string | null
  latitude: number
  longitude: number
  bounds_ne_lat: number | null
  bounds_ne_lng: number | null
  bounds_sw_lat: number | null
  bounds_sw_lng: number | null
  cover_image_url: string | null
  place_id: string | null
  status: AreaStatus
  created_at: string
  updated_at: string
}

export interface AreaWithMeta extends Area {
  parent_name: string | null
  parent_slug: string | null
  community_count: number
  event_count: number
  neighborhood_count: number
  zip_codes: string[]
}

export interface AreaNeighborhood {
  id: string
  name: string
  slug: string
  description: string | null
  place_id: string | null
  community_count: number
  event_count: number
  bounds_ne_lat: number | null
  bounds_ne_lng: number | null
  bounds_sw_lat: number | null
  bounds_sw_lng: number | null
}

export interface AreaCommunity {
  id: string
  name: string
  slug: string
  description: string | null
  cover_image_url: string | null
  member_count: number
  location_name: string | null
  tags: string[]
}

export interface AreaEvent {
  id: string
  title: string
  slug: string
  description: string | null
  event_type: string
  start_time: string
  end_time: string
  timezone: string
  location_name: string | null
  location_address: string | null
  latitude: number | null
  longitude: number | null
  virtual_link: string | null
  rsvp_count: number
  max_attendees: number | null
  community_name: string
  community_slug: string
}

// ── Map helpers ─────────────────────────────────────────────

export interface MapMarker {
  id: string
  lat: number
  lng: number
  title: string
  type: "community" | "event" | "area"
  slug: string
  subtitle?: string
}

export interface MapBounds {
  ne: { lat: number; lng: number }
  sw: { lat: number; lng: number }
}

export function areaBoundsToMapBounds(area: Area): MapBounds | null {
  if (!area.bounds_ne_lat || !area.bounds_ne_lng || !area.bounds_sw_lat || !area.bounds_sw_lng) {
    return null
  }
  return {
    ne: { lat: area.bounds_ne_lat, lng: area.bounds_ne_lng },
    sw: { lat: area.bounds_sw_lat, lng: area.bounds_sw_lng },
  }
}
