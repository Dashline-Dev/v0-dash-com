"use client"

import { useState, useCallback } from "react"
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

interface AreaMapProps {
  center: { lat: number; lng: number }
  zoom?: number
  communities?: CommunityMarker[]
  events?: EventMarker[]
  bounds?: {
    ne: { lat: number; lng: number }
    sw: { lat: number; lng: number }
  } | null
  className?: string
  height?: string
}

export function AreaMap({
  center,
  zoom = 12,
  communities = [],
  events = [],
  bounds,
  className,
  height = "400px",
}: AreaMapProps) {
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityMarker | null>(null)
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
        className={cn("flex items-center justify-center rounded-xl border border-border bg-muted/30", className)}
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
    <div className={cn("rounded-xl overflow-hidden border border-border", className)} style={{ height }}>
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
            position={{ lat: selectedCommunity.lat, lng: selectedCommunity.lng }}
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
                  {new Date(selectedEvent.start_time).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
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

// Helper to fit map to bounds on mount
function FitBoundsHelper({ bounds }: { bounds: { ne: { lat: number; lng: number }; sw: { lat: number; lng: number } } }) {
  const map = useMap()

  if (map && bounds) {
    const gBounds = new google.maps.LatLngBounds(
      { lat: bounds.sw.lat, lng: bounds.sw.lng },
      { lat: bounds.ne.lat, lng: bounds.ne.lng }
    )
    map.fitBounds(gBounds, { top: 40, right: 40, bottom: 40, left: 40 })
  }

  return null
}

// ── Map legend component ────────────────────────────────────

export function MapLegend() {
  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-blue-500" />
        <span>Communities</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-orange-500" />
        <span>Events</span>
      </div>
    </div>
  )
}
