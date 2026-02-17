"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import {
  APIProvider,
  Map as GoogleMapComponent,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps"
import { MapPin, Users, CalendarDays } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

/* ── Types ──────────────────────────────────────────────────────────── */

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
  community_slug: string
  lat: number
  lng: number
  start_time: string
}

interface NeighborhoodOverlay {
  id: string
  name: string
  slug: string
  place_id?: string | null
  community_count: number
  event_count: number
  bounds_ne_lat: number | null
  bounds_ne_lng: number | null
  bounds_sw_lat: number | null
  bounds_sw_lng: number | null
}

interface AreaMapProps {
  center: { lat: number; lng: number }
  zoom: number
  communities: CommunityMarker[]
  events: EventMarker[]
  neighborhoods?: NeighborhoodOverlay[]
  areaPlaceId?: string | null
  bounds?: {
    ne_lat: number
    ne_lng: number
    sw_lat: number
    sw_lng: number
  } | null
  height?: string
}

/* ── Colors ─────────────────────────────────────────────────────────── */

const NEIGHBORHOOD_COLORS = [
  { fill: "#6366f1", stroke: "#4f46e5" },
  { fill: "#06b6d4", stroke: "#0891b2" },
  { fill: "#10b981", stroke: "#059669" },
  { fill: "#f59e0b", stroke: "#d97706" },
  { fill: "#ef4444", stroke: "#dc2626" },
  { fill: "#8b5cf6", stroke: "#7c3aed" },
  { fill: "#ec4899", stroke: "#db2777" },
]

/* ── Dedup helper (uses Set, NOT native Map, to avoid the import
      collision with Map from @vis.gl/react-google-maps) ────────────── */

function dedup<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const k = keyFn(item)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

/* ── Neighborhood rectangle overlay ─────────────────────────────────── */

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

      const rect = new google.maps.Rectangle({
        bounds,
        map,
        strokeColor: color.stroke,
        strokeOpacity: 0.85,
        strokeWeight: 2,
        fillColor: color.fill,
        fillOpacity: 0.12,
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
      // Google Maps API not ready
    }
  }, [map, neighborhood, color, onClick])

  if (
    !neighborhood.bounds_ne_lat ||
    !neighborhood.bounds_sw_lat ||
    !neighborhood.bounds_ne_lng ||
    !neighborhood.bounds_sw_lng
  )
    return null

  const centerLat =
    (neighborhood.bounds_ne_lat + neighborhood.bounds_sw_lat) / 2
  const centerLng =
    (neighborhood.bounds_ne_lng + neighborhood.bounds_sw_lng) / 2

  return (
    <AdvancedMarker
      position={{ lat: centerLat, lng: centerLng }}
      zIndex={2}
      clickable={false}
    >
      <div
        className="pointer-events-none rounded px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm"
        style={{ background: color.stroke }}
      >
        {neighborhood.name}
      </div>
    </AdvancedMarker>
  )
}

/* ── FitBounds helper ───────────────────────────────────────────────── */

function FitBoundsHelper({
  bounds,
}: {
  bounds: { ne_lat: number; ne_lng: number; sw_lat: number; sw_lng: number }
}) {
  const map = useMap()
  const fitted = useRef(false)

  useEffect(() => {
    if (!map || fitted.current || typeof google === "undefined") return
    const b = new google.maps.LatLngBounds(
      { lat: bounds.sw_lat, lng: bounds.sw_lng },
      { lat: bounds.ne_lat, lng: bounds.ne_lng }
    )
    map.fitBounds(b, 40)
    fitted.current = true
  }, [map, bounds])

  return null
}

/* ── Main AreaMap component ─────────────────────────────────────────── */

export function AreaMap({
  center,
  zoom,
  communities,
  events,
  neighborhoods = [],
  areaPlaceId: _areaPlaceId,
  bounds,
  height = "360px",
  }: AreaMapProps) {
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || undefined
  const [selectedCommunity, setSelectedCommunity] =
    useState<CommunityMarker | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<EventMarker | null>(null)
  const [selectedNeighborhood, setSelectedNeighborhood] =
    useState<NeighborhoodOverlay | null>(null)

  const uniqueCommunities = dedup(communities, (c) => c.id)
  const uniqueEvents = dedup(events, (e) => e.id)

  const handleCommunityClick = useCallback((c: CommunityMarker) => {
    setSelectedEvent(null)
    setSelectedNeighborhood(null)
    setSelectedCommunity(c)
  }, [])

  const handleEventClick = useCallback((e: EventMarker) => {
    setSelectedCommunity(null)
    setSelectedNeighborhood(null)
    setSelectedEvent(e)
  }, [])

  const handleNeighborhoodClick = useCallback((n: NeighborhoodOverlay) => {
    setSelectedCommunity(null)
    setSelectedEvent(null)
    setSelectedNeighborhood(n)
  }, [])

  return (
    <div
      className="w-full rounded-xl overflow-hidden border border-border"
      style={{ height }}
    >
      <GoogleMapComponent
        defaultCenter={center}
        defaultZoom={zoom}
        mapId={mapId}
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

        {/* Community markers */}
        {uniqueCommunities.map((c) => (
          <AdvancedMarker
            key={`c-${c.id}`}
            position={{ lat: c.lat, lng: c.lng }}
            onClick={() => handleCommunityClick(c)}
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 border-2 border-white shadow-md">
              <Users className="w-3.5 h-3.5 text-white" />
            </div>
          </AdvancedMarker>
        ))}

        {/* Event markers */}
        {uniqueEvents.map((e) => (
          <AdvancedMarker
            key={`e-${e.id}`}
            position={{ lat: e.lat, lng: e.lng }}
            onClick={() => handleEventClick(e)}
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-500 border-2 border-white shadow-md">
              <CalendarDays className="w-3.5 h-3.5 text-white" />
            </div>
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
            <Link
              href={`/communities/${selectedCommunity.slug}`}
              className="block p-1 no-underline text-foreground"
            >
              <p className="font-semibold text-sm">
                {selectedCommunity.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedCommunity.member_count} members
              </p>
            </Link>
          </InfoWindow>
        )}

        {/* Event info window */}
        {selectedEvent && (
          <InfoWindow
            position={{
              lat: selectedEvent.lat,
              lng: selectedEvent.lng,
            }}
            onCloseClick={() => setSelectedEvent(null)}
          >
            <Link
              href={`/communities/${selectedEvent.community_slug}/events/${selectedEvent.slug}`}
              className="block p-1 no-underline text-foreground"
            >
              <p className="font-semibold text-sm">{selectedEvent.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(selectedEvent.start_time).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  }
                )}
              </p>
            </Link>
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
              <Link
                href={`/areas/${selectedNeighborhood.slug}`}
                className="block p-1 no-underline text-foreground"
              >
                <p className="font-semibold text-sm">
                  {selectedNeighborhood.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedNeighborhood.community_count} communities &middot;{" "}
                  {selectedNeighborhood.event_count} events
                </p>
              </Link>
            </InfoWindow>
          )}

        {bounds && <FitBoundsHelper bounds={bounds} />}
      </GoogleMapComponent>
    </div>
  )
}

/* ── Map legend ─────────────────────────────────────────────────────── */

export function MapLegend() {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
        Communities
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
        Events
      </span>
      <span className="flex items-center gap-1.5">
        <MapPin className="w-3 h-3" />
        Areas
      </span>
    </div>
  )
}
