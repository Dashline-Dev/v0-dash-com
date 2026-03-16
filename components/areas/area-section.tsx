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
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { AreaWithMeta, AreaEvent, AreaCommunity, AreaSpace } from "@/types/area"
import { AREA_TYPE_LABELS } from "@/types/area"

// ── Helpers ──────────────────────────────────────────────────

function formatEventDate(start: string): string {
  const d = new Date(start)
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

function formatEventTime(start: string): string {
  return new Date(start).toLocaleTimeString("en-US", {
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
      className="group flex-shrink-0 w-52 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
    >
      {/* Colored top strip as visual accent */}
      <div className="h-1 w-full bg-primary/60" />
      <div className="p-3.5 flex flex-col gap-2.5 flex-1">
        <p className="text-[10px] font-semibold text-primary uppercase tracking-widest">
          {formatEventDate(event.start_time)}
        </p>
        <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {event.title}
        </h4>
        <div className="flex flex-col gap-1 mt-auto text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 shrink-0" />
            {formatEventTime(event.start_time)}
          </span>
          {event.location_name && (
            <span className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3 h-3 shrink-0 text-muted-foreground/60" />
              <span className="truncate">{event.location_name}</span>
            </span>
          )}
          {event.community_name && (
            <span className="text-[11px] text-muted-foreground/60 truncate pt-0.5">
              {event.community_name}
            </span>
          )}
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
      className="group flex-shrink-0 w-52 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
    >
      {/* Cover / avatar */}
      <div className="relative h-20 bg-muted overflow-hidden">
        {community.cover_image_url ? (
          <img
            src={community.cover_image_url}
            alt={community.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
            <Users className="w-7 h-7 text-primary/25" />
          </div>
        )}
        {community.avatar_url && (
          <div className="absolute bottom-2 left-3 w-8 h-8 rounded-lg overflow-hidden border-2 border-background shadow-sm">
            <img src={community.avatar_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1">
        <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors">
          {community.name}
        </h4>
        {community.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
            {community.description}
          </p>
        )}
        <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
          <Users className="w-3 h-3" />
          <span>{community.member_count.toLocaleString()} members</span>
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
      className="group flex-shrink-0 w-52 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
    >
      <div className="relative h-20 bg-muted overflow-hidden">
        {space.cover_image_url ? (
          <img
            src={space.cover_image_url}
            alt={space.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-accent flex items-center justify-center">
            <Layers className="w-7 h-7 text-muted-foreground/25" />
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1">
        <h4 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {space.name}
        </h4>
        {space.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
            {space.description}
          </p>
        )}
        {space.community_name && (
          <p className="text-[11px] text-muted-foreground/60 mt-1 truncate">
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
  renderItem: (item: T, i: number) => React.ReactNode
  label: string
  icon: React.ReactNode
  viewMoreHref: string
  total: number
}

function Carousel<T>({ items, renderItem, label, icon, viewMoreHref, total }: CarouselProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(dir: "left" | "right") {
    scrollRef.current?.scrollBy({ left: dir === "right" ? 220 : -220, behavior: "smooth" })
  }

  if (items.length === 0) return null

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="text-muted-foreground">{icon}</span>
          {label}
          <span className="text-xs font-normal text-muted-foreground tabular-nums">{total}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => scroll("left")}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          {total > items.length && (
            <Link
              href={viewMoreHref}
              className="text-xs text-primary hover:underline flex items-center gap-0.5 ml-1.5"
            >
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-1 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((item, i) => renderItem(item, i))}
        {total > items.length && (
          <Link
            href={viewMoreHref}
            className="flex-shrink-0 w-36 rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-1.5 p-4 text-center hover:border-primary/30 hover:bg-accent/40 transition-all"
          >
            <span className="text-xs font-medium text-muted-foreground">+{total - items.length} more</span>
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

export function AreaSection({ area, events, eventTotal, communities, spaces }: AreaSectionProps) {
  const areaHref = `/areas/${area.slug}`
  const hasContent = events.length > 0 || communities.length > 0 || spaces.length > 0

  return (
    <section>
      {/* Area header */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <MapPin className="w-4.5 h-4.5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={areaHref}
                className="text-lg font-bold text-foreground hover:text-primary transition-colors leading-tight"
              >
                {area.name}
              </Link>
              <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full leading-tight">
                {AREA_TYPE_LABELS[area.type] ?? area.type}
              </span>
            </div>
            {area.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{area.description}</p>
            )}
          </div>
        </div>
        <Link
          href={areaHref}
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-0.5 shrink-0 transition-colors"
        >
          View area <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Carousels */}
      {hasContent ? (
        <div className="pl-12 space-y-5">
          <Carousel
            items={events}
            renderItem={(e, i) => <EventCard key={i} event={e} />}
            label="Events"
            icon={<CalendarDays className="w-3.5 h-3.5" />}
            viewMoreHref={`${areaHref}?tab=events`}
            total={eventTotal}
          />
          <Carousel
            items={communities}
            renderItem={(c, i) => <CommunityCard key={i} community={c} />}
            label="Communities"
            icon={<Users className="w-3.5 h-3.5" />}
            viewMoreHref={`${areaHref}?tab=communities`}
            total={communities.length < 8 ? communities.length : area.community_count}
          />
          {spaces.length > 0 && (
            <Carousel
              items={spaces}
              renderItem={(s, i) => <SpaceCard key={i} space={s} />}
              label="Spaces"
              icon={<Layers className="w-3.5 h-3.5" />}
              viewMoreHref={`${areaHref}?tab=spaces`}
              total={spaces.length}
            />
          )}
        </div>
      ) : (
        <div className="pl-12">
          <p className="text-sm text-muted-foreground italic">No events or communities yet in this area.</p>
        </div>
      )}

      <div className="border-b border-border mt-8" />
    </section>
  )
}
