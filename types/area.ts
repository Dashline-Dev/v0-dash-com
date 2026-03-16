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

export interface AreaSpace {
  id: string
  name: string
  slug: string
  description: string | null
  type: string
  icon: string | null
  cover_image_url: string | null
  member_count: number
  community_name: string | null
  community_slug: string | null
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
  space_name: string | null
  space_slug: string | null
}


