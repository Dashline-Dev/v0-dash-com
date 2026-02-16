"use client"

import { useState } from "react"
import Link from "next/link"
import {
  MapPin,
  Users,
  CalendarDays,
  Clock,
  ChevronRight,
  Video,
  Monitor,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AreaMap, MapLegend } from "@/components/maps/area-map"
import { GoogleMapsProvider } from "@/components/maps/google-maps-provider"
import type { AreaWithMeta, AreaNeighborhood, AreaCommunity, AreaEvent } from "@/types/area"
import { AREA_TYPE_LABELS, areaBoundsToMapBounds } from "@/types/area"
import { cn } from "@/lib/utils"

const TYPE_ICON_MAP: Record<string, React.ElementType> = {
  in_person: MapPin,
  virtual: Monitor,
  hybrid: Video,
}

interface AreaDetailProps {
  area: AreaWithMeta
  neighborhoods: AreaNeighborhood[]
  communities: AreaCommunity[]
  events: AreaEvent[]
  eventsTotal: number
  mapMarkers: {
    communities: { id: string; name: string; slug: string; lat: number; lng: number; member_count: number }[]
    events: { id: string; title: string; slug: string; lat: number; lng: number; start_time: string; community_name: string }[]
  }
}

export function AreaDetail({
  area,
  neighborhoods,
  communities,
  events,
  eventsTotal,
  mapMarkers,
}: AreaDetailProps) {
  const bounds = areaBoundsToMapBounds(area)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        {area.parent_name && (
          <Link
            href={`/areas/${area.parent_slug}`}
            className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 mb-1"
          >
            <MapPin className="w-3 h-3" />
            {area.parent_name}
            <ChevronRight className="w-3 h-3" />
          </Link>
        )}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground text-balance">
              {area.name}
            </h1>
            {area.description && (
              <p className="text-muted-foreground mt-1 text-sm md:text-base leading-relaxed max-w-2xl">
                {area.description}
              </p>
            )}
          </div>
          <Badge
            variant="secondary"
            className={cn(
              "shrink-0 text-xs",
              area.type === "city"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
            )}
          >
            {AREA_TYPE_LABELS[area.type]}
          </Badge>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {area.community_count} {area.community_count === 1 ? "community" : "communities"}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4" />
            {eventsTotal} {eventsTotal === 1 ? "event" : "events"}
          </span>
          {area.neighborhood_count > 0 && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {area.neighborhood_count} neighborhoods
            </span>
          )}
        </div>
      </div>

      {/* Map */}
      <GoogleMapsProvider>
        <AreaMap
          center={{ lat: area.latitude, lng: area.longitude }}
          zoom={area.type === "city" ? 11 : 13}
          communities={mapMarkers.communities}
          events={mapMarkers.events}
          neighborhoods={area.type === "city" ? neighborhoods : []}
          areaPlaceId={area.place_id}
          bounds={bounds}
          height="360px"
        />
        <MapLegend showNeighborhoods={area.type === "city" && neighborhoods.length > 0} />
      </GoogleMapsProvider>

      {/* Tabs */}
      <Tabs defaultValue={neighborhoods.length > 0 ? "neighborhoods" : "events"} className="w-full">
        <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0">
          {neighborhoods.length > 0 && (
            <TabsTrigger
              value="neighborhoods"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm"
            >
              Neighborhoods
            </TabsTrigger>
          )}
          <TabsTrigger
            value="events"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm"
          >
            Events ({eventsTotal})
          </TabsTrigger>
          <TabsTrigger
            value="communities"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm"
          >
            Communities ({area.community_count})
          </TabsTrigger>
        </TabsList>

        {/* Neighborhoods */}
        {neighborhoods.length > 0 && (
          <TabsContent value="neighborhoods" className="mt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {neighborhoods.map((n) => (
                <Link
                  key={n.id}
                  href={`/areas/${n.slug}`}
                  className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-sm"
                >
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {n.name}
                    </h3>
                    {n.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{n.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span>{n.community_count} communities</span>
                      <span>{n.event_count} events</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary" />
                </Link>
              ))}
            </div>
          </TabsContent>
        )}

        {/* Events */}
        <TabsContent value="events" className="mt-5">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarDays className="w-10 h-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm font-medium text-foreground">No upcoming events</p>
              <p className="text-xs text-muted-foreground mt-1">Events from communities in this area will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <AreaEventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Communities */}
        <TabsContent value="communities" className="mt-5">
          {communities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-10 h-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm font-medium text-foreground">No communities yet</p>
              <p className="text-xs text-muted-foreground mt-1">Communities in this area will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {communities.map((c) => (
                <Link
                  key={c.id}
                  href={`/communities/${c.slug}`}
                  className="group flex gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-sm"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                    {c.cover_image_url ? (
                      <img src={c.cover_image_url} alt="" className="w-full h-full rounded-lg object-cover" />
                    ) : (
                      c.name.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {c.name}
                    </h3>
                    {c.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{c.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {c.member_count} members
                      </span>
                      {c.location_name && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{c.location_name}</span>
                        </span>
                      )}
                    </div>
                    {c.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5 overflow-hidden">
                        {c.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="px-1.5 py-0.5 bg-secondary text-muted-foreground rounded text-[10px]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ── Area Event Card ─────────────────────────────────────────

function AreaEventCard({ event }: { event: AreaEvent }) {
  const startDate = new Date(event.start_time)
  const month = startDate.toLocaleString("en-US", { month: "short", timeZone: event.timezone || "UTC" }).toUpperCase()
  const day = startDate.toLocaleDateString("en-US", { day: "numeric", timeZone: event.timezone || "UTC" })
  const time = startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: event.timezone || "UTC" })
  const Icon = TYPE_ICON_MAP[event.event_type] || CalendarDays

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-card/80"
    >
      {/* Date block */}
      <div className="flex flex-col items-center justify-center rounded-lg bg-primary/5 px-3 py-2 min-w-14 shrink-0">
        <span className="text-[10px] font-semibold tracking-wider text-primary">{month}</span>
        <span className="text-xl font-bold text-foreground leading-tight">{day}</span>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
          {event.title}
        </h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {time}
          </span>
          {event.location_name && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 shrink-0" />
              {event.location_name}
            </span>
          )}
          {event.virtual_link && !event.location_name && (
            <span className="flex items-center gap-1">
              <Video className="w-3 h-3" />
              Online
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {event.rsvp_count} going
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5">{event.community_name}</p>
      </div>
    </Link>
  )
}
