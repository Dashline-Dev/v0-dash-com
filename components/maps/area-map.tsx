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
  bounds?: {
    ne: { lat: number; lng: number }
    sw: { lat: number; lng: number }
  } | null
  className?: string
  height?: string
}

// ── Neighborhood Rectangle overlay ──────────────────────────

const NEIGHBORHOOD_COLORS = [
  { fill: "#10b981", stroke: "#059669" }, // emerald
  { fill: "#8b5cf6", stroke: "#7c3aed" }, // violet
  { fill: "#f59e0b", stroke: "#d97706" }, // amber
  { fill: "#ec4899", stroke: "#db2777" }, // pink
  { fill: "#06b6d4", stroke: "#0891b2" }, // cyan
  { fill: "#ef4444", stroke: "#dc2626" }, // red
]

function NeighborhoodRectangle({
  neighborhood,
  colorIndex,
  onClick,
}: {
  neighborhood: NeighborhoodOverlay
  colorIndex: number
  onClick: (n: NeighborhoodOverlay) => void
}) {
  const map = useMap()
  const rectRef = useRef<google.maps.Rectangle | null>(null)
  const color = NEIGHBORHOOD_COLORS[colorIndex % NEIGHBORHOOD_COLORS.length]

  useEffect(() => {
    console.log("[v0] NeighborhoodRectangle effect:", neighborhood.name, "map:", !!map, "google:", typeof google !== "undefined", "bounds:", neighborhood.bounds_ne_lat, neighborhood.bounds_sw_lat, neighborhood.bounds_ne_lng, neighborhood.bounds_sw_lng)
    if (
      !map ||
      typeof google === "undefined" ||
      !neighborhood.bounds_ne_lat ||
      !neighborhood.bounds_ne_lng ||
      !neighborhood.bounds_sw_lat ||
      !neighborhood.bounds_sw_lng
    )
      return

    try {
      const bounds = new google.maps.LatLngBounds(
        { lat: neighborhood.bounds_sw_lat, lng: neighborhood.bounds_sw_lng },
        { lat: neighborhood.bounds_ne_lat, lng: neighborhood.bounds_ne_lng }
      )

      // Create the rectangle overlay
      const rect = new google.maps.Rectangle({
        bounds,
        map,
        strokeColor: color.stroke,
        strokeOpacity: 0.85,
        strokeWeight: 2,
        fillColor: color.fill,
        fillOpacity: 0.15,
        clickable: true,
        zIndex: 1,
      })

      rect.addListener("click", () => onClick(neighborhood))
      rectRef.current = rect

      return () => {
        rect.setMap(null)
        rectRef.current = null
      }
    } catch {
      // Google Maps API not fully loaded yet
    }
  }, [map, neighborhood, color, onClick])

  // Render a centered label via AdvancedMarker (part of the library, safe)
  if (
    !neighborhood.bounds_ne_lat ||
    !neighborhood.bounds_sw_lat ||
    !neighborhood.bounds_ne_lng ||
    !neighborhood.bounds_sw_lng
  )
    return null

  const centerLat = (neighborhood.bounds_ne_lat + neighborhood.bounds_sw_lat) / 2
  const centerLng = (neighborhood.bounds_ne_lng + neighborhood.bounds_sw_lng) / 2

  return (
    <AdvancedMarker
      position={{ lat: centerLat, lng: centerLng }}
      zIndex={2}
      clickable={false}
    >
      <div
        style={{
          background: color.stroke,
          color: "white",
          padding: "3px 8px",
          borderRadius: "4px",
          fontSize: "11px",
          fontWeight: 600,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      >
        {neighborhood.name}
      </div>
    </AdvancedMarker>
  )
}

// ── Main AreaMap component ──────────────────────────────────

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
  console.log("[v0] AreaMap render - neighborhoods:", neighborhoods.length, neighborhoods.map(n => ({ name: n.name, ne: n.bounds_ne_lat, sw: n.bounds_sw_lat })))

  const [selectedCommunity, setSelectedCommunity] =
    useState<CommunityMarker | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<EventMarker | null>(null)
  const [selectedNeighborhood, setSelectedNeighborhood] =
    useState<NeighborhoodOverlay | null>(null)

  const handleCommunityClick = useCallback((community: CommunityMarker) => {
    setSelectedEvent(null)
    setSelectedNeighborhood(null)
    setSelectedCommunity(community)
  }, [])

  const handleEventClick = useCallback((event: EventMarker) => {
    setSelectedCommunity(null)
    setSelectedNeighborhood(null)
    setSelectedEvent(event)
  }, [])

  const handleNeighborhoodClick = useCallback((n: NeighborhoodOverlay) => {
    setSelectedCommunity(null)
    setSelectedEvent(null)
    setSelectedNeighborhood(n)
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
        mapId="area-map"
        gestureHandling="greedy"
        disableDefaultUI={false}
        zoomControl={true}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={true}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Neighborhood rectangles */}
        {neighborhoods.map((n, i) => (
          <NeighborhoodRectangle
            key={`n-${n.id}`}
            neighborhood={n}
            colorIndex={i}
            onClick={handleNeighborhoodClick}
          />
        ))}

        {/* Community markers (blue) */}
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

        {/* Event markers (orange) */}
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

        {/* Neighborhood info window */}
        {selectedNeighborhood &&
          selectedNeighborhood.bounds_ne_lat &&
          selectedNeighborhood.bounds_sw_lat &&
          selectedNeighborhood.bounds_ne_lng &&
          selectedNeighborhood.bounds_sw_lng && (
            <InfoWindow
              position={{
                lat:
                  (selectedNeighborhood.bounds_ne_lat +
                    selectedNeighborhood.bounds_sw_lat) /
                  2,
                lng:
                  (selectedNeighborhood.bounds_ne_lng +
                    selectedNeighborhood.bounds_sw_lng) /
                  2,
              }}
              onCloseClick={() => setSelectedNeighborhood(null)}
            >
              <div className="p-1 min-w-[180px]">
                <Link
                  href={`/areas/${selectedNeighborhood.slug}`}
                  className="text-sm font-semibold text-foreground hover:underline"
                >
                  {selectedNeighborhood.name}
                </Link>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {selectedNeighborhood.community_count} communities
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    {selectedNeighborhood.event_count} events
                  </span>
                </div>
              </div>
            </InfoWindow>
          )}

        {bounds && <FitBoundsHelper bounds={bounds} />}
      </Map>
    </div>
  )
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
      // Google Maps not ready yet
    }
  }, [map, bounds])

  return null
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
