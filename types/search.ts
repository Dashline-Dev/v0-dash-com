// ── Search Result Types ───────────────────────────────────────────────

export type SearchResultType = "community" | "event" | "space" | "area"

export interface SearchResult {
  type: SearchResultType
  id: string
  title: string
  subtitle: string
  slug: string
  href: string
  imageUrl?: string | null
  rank: number
  meta?: Record<string, unknown>
}

export interface SearchFilters {
  query: string
  type?: SearchResultType | "all"
  limit?: number
  offset?: number
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
}

// ── Trending / Nearby ─────────────────────────────────────────────────

export interface TrendingItem {
  type: "community" | "event"
  id: string
  title: string
  subtitle: string
  slug: string
  href: string
  imageUrl?: string | null
  metric: number // member_count or rsvp_count
  metricLabel: string
}

export interface NearbyItem {
  type: SearchResultType
  id: string
  title: string
  subtitle: string
  slug: string
  href: string
  imageUrl?: string | null
  latitude: number
  longitude: number
  distanceKm: number
}

// ── Map Marker (for explore map) ──────────────────────────────────────

export interface ExploreMapMarker {
  id: string
  type: SearchResultType
  title: string
  subtitle: string
  href: string
  latitude: number
  longitude: number
}
