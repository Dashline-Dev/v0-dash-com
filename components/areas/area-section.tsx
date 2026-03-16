"use client"

import Link from "next/link"
import { useRef } from "react"
import {
  MapPin,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  Users,
  Layers,
  Clock,
  Video,
  Globe,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { AreaWithMeta, AreaEvent, AreaCommunity, AreaSpace } from "@/types/area"
import { AREA_TYPE_LABELS } from "@/types/area"

// ── Helpers ──────────────────────────────────────────────────

function formatEventDate(start: string): string {
  const d = new Date(start)
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    weekday: "short",
  })
}

function formatEventTime(start: string, tz?: string): string {
  const d = new Date(start)
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

// ── Event card ───────────────────────────────────────────────

function EventCard({ event }: { event: AreaEvent }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex-shrink-0 w-56 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all overflow-hidden"
    >
      <div className="p-3.5 flex flex-col gap-2 h-full">
        <div>
          <p className="text-[10px] font-medium text-primary uppercase tracking-wider mb-1">
            {formatEventDate(event.start_time)}
          </p>
          <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h4>
        </div>
        <div className="flex flex-col gap-1 text-xs text-muted-foreground mt-auto">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 shrink-0" />
            {formatEventTime(event.start_time)}
          </span>
          {event.location_name ? (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{event.location_name}</span>
            </span>
          ) : event.virtual_link ? (
            <span className="flex items-center gap-1">
              <Video className="w-3 h-3 shrink-0" />
              Online
            </span>
          ) : null}
          <span className="text-[11px] text-muted-foreground/70 truncate">{event.community_name}</span>
        </div>
      </div>
    </Link>
  )
}

// ── Community card ───────────────────────────────────────────

function CommunityCard({ community }: { community: AreaCommunity }) {
  return (
    <Link
      href={`/communities/${community.slug}`}
      className="group flex-shrink-0 w-56 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all overflow-hidden"
    >
      {community.cover_image_url ? (
        <div className="h-24 overflow-hidden bg-muted">
          <img
            src={community.cover_image_url}
            alt={community.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="h-24 bg-primary/5 flex items-center justify-center">
          <Users className="w-8 h-8 text-primary/30" />
        </div>
      )}
      <div className="p-3">
        <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors">
          {community.name}
        </h4>
        {community.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
            {community.description}
          </p>
        )}
        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
          <Users className="w-3 h-3" />
          {community.member_count.toLocaleString()} members
        </div>
      </div>
    </Link>
  )
}

// ── Space card ───────────────────────────────────────────────

function SpaceCard({ space }: { space: AreaSpace }) {
  return (
    <Link
      href={`/spaces/${space.slug}`}
      className="group flex-shrink-0 w-56 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all overflow-hidden"
    >
      {space.cover_image_url ? (
        <div className="h-24 overflow-hidden bg-muted">
          <img
            src={space.cover_image_url}
            alt={space.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="h-24 bg-accent flex items-center justify-center">
          <Layers className="w-8 h-8 text-muted-foreground/30" />
        </div>
      )}
      <div className="p-3">
        <h4 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {space.name}
        </h4>
        {space.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
            {space.description}
          </p>
        )}
        {space.community_name && (
          <p className="text-[11px] text-muted-foreground/70 mt-1.5 truncate">
            {space.community_name}
          </p>
        )}
      </div>
    </Link>
  )
}

// ── Horizontal carousel ──────────────────────────────────────

interface CarouselProps<T> {
  items: T[]
  renderItem: (item: T) => React.ReactNode
  label: string
  icon: React.ReactNode
  viewMoreHref: string
  viewMoreLabel?: string
  total: number
}

function Carousel<T>({
  items,
  renderItem,
  label,
  icon,
  viewMoreHref,
  total,
}: CarouselProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(dir: "left" | "right") {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === "right" ? 240 : -240, behavior: "smooth" })
  }

  if (items.length === 0) return null

  return (
    <div className="space-y-2">
      {/* Row header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <span className="text-muted-foreground">{icon}</span>
          {label}
          <span className="text-xs font-normal text-muted-foreground ml-1">{total}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => scroll("left")}
            className="p-1 rounded-md hover:bg-accent text-muted-foreground transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            className="p-1 rounded-md hover:bg-accent text-muted-foreground transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {total > items.length && (
            <Link
              href={viewMoreHref}
              className="text-xs text-primary hover:underline flex items-center gap-0.5 ml-1"
            >
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((item, i) => (
          <div key={i}>{renderItem(item)}</div>
        ))}

        {/* "View more" card at end */}
        {total > items.length && (
          <Link
            href={viewMoreHref}
            className="flex-shrink-0 w-40 rounded-xl border border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-2 p-4 text-center hover:border-primary/40 hover:bg-accent/50 transition-all"
          >
            <span className="text-xs font-medium text-muted-foreground">
              +{total - items.length} more
            </span>
            <span className="text-xs text-primary">View all</span>
          </Link>
        )}
      </div>
    </div>
  )
}

// ── Main AreaSection ─────────────────────────────────────────

interface AreaSectionProps {
  area: AreaWithMeta
  events: AreaEvent[]
  eventTotal: number
  communities: AreaCommunity[]
  spaces: AreaSpace[]
}

export function AreaSection({
  area,
  events,
  eventTotal,
  communities,
  spaces,
}: AreaSectionProps) {
  const areaHref = `/areas/${area.slug}`

  return (
    <section className="space-y-5">
      {/* Area header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={areaHref}
                className="text-xl font-bold text-foreground hover:text-primary transition-colors"
              >
                {area.name}
              </Link>
              <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
                {AREA_TYPE_LABELS[area.type] ?? area.type}
              </span>
              {area.parent_name && (
                <span className="text-xs text-muted-foreground">
                  {area.parent_name}
                </span>
              )}
            </div>
            {area.description && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                {area.description}
              </p>
            )}
          </div>
        </div>
        <Link
          href={areaHref}
          className="text-sm text-primary hover:underline shrink-0 flex items-center gap-1 mt-1"
        >
          View area <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Carousels */}
      <div className="space-y-6 pl-12">
        <Carousel
          items={events}
          renderItem={(e) => <EventCard event={e} />}
          label="Events"
          icon={<CalendarDays className="w-4 h-4" />}
          viewMoreHref={`${areaHref}?tab=events`}
          total={eventTotal}
        />

        <Carousel
          items={communities}
          renderItem={(c) => <CommunityCard community={c} />}
          label="Communities"
          icon={<Users className="w-4 h-4" />}
          viewMoreHref={`${areaHref}?tab=communities`}
          total={communities.length < 8 ? communities.length : area.community_count}
        />

        {spaces.length > 0 && (
          <Carousel
            items={spaces}
            renderItem={(s) => <SpaceCard space={s} />}
            label="Spaces"
            icon={<Layers className="w-4 h-4" />}
            viewMoreHref={`${areaHref}?tab=spaces`}
            total={spaces.length}
          />
        )}
      </div>

      {/* Divider */}
      <div className="border-b border-border" />
    </section>
  )
}
