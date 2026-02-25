"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { APIProvider, Map as GoogleMapComponent, AdvancedMarker, InfoWindow, useMap } from "@vis.gl/react-google-maps"
import Link from "next/link"
import { Users, CalendarDays, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/* ── Color palette for neighborhood overlays ─────────────── */

const COLORS = [
  { fill: "#3b82f680", stroke: "#3b82f6" },
  { fill: "#f59e0b80", stroke: "#f59e0b" },
  { fill: "#10b98180", stroke: "#10b981" },
  { fill: "#ef444480", stroke: "#ef4444" },
  { fill: "#8b5cf680", stroke: "#8b5cf6" },
  { fill: "#ec489980", stroke: "#ec4899" },
]

/* ── Types ───────────────────────────────────────────────── */

export interface MapCommunity {
  id: string; name: string; slug: string; lat: number; lng: number; member_count?: number; category?: string
}
export interface MapEvent {
  id: string; title: string; slug: string; lat: number; lng: number; start_time: string; event_type?: string
}
export interface MapNeighborhood {
  id: string; name: string; bounds_ne_lat?: number; bounds_ne_lng?: number; bounds_sw_lat?: number; bounds_sw_lng?: number
}
export interface AreaMapProps {
  communities?: MapCommunity[]
  events?: MapEvent[]
  neighborhoods?: MapNeighborhood[]
  areaPlaceId?: string
  bounds?: { north: number; south: number; east: number; west: number }
  center?: { lat: number; lng: number }
  zoom?: number
  height?: string
  className?: string
}

/* ── Dedup helper (uses Set, NOT native Map, to avoid Turbopack collision) ── */

function dedupById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

/* ── Neighborhood rectangle sub-component ────────────────── */

function NeighborhoodRect({
  n, idx, onClick,
}: {
  n: MapNeighborhood; idx: number; onClick: (n: MapNeighborhood) => void
}) {
  const map = useMap()
  const rectRef = useRef<google.maps.Rectangle | null>(null)
  const color = COLORS[idx % COLORS.length]

  useEffect(() => {
    if (!map || typeof google === "undefined" || !n.bounds_ne_lat || !n.bounds_ne_lng || !n.bounds_sw_lat || !n.bounds_sw_lng) return

    const rect = new google.maps.Rectangle({
      bounds: {
        north: n.bounds_ne_lat,
        east: n.bounds_ne_lng,
        south: n.bounds_sw_lat,
        west: n.bounds_sw_lng,
      },
      fillColor: color.fill,
      fillOpacity: 0.15,
      strokeColor: color.stroke,
      strokeOpacity: 0.5,
      strokeWeight: 2,
      map,
      clickable: true,
    })

    rect.addListener("click", () => onClick(n))
    rectRef.current = rect

    return () => {
      rect.setMap(null)
      rectRef.current = null
    }
  }, [map, n, idx, color, onClick])

  return null
}

/* ── Map legend ──────────────────────────────────────────── */

export function MapLegend({ neighborhoods }: { neighborhoods?: MapNeighborhood[] }) {
  if (!neighborhoods || neighborhoods.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {neighborhoods.map((n, i) => (
        <div key={n.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-3 h-3 rounded-sm border" style={{ backgroundColor: COLORS[i % COLORS.length].fill, borderColor: COLORS[i % COLORS.length].stroke }} />
          {n.name}
        </div>
      ))}
    </div>
  )
}

/* ── Main AreaMap component ──────────────────────────────── */

export function AreaMap({
  communities = [],
  events = [],
  neighborhoods = [],
  bounds,
  center: centerProp,
  zoom: zoomProp,
  height = "360px",
  className,
}: AreaMapProps) {
  const [selectedCommunity, setSelectedCommunity] = useState<MapCommunity | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<MapEvent | null>(null)
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<MapNeighborhood | null>(null)

  // Helper to check for finite numbers
  const isFiniteCoord = (v: number | undefined | null): v is number =>
    v != null && Number.isFinite(v)

  const uniqueC = dedupById(communities).filter((c) => isFiniteCoord(c.lat) && isFiniteCoord(c.lng))
  const uniqueE = dedupById(events).filter((e) => isFiniteCoord(e.lat) && isFiniteCoord(e.lng))

  const handleNeighborhoodClick = useCallback((n: MapNeighborhood) => {
    setSelectedNeighborhood(n)
    setSelectedCommunity(null)
    setSelectedEvent(null)
  }, [])

  // Compute center from prop > bounds > first marker > fallback
  const fallback = { lat: 40.7128, lng: -74.006 }
  let center = fallback
  let zoom = zoomProp ?? 12

  if (centerProp && isFiniteCoord(centerProp.lat) && isFiniteCoord(centerProp.lng)) {
    center = centerProp
  } else if (bounds && isFiniteCoord(bounds.north) && isFiniteCoord(bounds.south) && isFiniteCoord(bounds.east) && isFiniteCoord(bounds.west)) {
    center = { lat: (bounds.north + bounds.south) / 2, lng: (bounds.east + bounds.west) / 2 }
  } else if (uniqueC.length > 0 && isFiniteCoord(uniqueC[0].lat) && isFiniteCoord(uniqueC[0].lng)) {
    center = { lat: uniqueC[0].lat, lng: uniqueC[0].lng }
  } else if (uniqueE.length > 0 && isFiniteCoord(uniqueE[0].lat) && isFiniteCoord(uniqueE[0].lng)) {
    center = { lat: uniqueE[0].lat, lng: uniqueE[0].lng }
  }

  console.log("[v0] AreaMap center:", JSON.stringify(center), "zoom:", zoom, "centerProp:", JSON.stringify(centerProp), "bounds:", JSON.stringify(bounds))

  return (
    <div className={cn("rounded-xl overflow-hidden border border-border", className)} style={{ height }}>
      <GoogleMapComponent
        defaultCenter={center}
        defaultZoom={zoom}
        gestureHandling="cooperative"
        disableDefaultUI
        zoomControl
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl
        style={{ width: "100%", height: "100%" }}
      >
        {/* Neighborhood rectangles */}
        {neighborhoods.map((n, i) => (
          <NeighborhoodRect key={`nr-${n.id}`} n={n} idx={i} onClick={handleNeighborhoodClick} />
        ))}

        {/* Community markers */}
        {uniqueC.map((c) => (
          <AdvancedMarker
            key={`cm-${c.id}`}
            position={{ lat: c.lat, lng: c.lng }}
            onClick={() => { setSelectedCommunity(c); setSelectedEvent(null); setSelectedNeighborhood(null) }}
          >
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md border-2 border-background">
              <Users className="w-4 h-4" />
            </div>
          </AdvancedMarker>
        ))}

        {/* Event markers */}
        {uniqueE.map((e) => (
          <AdvancedMarker
            key={`em-${e.id}`}
            position={{ lat: e.lat, lng: e.lng }}
            onClick={() => { setSelectedEvent(e); setSelectedCommunity(null); setSelectedNeighborhood(null) }}
          >
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md border-2 border-background">
              <CalendarDays className="w-4 h-4" />
            </div>
          </AdvancedMarker>
        ))}

        {/* Community info window */}
        {selectedCommunity && (
          <InfoWindow
            position={{ lat: selectedCommunity.lat, lng: selectedCommunity.lng }}
            onCloseClick={() => setSelectedCommunity(null)}
          >
            <Link href={`/communities/${selectedCommunity.slug}`} className="block p-1 no-underline text-foreground">
              <p className="font-semibold text-sm">{selectedCommunity.name}</p>
              <div className="flex items-center gap-2 mt-1">
                {selectedCommunity.category && <Badge variant="secondary" className="text-[10px]">{selectedCommunity.category}</Badge>}
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <Users className="w-3 h-3" /> {selectedCommunity.member_count ?? 0}
                </span>
              </div>
            </Link>
          </InfoWindow>
        )}

        {/* Event info window */}
        {selectedEvent && (
          <InfoWindow
            position={{ lat: selectedEvent.lat, lng: selectedEvent.lng }}
            onCloseClick={() => setSelectedEvent(null)}
          >
            <Link href={`/events/${selectedEvent.slug}`} className="block p-1 no-underline text-foreground">
              <p className="font-semibold text-sm">{selectedEvent.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(selectedEvent.start_time).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </p>
            </Link>
          </InfoWindow>
        )}

        {/* Neighborhood info window */}
        {selectedNeighborhood && selectedNeighborhood.bounds_ne_lat && selectedNeighborhood.bounds_sw_lat && selectedNeighborhood.bounds_ne_lng && selectedNeighborhood.bounds_sw_lng && (
          <InfoWindow
            position={{
              lat: (selectedNeighborhood.bounds_ne_lat + selectedNeighborhood.bounds_sw_lat) / 2,
              lng: (selectedNeighborhood.bounds_ne_lng + selectedNeighborhood.bounds_sw_lng) / 2,
            }}
            onCloseClick={() => setSelectedNeighborhood(null)}
          >
            <div className="p-1">
              <p className="font-semibold text-sm flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {selectedNeighborhood.name}
              </p>
            </div>
          </InfoWindow>
        )}
      </GoogleMapComponent>
    </div>
  )
}
