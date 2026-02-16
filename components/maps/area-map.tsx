"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import {
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps"
import { MapPin, Users, CalendarDays } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

// ── Types ───────────────────────────────────────────────────

interface CommunityMarker {
  id: string
  name: string
  slug: string
  lat: number
  lng: number
  member_count: number
}

interface EventMarker {
  id: string
  title: string
  slug: string
  lat: number
  lng: number
  start_time: string
  community_name: string
}

interface NeighborhoodOverlay {
  id: string
  name: string
  slug: string
  place_id?: string | null
  bounds_ne_lat: number | null
  bounds_ne_lng: number | null
  bounds_sw_lat: number | null
  bounds_sw_lng: number | null
  community_count: number
  event_count: number
}

interface AreaMapProps {
  center: { lat: number; lng: number }
  zoom?: number
  communities?: CommunityMarker[]
  events?: EventMarker[]
  neighborhoods?: NeighborhoodOverlay[]
  areaPlaceId?: string | null
  bounds?: {
    ne: { lat: number; lng: number }
    sw: { lat: number; lng: number }
  } | null
  className?: string
  height?: string
}

// ── Neighborhood color palette ──────────────────────────────

const NEIGHBORHOOD_COLORS = [
  { fill: "#10b981", stroke: "#059669" },
  { fill: "#8b5cf6", stroke: "#7c3aed" },
  { fill: "#f59e0b", stroke: "#d97706" },
  { fill: "#ec4899", stroke: "#db2777" },
  { fill: "#06b6d4", stroke: "#0891b2" },
  { fill: "#ef4444", stroke: "#dc2626" },
]

// ── Rectangle overlay for a single neighborhood ─────────────
// Uses google.maps.Rectangle (works with ANY Map ID, no premium needed)

function NeighborhoodRectangle({
  neighborhood,
  colorIndex,
}: {
  neighborhood: NeighborhoodOverlay
  colorIndex: number
}) {
  const map = useMap()
  const rectRef = useRef<google.maps.Rectangle | null>(null)
  const color = NEIGHBORHOOD_COLORS[colorIndex % NEIGHBORHOOD_COLORS.length]

  useEffect(() => {
    if (!map) return
    if (typeof google === "undefined") return
    if (
      neighborhood.bounds_ne_lat == null ||
      neighborhood.bounds_ne_lng == null ||
      neighborhood.bounds_sw_lat == null ||
      neighborhood.bounds_sw_lng == null
    )
      return

    // Clean up any previous rectangle
    if (rectRef.current) {
      rectRef.current.setMap(null)
      rectRef.current = null
    }

    try {
      const bounds = new google.maps.LatLngBounds(
        { lat: neighborhood.bounds_sw_lat, lng: neighborhood.bounds_sw_lng },
        { lat: neighborhood.bounds_ne_lat, lng: neighborhood.bounds_ne_lng }
      )

      const rect = new google.maps.Rectangle({
        bounds,
        map,
        strokeColor: color.stroke,
        strokeOpacity: 0.85,
        strokeWeight: 2.5,
        fillColor: color.fill,
        fillOpacity: 0.12,
        clickable: false,
        zIndex: 1,
      })

      rectRef.current = rect
    } catch {
      // Google Maps API not ready
    }

    return () => {
      if (rectRef.current) {
        rectRef.current.setMap(null)
        rectRef.current = null
      }
    }
  }, [map, neighborhood, color])

  return null
}

// ── Fit bounds helper ───────────────────────────────────────

function FitBoundsHelper({
  bounds,
}: {
  bounds: { ne: { lat: number; lng: number }; sw: { lat: number; lng: number } }
}) {
  const map = useMap()

  useEffect(() => {
    if (!map || !bounds || typeof google === "undefined") return
    try {
      const gBounds = new google.maps.LatLngBounds(
        { lat: bounds.sw.lat, lng: bounds.sw.lng },
        { lat: bounds.ne.lat, lng: bounds.ne.lng }
      )
      map.fitBounds(gBounds, { top: 40, right: 40, bottom: 40, left: 40 })
    } catch {
      // not ready
    }
  }, [map, bounds])

  return null
}

// ── Main component ──────────────────────────────────────────

export function AreaMap({
  center,
  zoom = 12,
  communities = [],
  events = [],
  neighborhoods = [],
  bounds,
  className,
  height = "400px",
}: AreaMapProps) {
  const [selectedCommunity, setSelectedCommunity] =
    useState<CommunityMarker | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<EventMarker | null>(null)

  const handleCommunityClick = useCallback((community: CommunityMarker) => {
    setSelectedEvent(null)
    setSelectedCommunity(community)
  }, [])

  const handleEventClick = useCallback((event: EventMarker) => {
    setSelectedCommunity(null)
    setSelectedEvent(event)
  }, [])

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl border border-border bg-muted/30",
          className
        )}
        style={{ height }}
      >
        <div className="text-center text-muted-foreground">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Map unavailable</p>
          <p className="text-xs">Google Maps API key not configured</p>
        </div>
      </div>
    )
  }

  // Filter neighborhoods that have valid bounds for rectangle overlays
  const drawableNeighborhoods = neighborhoods.filter(
    (n) =>
      n.bounds_ne_lat != null &&
      n.bounds_ne_lng != null &&
      n.bounds_sw_lat != null &&
      n.bounds_sw_lng != null
  )

  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden border border-border",
        className
      )}
      style={{ height }}
    >
      <Map
        defaultCenter={center}
        defaultZoom={zoom}
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || undefined}
        gestureHandling="greedy"
        disableDefaultUI={false}
        zoomControl={true}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={true}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Neighborhood rectangle overlays (drawn with google.maps.Rectangle) */}
        {drawableNeighborhoods.map((n, i) => (
          <NeighborhoodRectangle
            key={`rect-${n.id}`}
            neighborhood={n}
            colorIndex={i}
          />
        ))}

        {/* Neighborhood center labels */}
        {drawableNeighborhoods.map((n, i) => {
          const centerLat =
            ((n.bounds_ne_lat ?? 0) + (n.bounds_sw_lat ?? 0)) / 2
          const centerLng =
            ((n.bounds_ne_lng ?? 0) + (n.bounds_sw_lng ?? 0)) / 2
          const color = NEIGHBORHOOD_COLORS[i % NEIGHBORHOOD_COLORS.length]

          return (
            <AdvancedMarker
              key={`n-label-${n.id}`}
              position={{ lat: centerLat, lng: centerLng }}
              zIndex={5}
            >
              <Link href={`/areas/${n.slug}`}>
                <div
                  className="cursor-pointer transition-transform hover:scale-105"
                  style={{
                    background: color.stroke,
                    color: "white",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                    border: `1px solid ${color.fill}`,
                  }}
                >
                  {n.name}
                  <span style={{ marginLeft: "4px", opacity: 0.7, fontSize: "10px" }}>
                    {n.community_count}c {n.event_count}e
                  </span>
                </div>
              </Link>
            </AdvancedMarker>
          )
        })}

        {/* Community markers (blue pins) */}
        {communities.map((c) => (
          <AdvancedMarker
            key={`c-${c.id}`}
            position={{ lat: c.lat, lng: c.lng }}
            onClick={() => handleCommunityClick(c)}
          >
            <Pin
              background="#3b82f6"
              glyphColor="#ffffff"
              borderColor="#2563eb"
            />
          </AdvancedMarker>
        ))}

        {/* Event markers (orange pins) */}
        {events.map((e) => (
          <AdvancedMarker
            key={`e-${e.id}`}
            position={{ lat: e.lat, lng: e.lng }}
            onClick={() => handleEventClick(e)}
          >
            <Pin
              background="#f97316"
              glyphColor="#ffffff"
              borderColor="#ea580c"
            />
          </AdvancedMarker>
        ))}

        {/* Community info window */}
        {selectedCommunity && (
          <InfoWindow
            position={{
              lat: selectedCommunity.lat,
              lng: selectedCommunity.lng,
            }}
            onCloseClick={() => setSelectedCommunity(null)}
          >
            <div className="p-1 min-w-[180px]">
              <Link
                href={`/communities/${selectedCommunity.slug}`}
                className="text-sm font-semibold text-foreground hover:underline"
              >
                {selectedCommunity.name}
              </Link>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Users className="w-3 h-3" />
                <span>{selectedCommunity.member_count} members</span>
              </div>
            </div>
          </InfoWindow>
        )}

        {/* Event info window */}
        {selectedEvent && (
          <InfoWindow
            position={{ lat: selectedEvent.lat, lng: selectedEvent.lng }}
            onCloseClick={() => setSelectedEvent(null)}
          >
            <div className="p-1 min-w-[180px]">
              <Link
                href={`/events/${selectedEvent.slug}`}
                className="text-sm font-semibold text-foreground hover:underline"
              >
                {selectedEvent.title}
              </Link>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <CalendarDays className="w-3 h-3" />
                <span>
                  {new Date(selectedEvent.start_time).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    }
                  )}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedEvent.community_name}
              </p>
            </div>
          </InfoWindow>
        )}

        {bounds && <FitBoundsHelper bounds={bounds} />}
      </Map>
    </div>
  )
}

// ── Map legend ──────────────────────────────────────────────

export function MapLegend({
  showNeighborhoods = false,
}: {
  showNeighborhoods?: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-2">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-blue-500" />
        <span>Communities</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-orange-500" />
        <span>Events</span>
      </div>
      {showNeighborhoods && (
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-500/30 border border-emerald-500" />
          <span>Neighborhoods</span>
        </div>
      )}
    </div>
  )
}
