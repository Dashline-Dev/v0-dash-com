"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import {
  Map as GoogleMap,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps"
import { MapPin, Users, CalendarDays } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

// ── Map Types ──────────────────────────────────────────────

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

// ── FeatureLayer Boundary Styler ────────────────────────────
// Uses Google's Data-Driven Styling to render REAL Google-verified
// boundary polygons for neighborhoods and the area itself.
// Requires a Map ID with LOCALITY feature layer enabled in Cloud Console.

function FeatureLayerStyler({
  neighborhoods,
  areaPlaceId,
}: {
  neighborhoods: NeighborhoodOverlay[]
  areaPlaceId?: string | null
}) {
  const map = useMap()
  const appliedRef = useRef(false)

  useEffect(() => {
    if (!map || appliedRef.current) return
    if (typeof google === "undefined" || !google.maps) return

    // Collect all neighborhood place IDs and build color lookup
    const neighborhoodPlaceIds: Record<string, { fill: string; stroke: string; name: string }> = {}
    neighborhoods.forEach((n, i) => {
      if (n.place_id) {
        const color = NEIGHBORHOOD_COLORS[i % NEIGHBORHOOD_COLORS.length]
        neighborhoodPlaceIds[n.place_id] = {
          fill: color.fill,
          stroke: color.stroke,
          name: n.name,
        }
      }
    })

    const placeIdKeys = Object.keys(neighborhoodPlaceIds)
    if (placeIdKeys.length === 0 && !areaPlaceId) return

    if (allPlaceIds.size === 0) return

    // Try to apply FeatureLayer styling for Google-verified boundaries
    // This requires the Map ID to have feature layers enabled in Cloud Console
    const mapAny = map as Record<string, unknown>
    if (typeof mapAny.getFeatureLayer !== "function") {
      console.log("[v0] FeatureLayer API not available on this map instance")
      return
    }

    try {
      const localityLayer = (mapAny.getFeatureLayer as (id: string) => google.maps.FeatureLayer)("LOCALITY")
      if (localityLayer) {
        localityLayer.style = (params: { feature: { placeId: string } }) => {
          const placeId = params.feature.placeId
          const nData = neighborhoodPlaceIds[placeId]
          if (nData) {
            return {
              fillColor: nData.fill,
              fillOpacity: 0.15,
              strokeColor: nData.stroke,
              strokeOpacity: 0.8,
              strokeWeight: 2.5,
            }
          }
          if (placeId === areaPlaceId) {
            return {
              fillColor: "#6366f1",
              fillOpacity: 0.04,
              strokeColor: "#6366f1",
              strokeOpacity: 0.5,
              strokeWeight: 2,
            }
          }
          return null
        }
        appliedRef.current = true
      }
    } catch {
      // LOCALITY layer not available
    }

    try {
      const adminLayer = (mapAny.getFeatureLayer as (id: string) => google.maps.FeatureLayer)("ADMINISTRATIVE_AREA_LEVEL_2")
      if (adminLayer && areaPlaceId) {
        adminLayer.style = (params: { feature: { placeId: string } }) => {
          if (params.feature.placeId === areaPlaceId) {
            return {
              fillColor: "#6366f1",
              fillOpacity: 0.03,
              strokeColor: "#6366f1",
              strokeOpacity: 0.4,
              strokeWeight: 1.5,
            }
          }
          return null
        }
      }
    } catch {
      // Layer not available
    }

    return () => {
      appliedRef.current = false
    }
  }, [map, neighborhoods, areaPlaceId])

  return null
}

// ── Rectangle fallback for neighborhoods without place_id ───

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
    if (!map || typeof google === "undefined") return
    if (
      neighborhood.bounds_ne_lat == null ||
      neighborhood.bounds_ne_lng == null ||
      neighborhood.bounds_sw_lat == null ||
      neighborhood.bounds_sw_lng == null
    )
      return

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

// ── Main component ──────────────��───────────────────────────

export function AreaMap({
  center,
  zoom = 12,
  communities = [],
  events = [],
  neighborhoods = [],
  areaPlaceId,
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
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID

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

  // Neighborhoods with place IDs get Google-verified boundaries via FeatureLayer
  const featureLayerNeighborhoods = neighborhoods.filter((n) => n.place_id)
  // Neighborhoods without place IDs fall back to rectangle overlays
  const fallbackNeighborhoods = neighborhoods.filter(
    (n) =>
      !n.place_id &&
      n.bounds_ne_lat != null &&
      n.bounds_ne_lng != null &&
      n.bounds_sw_lat != null &&
      n.bounds_sw_lng != null
  )

  // Deduplicate communities and events by id (using Set to avoid
  // collision with GoogleMap import which shadows native Map in Turbopack)
  const seenCIds = new Set<string>()
  const uniqueCommunities = communities.filter((c) => {
    if (seenCIds.has(c.id)) return false
    seenCIds.add(c.id)
    return true
  })
  const seenEIds = new Set<string>()
  const uniqueEvents = events.filter((e) => {
    if (seenEIds.has(e.id)) return false
    seenEIds.add(e.id)
    return true
  })

  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden border border-border",
        className
      )}
      style={{ height }}
    >
      <GoogleMap
        defaultCenter={center}
        defaultZoom={zoom}
        mapId={mapId || undefined}
        gestureHandling="greedy"
        disableDefaultUI={false}
        zoomControl={true}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={true}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Google-verified boundary polygons via FeatureLayer */}
        {mapId && featureLayerNeighborhoods.length > 0 && (
          <FeatureLayerStyler
            neighborhoods={featureLayerNeighborhoods}
            areaPlaceId={areaPlaceId}
          />
        )}

        {/* Fallback rectangle overlays for neighborhoods without place_id */}
        {fallbackNeighborhoods.map((n, i) => (
          <NeighborhoodRectangle
            key={`rect-${n.id}`}
            neighborhood={n}
            colorIndex={i}
          />
        ))}

        {/* Neighborhood center labels */}
        {neighborhoods
          .filter(
            (n) =>
              (n.place_id ||
                (n.bounds_ne_lat != null && n.bounds_sw_lat != null)) &&
              n.bounds_ne_lat != null &&
              n.bounds_sw_lat != null &&
              n.bounds_ne_lng != null &&
              n.bounds_sw_lng != null
          )
          .map((n, i) => {
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
                    <span
                      style={{
                        marginLeft: "4px",
                        opacity: 0.7,
                        fontSize: "10px",
                      }}
                    >
                      {n.community_count}c {n.event_count}e
                    </span>
                  </div>
                </Link>
              </AdvancedMarker>
            )
          })}

        {/* Community markers (blue) */}
        {uniqueCommunities.map((c) => (
          <AdvancedMarker
            key={`c-${c.id}`}
            position={{ lat: c.lat, lng: c.lng }}
            onClick={() => handleCommunityClick(c)}
          >
            <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-md flex items-center justify-center">
              <Users className="w-3 h-3 text-white" />
            </div>
          </AdvancedMarker>
        ))}

        {/* Event markers (orange) */}
        {uniqueEvents.map((e) => (
          <AdvancedMarker
            key={`e-${e.id}`}
            position={{ lat: e.lat, lng: e.lng }}
            onClick={() => handleEventClick(e)}
          >
            <div className="w-6 h-6 rounded-full bg-orange-500 border-2 border-white shadow-md flex items-center justify-center">
              <CalendarDays className="w-3 h-3 text-white" />
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
      </GoogleMap>
    </div>
  )
}

// ── Map legend ───��─���────────────────────────────────────────

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
