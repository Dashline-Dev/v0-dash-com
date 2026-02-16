"use client"

import { useState, useCallback, useEffect } from "react"
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
  /** The place_id of the current area (city) to style its boundary */
  areaPlaceId?: string | null
  bounds?: {
    ne: { lat: number; lng: number }
    sw: { lat: number; lng: number }
  } | null
  className?: string
  height?: string
}

// ── Color palette for neighborhood boundaries ───────────────

const NEIGHBORHOOD_COLORS = [
  { fill: "#10b981", stroke: "#059669" },
  { fill: "#8b5cf6", stroke: "#7c3aed" },
  { fill: "#f59e0b", stroke: "#d97706" },
  { fill: "#ec4899", stroke: "#db2777" },
  { fill: "#06b6d4", stroke: "#0891b2" },
  { fill: "#ef4444", stroke: "#dc2626" },
]

// ── Feature Layer Styler (Google-verified boundaries) ───────

function FeatureLayerStyler({
  neighborhoods,
  areaPlaceId,
}: {
  neighborhoods: NeighborhoodOverlay[]
  areaPlaceId?: string | null
}) {
  const map = useMap()

  useEffect(() => {
    if (!map || typeof google === "undefined") return

    // Build a map of placeId -> color for neighborhoods
    const placeIdColorMap = new Map<string, { fill: string; stroke: string }>()
    neighborhoods.forEach((n, i) => {
      if (n.place_id) {
        placeIdColorMap.set(
          n.place_id,
          NEIGHBORHOOD_COLORS[i % NEIGHBORHOOD_COLORS.length]
        )
      }
    })

    const allPlaceIds = new Set<string>()
    neighborhoods.forEach((n) => {
      if (n.place_id) allPlaceIds.add(n.place_id)
    })
    if (areaPlaceId) allPlaceIds.add(areaPlaceId)

    if (allPlaceIds.size === 0) return

    // Try to style the LOCALITY feature layer
    try {
      const localityLayer = map.getFeatureLayer(
        "LOCALITY" as google.maps.FeatureType
      )

      if (localityLayer) {
        localityLayer.style = (options: { feature: { placeId: string } }) => {
          const pid = options.feature.placeId

          // Style the current city boundary
          if (areaPlaceId && pid === areaPlaceId) {
            return {
              strokeColor: "#3b82f6",
              strokeOpacity: 0.6,
              strokeWeight: 2,
              fillColor: "#3b82f6",
              fillOpacity: 0.04,
            }
          }

          // Style neighborhood boundaries
          const color = placeIdColorMap.get(pid)
          if (color) {
            return {
              strokeColor: color.stroke,
              strokeOpacity: 0.8,
              strokeWeight: 2.5,
              fillColor: color.fill,
              fillOpacity: 0.12,
            }
          }

          return null
        }
      }
    } catch {
      // FeatureLayer not available for this map configuration
    }

    // Also try ADMINISTRATIVE_AREA_LEVEL_2 for broader areas
    try {
      const adminLayer = map.getFeatureLayer(
        "ADMINISTRATIVE_AREA_LEVEL_2" as google.maps.FeatureType
      )

      if (adminLayer && areaPlaceId) {
        adminLayer.style = (options: { feature: { placeId: string } }) => {
          if (options.feature.placeId === areaPlaceId) {
            return {
              strokeColor: "#3b82f6",
              strokeOpacity: 0.5,
              strokeWeight: 2,
              fillColor: "#3b82f6",
              fillOpacity: 0.03,
            }
          }
          return null
        }
      }
    } catch {
      // Not available
    }

    return () => {
      // Cleanup styles when unmounting
      try {
        const localityLayer = map.getFeatureLayer(
          "LOCALITY" as google.maps.FeatureType
        )
        if (localityLayer) localityLayer.style = null
      } catch {
        /* noop */
      }
      try {
        const adminLayer = map.getFeatureLayer(
          "ADMINISTRATIVE_AREA_LEVEL_2" as google.maps.FeatureType
        )
        if (adminLayer) adminLayer.style = null
      } catch {
        /* noop */
      }
    }
  }, [map, neighborhoods, areaPlaceId])

  return null
}

// ── Main AreaMap component ──────────────────────────────────

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
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "area-map"}
        gestureHandling="greedy"
        disableDefaultUI={false}
        zoomControl={true}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={true}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Google-verified boundary styling */}
        <FeatureLayerStyler
          neighborhoods={neighborhoods}
          areaPlaceId={areaPlaceId}
        />

        {/* Neighborhood labels (positioned at center of bounds) */}
        {neighborhoods.map((n, i) => {
          if (
            !n.bounds_ne_lat ||
            !n.bounds_sw_lat ||
            !n.bounds_ne_lng ||
            !n.bounds_sw_lng
          )
            return null
          const centerLat = (n.bounds_ne_lat + n.bounds_sw_lat) / 2
          const centerLng = (n.bounds_ne_lng + n.bounds_sw_lng) / 2
          const color =
            NEIGHBORHOOD_COLORS[i % NEIGHBORHOOD_COLORS.length]

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
                </div>
              </Link>
            </AdvancedMarker>
          )
        })}

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
