"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import {
  Map as GMap,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps"
import { MapPin, Users, CalendarDays } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const COLORS = [
  { fill: "#10b981", stroke: "#059669" },
  { fill: "#8b5cf6", stroke: "#7c3aed" },
  { fill: "#f59e0b", stroke: "#d97706" },
  { fill: "#ec4899", stroke: "#db2777" },
  { fill: "#06b6d4", stroke: "#0891b2" },
  { fill: "#ef4444", stroke: "#dc2626" },
]

/* ------------------------------------------------------------------ */
/*  Helper: deduplicate an array by a key fn (avoids native Map)       */
/* ------------------------------------------------------------------ */

function dedup<T>(arr: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>()
  return arr.filter((item) => {
    const k = keyFn(item)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

/* ------------------------------------------------------------------ */
/*  Rectangle overlay (fallback when no place_id)                      */
/* ------------------------------------------------------------------ */

function RectOverlay({
  n,
  idx,
}: {
  n: NeighborhoodOverlay
  idx: number
}) {
  const map = useMap()
  const ref = useRef<google.maps.Rectangle | null>(null)
  const c = COLORS[idx % COLORS.length]

  useEffect(() => {
    if (
      !map ||
      typeof google === "undefined" ||
      n.bounds_ne_lat == null ||
      n.bounds_ne_lng == null ||
      n.bounds_sw_lat == null ||
      n.bounds_sw_lng == null
    )
      return

    try {
      const b = new google.maps.LatLngBounds(
        { lat: n.bounds_sw_lat, lng: n.bounds_sw_lng },
        { lat: n.bounds_ne_lat, lng: n.bounds_ne_lng }
      )
      const rect = new google.maps.Rectangle({
        bounds: b,
        map,
        strokeColor: c.stroke,
        strokeOpacity: 0.85,
        strokeWeight: 2.5,
        fillColor: c.fill,
        fillOpacity: 0.12,
        clickable: false,
        zIndex: 1,
      })
      ref.current = rect
    } catch {
      /* not ready */
    }

    return () => {
      ref.current?.setMap(null)
      ref.current = null
    }
  }, [map, n, c])

  return null
}

/* ------------------------------------------------------------------ */
/*  FeatureLayer styler (Google-verified boundaries via place_id)       */
/* ------------------------------------------------------------------ */

function BoundaryStyler({
  neighborhoods,
  areaPlaceId,
}: {
  neighborhoods: NeighborhoodOverlay[]
  areaPlaceId?: string | null
}) {
  const map = useMap()
  const done = useRef(false)

  useEffect(() => {
    if (!map || done.current) return
    if (typeof google === "undefined" || !google.maps) return

    const lookup: Record<string, { fill: string; stroke: string }> = {}
    neighborhoods.forEach((n, i) => {
      if (n.place_id) {
        lookup[n.place_id] = COLORS[i % COLORS.length]
      }
    })

    if (Object.keys(lookup).length === 0 && !areaPlaceId) return

    const m = map as unknown as Record<string, unknown>
    if (typeof m.getFeatureLayer !== "function") return

    try {
      const layer = (m.getFeatureLayer as (t: string) => google.maps.FeatureLayer)(
        "LOCALITY"
      )
      if (!layer) return
      layer.style = (p: { feature: { placeId: string } }) => {
        const d = lookup[p.feature.placeId]
        if (d)
          return {
            fillColor: d.fill,
            fillOpacity: 0.15,
            strokeColor: d.stroke,
            strokeOpacity: 0.8,
            strokeWeight: 2.5,
          }
        if (p.feature.placeId === areaPlaceId)
          return {
            fillColor: "#6366f1",
            fillOpacity: 0.04,
            strokeColor: "#6366f1",
            strokeOpacity: 0.5,
            strokeWeight: 2,
          }
        return null
      }
      done.current = true
    } catch {
      /* layer unavailable */
    }
  }, [map, neighborhoods, areaPlaceId])

  return null
}

/* ------------------------------------------------------------------ */
/*  Fit-bounds helper                                                  */
/* ------------------------------------------------------------------ */

function FitBounds({
  bounds,
}: {
  bounds: { ne: { lat: number; lng: number }; sw: { lat: number; lng: number } }
}) {
  const map = useMap()
  useEffect(() => {
    if (!map || typeof google === "undefined") return
    try {
      map.fitBounds(
        new google.maps.LatLngBounds(
          { lat: bounds.sw.lat, lng: bounds.sw.lng },
          { lat: bounds.ne.lat, lng: bounds.ne.lng }
        ),
        40
      )
    } catch {
      /* not ready */
    }
  }, [map, bounds])
  return null
}

/* ------------------------------------------------------------------ */
/*  AreaMap                                                             */
/* ------------------------------------------------------------------ */

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
  const [selComm, setSelComm] = useState<CommunityMarker | null>(null)
  const [selEvt, setSelEvt] = useState<EventMarker | null>(null)

  const onComm = useCallback((c: CommunityMarker) => {
    setSelEvt(null)
    setSelComm(c)
  }, [])

  const onEvt = useCallback((e: EventMarker) => {
    setSelComm(null)
    setSelEvt(e)
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
        </div>
      </div>
    )
  }

  const uComms = dedup(communities, (c) => c.id)
  const uEvts = dedup(events, (e) => e.id)
  const withPlaceId = neighborhoods.filter((n) => n.place_id)
  const withBounds = neighborhoods.filter(
    (n) =>
      !n.place_id &&
      n.bounds_ne_lat != null &&
      n.bounds_sw_lat != null &&
      n.bounds_ne_lng != null &&
      n.bounds_sw_lng != null
  )
  const withLabel = neighborhoods.filter(
    (n) => n.bounds_ne_lat != null && n.bounds_sw_lat != null
  )

  return (
    <div
      className={cn("rounded-xl overflow-hidden border border-border", className)}
      style={{ height }}
    >
      <GMap
        defaultCenter={center}
        defaultZoom={zoom}
        mapId={mapId || undefined}
        gestureHandling="greedy"
        disableDefaultUI={false}
        zoomControl
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl
        style={{ width: "100%", height: "100%" }}
      >
        {/* Google-verified boundaries */}
        {mapId && withPlaceId.length > 0 && (
          <BoundaryStyler
            neighborhoods={withPlaceId}
            areaPlaceId={areaPlaceId}
          />
        )}

        {/* Rectangle fallbacks */}
        {withBounds.map((n, i) => (
          <RectOverlay key={`r-${n.id}`} n={n} idx={i} />
        ))}

        {/* Neighborhood labels */}
        {withLabel.map((n, i) => {
          const lat = ((n.bounds_ne_lat ?? 0) + (n.bounds_sw_lat ?? 0)) / 2
          const lng = ((n.bounds_ne_lng ?? 0) + (n.bounds_sw_lng ?? 0)) / 2
          const col = COLORS[i % COLORS.length]
          return (
            <AdvancedMarker key={`nl-${n.id}`} position={{ lat, lng }} zIndex={5}>
              <Link href={`/areas/${n.slug}`}>
                <div
                  className="cursor-pointer transition-transform hover:scale-105"
                  style={{
                    background: col.stroke,
                    color: "white",
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    boxShadow: "0 2px 6px rgba(0,0,0,.25)",
                  }}
                >
                  {n.name}
                  <span style={{ marginLeft: 4, opacity: 0.7, fontSize: 10 }}>
                    {n.community_count}c {n.event_count}e
                  </span>
                </div>
              </Link>
            </AdvancedMarker>
          )
        })}

        {/* Community markers */}
        {uComms.map((c) => (
          <AdvancedMarker
            key={`c-${c.id}`}
            position={{ lat: c.lat, lng: c.lng }}
            onClick={() => onComm(c)}
          >
            <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-md flex items-center justify-center">
              <Users className="w-3 h-3 text-white" />
            </div>
          </AdvancedMarker>
        ))}

        {/* Event markers */}
        {uEvts.map((e) => (
          <AdvancedMarker
            key={`e-${e.id}`}
            position={{ lat: e.lat, lng: e.lng }}
            onClick={() => onEvt(e)}
          >
            <div className="w-6 h-6 rounded-full bg-orange-500 border-2 border-white shadow-md flex items-center justify-center">
              <CalendarDays className="w-3 h-3 text-white" />
            </div>
          </AdvancedMarker>
        ))}

        {/* Community info window */}
        {selComm && (
          <InfoWindow
            position={{ lat: selComm.lat, lng: selComm.lng }}
            onCloseClick={() => setSelComm(null)}
          >
            <div className="p-1 min-w-[180px]">
              <Link
                href={`/communities/${selComm.slug}`}
                className="text-sm font-semibold hover:underline"
              >
                {selComm.name}
              </Link>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Users className="w-3 h-3" />
                <span>{selComm.member_count} members</span>
              </div>
            </div>
          </InfoWindow>
        )}

        {/* Event info window */}
        {selEvt && (
          <InfoWindow
            position={{ lat: selEvt.lat, lng: selEvt.lng }}
            onCloseClick={() => setSelEvt(null)}
          >
            <div className="p-1 min-w-[180px]">
              <Link
                href={`/events/${selEvt.slug}`}
                className="text-sm font-semibold hover:underline"
              >
                {selEvt.title}
              </Link>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <CalendarDays className="w-3 h-3" />
                <span>
                  {new Date(selEvt.start_time).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selEvt.community_name}
              </p>
            </div>
          </InfoWindow>
        )}

        {bounds && <FitBounds bounds={bounds} />}
      </GMap>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Legend                                                              */
/* ------------------------------------------------------------------ */

export function MapLegend({ showNeighborhoods = false }: { showNeighborhoods?: boolean }) {
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
