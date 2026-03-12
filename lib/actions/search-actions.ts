"use server"

import { sql } from "@/lib/db"
import type {
  SearchResult,
  SearchFilters,
  SearchResponse,
  TrendingItem,
  NearbyItem,
  ExploreMapMarker,
  SearchResultType,
} from "@/types/search"

// ── Global Search ─────────────────────────────────────────────────────

export async function globalSearch(
  filters: SearchFilters
): Promise<SearchResponse> {
  const { query, type = "all", limit = 20, offset = 0 } = filters

  if (!query || query.trim().length === 0) {
    return { results: [], total: 0, query: "" }
  }

  const trimmed = query.trim()
  // Build tsquery: split words and join with & for AND matching
  const tsQuery = trimmed
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `${w}:*`)
    .join(" & ")

  const unions: string[] = []
  const typeFilter = type === "all" ? null : type

  // Communities
  if (!typeFilter || typeFilter === "community") {
    unions.push(`
      SELECT
        'community' AS type,
        c.id::text,
        c.name AS title,
        COALESCE(c.location_name, '') AS subtitle,
        c.slug,
        '/communities/' || c.slug AS href,
        c.cover_image_url AS image_url,
        COALESCE(ts_rank(c.search_vector, to_tsquery('english', $1)), 0) +
        COALESCE(similarity(c.name, $2), 0) AS rank
      FROM communities c
      WHERE c.visibility = 'public'
        AND (
          c.search_vector @@ to_tsquery('english', $1)
          OR c.name % $2
          OR c.name ILIKE '%' || $2 || '%'
        )
    `)
  }

  // Events
  if (!typeFilter || typeFilter === "event") {
    unions.push(`
      SELECT
        'event' AS type,
        e.id::text,
        e.title,
        COALESCE(e.location_name, e.event_type) AS subtitle,
        e.slug,
        '/events/' || e.slug AS href,
        NULL AS image_url,
        COALESCE(ts_rank(e.search_vector, to_tsquery('english', $1)), 0) +
        COALESCE(similarity(e.title, $2), 0) AS rank
      FROM events e
      JOIN communities c ON c.id = e.community_id
      WHERE e.status = 'published'
        AND c.visibility = 'public'
        AND (
          e.search_vector @@ to_tsquery('english', $1)
          OR e.title % $2
          OR e.title ILIKE '%' || $2 || '%'
        )
    `)
  }

  // Spaces
  if (!typeFilter || typeFilter === "space") {
    unions.push(`
      SELECT
        'space' AS type,
        s.id::text,
        s.name AS title,
        COALESCE(s.type, '') AS subtitle,
        s.slug,
        '/spaces/' || s.slug AS href,
        s.cover_image_url AS image_url,
        COALESCE(ts_rank(s.search_vector, to_tsquery('english', $1)), 0) +
        COALESCE(similarity(s.name, $2), 0) AS rank
      FROM spaces s
      JOIN communities c ON c.id = s.community_id
      WHERE c.visibility = 'public'
        AND (
          s.search_vector @@ to_tsquery('english', $1)
          OR s.name % $2
          OR s.name ILIKE '%' || $2 || '%'
        )
    `)
  }

  // Areas
  if (!typeFilter || typeFilter === "area") {
    unions.push(`
      SELECT
        'area' AS type,
        a.id::text,
        a.name AS title,
        INITCAP(a.type) AS subtitle,
        a.slug,
        '/areas/' || a.slug AS href,
        a.cover_image_url AS image_url,
        COALESCE(ts_rank(a.search_vector, to_tsquery('english', $1)), 0) +
        COALESCE(similarity(a.name, $2), 0) AS rank
      FROM areas a
      WHERE a.status = 'active'
        AND (
          a.search_vector @@ to_tsquery('english', $1)
          OR a.name % $2
          OR a.name ILIKE '%' || $2 || '%'
        )
    `)
  }

  if (unions.length === 0) {
    return { results: [], total: 0, query: trimmed }
  }

  const combinedQuery = unions.join(" UNION ALL ")

  // Get total count
  const countRows = await sql(
    `SELECT COUNT(*) AS total FROM (${combinedQuery}) AS search_results`,
    [tsQuery, trimmed]
  )
  const total = parseInt(countRows[0]?.total ?? "0", 10)

  // Get paginated results
  const rows = await sql(
    `SELECT * FROM (${combinedQuery}) AS search_results
     ORDER BY rank DESC
     LIMIT $3 OFFSET $4`,
    [tsQuery, trimmed, limit, offset]
  )

  const results: SearchResult[] = rows.map((row) => ({
    type: row.type as SearchResultType,
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    slug: row.slug,
    href: row.href,
    imageUrl: row.image_url,
    rank: parseFloat(row.rank) || 0,
  }))

  return { results, total, query: trimmed }
}

// ── Quick Search (for Command Palette) ────────────────────────────────

export async function quickSearch(
  query: string,
  limit = 8
): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return []

  const result = await globalSearch({ query, limit })
  return result.results
}

// ── Trending Communities & Events ─────────────────────────────────────

export async function getTrending(): Promise<TrendingItem[]> {
  const communities = await sql(
    `SELECT
       'community' AS type,
       c.id::text,
       c.name AS title,
       COALESCE(c.location_name, '') AS subtitle,
       c.slug,
       '/communities/' || c.slug AS href,
       c.cover_image_url AS image_url,
       c.member_count AS metric
     FROM communities c
     WHERE c.visibility = 'public'
     ORDER BY c.member_count DESC
     LIMIT 4`
  )

  const events = await sql(
    `SELECT
       'event' AS type,
       e.id::text,
       e.title,
       COALESCE(e.location_name, e.event_type) AS subtitle,
       e.slug,
       '/events/' || e.slug AS href,
       NULL AS image_url,
       e.rsvp_count AS metric
     FROM events e
     JOIN communities c ON c.id = e.community_id
     WHERE e.status = 'published'
       AND c.visibility = 'public'
       AND e.start_time > now()
     ORDER BY e.rsvp_count DESC
     LIMIT 4`
  )

  const items: TrendingItem[] = [
    ...communities.map((r) => ({
      type: "community" as const,
      id: r.id,
      title: r.title,
      subtitle: r.subtitle,
      slug: r.slug,
      href: r.href,
      imageUrl: r.image_url,
      metric: parseInt(r.metric) || 0,
      metricLabel: "members",
    })),
    ...events.map((r) => ({
      type: "event" as const,
      id: r.id,
      title: r.title,
      subtitle: r.subtitle,
      slug: r.slug,
      href: r.href,
      imageUrl: r.image_url,
      metric: parseInt(r.metric) || 0,
      metricLabel: "RSVPs",
    })),
  ]

  return items.sort((a, b) => b.metric - a.metric).slice(0, 6)
}

// ── Nearby Search ─────────────────────────────────────────────────────

export async function getNearby(
  lat: number,
  lng: number,
  radiusKm = 50,
  limit = 12
): Promise<NearbyItem[]> {
  // Haversine distance in km
  const haversine = `(6371 * acos(LEAST(1.0, cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2)) + sin(radians($1)) * sin(radians(latitude)))))`

  const communities = await sql(
    `SELECT
       'community' AS type,
       c.id::text,
       c.name AS title,
       COALESCE(c.location_name, '') AS subtitle,
       c.slug,
       '/communities/' || c.slug AS href,
       c.cover_image_url AS image_url,
       c.latitude,
       c.longitude,
       ${haversine} AS distance_km
     FROM communities c
     WHERE c.visibility = 'public'
       AND c.latitude IS NOT NULL
       AND c.longitude IS NOT NULL
       AND ${haversine} < $3
     ORDER BY distance_km ASC
     LIMIT $4`,
    [lat, lng, radiusKm, limit]
  )

  const events = await sql(
    `SELECT
       'event' AS type,
       e.id::text,
       e.title,
       COALESCE(e.location_name, '') AS subtitle,
       e.slug,
       '/events/' || e.slug AS href,
       NULL AS image_url,
       e.latitude,
       e.longitude,
       ${haversine.replace(/c\./g, "e.")} AS distance_km
     FROM events e
     JOIN communities cm ON cm.id = e.community_id
     WHERE e.status = 'published'
       AND cm.visibility = 'public'
       AND e.latitude IS NOT NULL
       AND e.longitude IS NOT NULL
       AND e.start_time > now()
       AND ${haversine.replace(/c\./g, "e.")} < $3
     ORDER BY distance_km ASC
     LIMIT $4`,
    [lat, lng, radiusKm, limit]
  )

  const items: NearbyItem[] = [
    ...communities.map((r) => ({
      type: "community" as const,
      id: r.id,
      title: r.title,
      subtitle: r.subtitle,
      slug: r.slug,
      href: r.href,
      imageUrl: r.image_url,
      latitude: parseFloat(r.latitude),
      longitude: parseFloat(r.longitude),
      distanceKm: parseFloat(r.distance_km) || 0,
    })),
    ...events.map((r) => ({
      type: "event" as const,
      id: r.id,
      title: r.title,
      subtitle: r.subtitle,
      slug: r.slug,
      href: r.href,
      imageUrl: r.image_url,
      latitude: parseFloat(r.latitude),
      longitude: parseFloat(r.longitude),
      distanceKm: parseFloat(r.distance_km) || 0,
    })),
  ]

  return items.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, limit)
}

// ── Explore Map Markers ───────────────────────────────────────────────

export async function getExploreMapMarkers(opts?: {
  type?: SearchResultType | "all"
  bounds?: {
    neLat: number
    neLng: number
    swLat: number
    swLng: number
  }
}): Promise<ExploreMapMarker[]> {
  const markers: ExploreMapMarker[] = []
  const typeFilter = opts?.type === "all" ? null : opts?.type
  const bounds = opts?.bounds

  const boundsFilter = (latCol: string, lngCol: string) =>
    bounds
      ? `AND ${latCol} BETWEEN $1 AND $2 AND ${lngCol} BETWEEN $3 AND $4`
      : ""

  const boundsParams = bounds
    ? [bounds.swLat, bounds.neLat, bounds.swLng, bounds.neLng]
    : []

  if (!typeFilter || typeFilter === "community") {
    // Debug: Check total communities vs ones with coordinates
    const countAll = await sql(`SELECT COUNT(*) as cnt FROM communities WHERE visibility = 'public'`)
    const countWithCoords = await sql(`SELECT COUNT(*) as cnt FROM communities WHERE visibility = 'public' AND latitude IS NOT NULL AND longitude IS NOT NULL`)
    console.log("[v0] Communities - total:", countAll[0]?.cnt, "with coords:", countWithCoords[0]?.cnt)
    
    const rows = await sql(
      `SELECT c.id::text, c.name AS title, COALESCE(c.location_name, '') AS subtitle,
              c.slug, c.latitude, c.longitude
       FROM communities c
       WHERE c.visibility = 'public' AND c.latitude IS NOT NULL AND c.longitude IS NOT NULL
       ${boundsFilter("c.latitude", "c.longitude")}
       LIMIT 100`,
      boundsParams
    )
    markers.push(
      ...rows.map((r) => ({
        id: r.id,
        type: "community" as const,
        title: r.title,
        subtitle: r.subtitle,
        href: `/communities/${r.slug}`,
        latitude: parseFloat(r.latitude),
        longitude: parseFloat(r.longitude),
      }))
    )
  }

  if (!typeFilter || typeFilter === "event") {
    const rows = await sql(
      `SELECT e.id::text, e.title, COALESCE(e.location_name, '') AS subtitle,
              e.slug, e.latitude, e.longitude
       FROM events e
       JOIN communities c ON c.id = e.community_id
       WHERE e.status = 'published' AND c.visibility = 'public'
         AND e.latitude IS NOT NULL AND e.longitude IS NOT NULL
         AND e.start_time > now()
       ${boundsFilter("e.latitude", "e.longitude")}
       ORDER BY e.start_time ASC
       LIMIT 100`,
      boundsParams
    )
    markers.push(
      ...rows.map((r) => ({
        id: r.id,
        type: "event" as const,
        title: r.title,
        subtitle: r.subtitle,
        href: `/events/${r.slug}`,
        latitude: parseFloat(r.latitude),
        longitude: parseFloat(r.longitude),
      }))
    )
  }

  return markers
}

// ── Upcoming Events (for home page) ───────────────────────────────────

export async function getUpcomingEvents(limit = 6) {
  const rows = await sql(
    `SELECT
       e.id, e.title, e.slug, e.event_type,
       e.start_time, e.end_time, e.timezone,
       e.location_name, e.rsvp_count, e.max_attendees,
       c.name AS community_name, c.slug AS community_slug
     FROM events e
     JOIN communities c ON c.id = e.community_id
     WHERE e.status = 'published'
       AND c.visibility = 'public'
       AND e.start_time > now()
     ORDER BY e.start_time ASC
     LIMIT $1`,
    [limit]
  )

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    eventType: r.event_type,
    startTime: r.start_time,
    endTime: r.end_time,
    timezone: r.timezone,
    locationName: r.location_name,
    rsvpCount: parseInt(r.rsvp_count) || 0,
    maxAttendees: r.max_attendees ? parseInt(r.max_attendees) : null,
    communityName: r.community_name,
    communitySlug: r.community_slug,
  }))
}
