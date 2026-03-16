"use client"

import { useMemo } from "react"
import { SlidersHorizontal, X } from "lucide-react"
import { FacetFilter, type FacetOption } from "@/components/ui/facet-filter"
import type { EventWithMeta } from "@/types/event"
import { EVENT_TYPE_LABELS } from "@/types/event"
import { cn } from "@/lib/utils"

export interface EventFilterState {
  type: string | null
  community: string | null
  space: string | null
  format: string | null      // "has_location" | "virtual_only" | "hybrid"
  capacity: string | null    // "limited" | "unlimited"
}

export const EMPTY_EVENT_FILTERS: EventFilterState = {
  type: null,
  community: null,
  space: null,
  format: null,
  capacity: null,
}

interface EventFiltersProps {
  events: EventWithMeta[]
  filters: EventFilterState
  onChange: (next: Partial<EventFilterState>) => void
}

export function EventFilters({ events, filters, onChange }: EventFiltersProps) {
  // Dynamically build facets only from what exists in the data

  const typeFacets = useMemo<FacetOption[]>(() => {
    const counts: Record<string, number> = {}
    for (const e of events) counts[e.event_type] = (counts[e.event_type] || 0) + 1
    return Object.entries(counts)
      .filter(([, c]) => c > 0)
      .map(([val, count]) => ({
        value: val,
        label: EVENT_TYPE_LABELS[val as keyof typeof EVENT_TYPE_LABELS] ?? val,
        count,
      }))
      .sort((a, b) => b.count - a.count)
  }, [events])

  const communityFacets = useMemo<FacetOption[]>(() => {
    const counts: Record<string, { name: string; count: number }> = {}
    for (const e of events) {
      const k = e.community_slug
      if (!counts[k]) counts[k] = { name: e.community_name, count: 0 }
      counts[k].count++
    }
    return Object.entries(counts)
      .filter(([, { count }]) => count > 0)
      .map(([slug, { name, count }]) => ({ value: slug, label: name, count }))
      .sort((a, b) => b.count - a.count)
  }, [events])

  const spaceFacets = useMemo<FacetOption[]>(() => {
    const counts: Record<string, { name: string; count: number }> = {}
    for (const e of events) {
      if (!e.space_slug || !e.space_name) continue
      if (!counts[e.space_slug]) counts[e.space_slug] = { name: e.space_name, count: 0 }
      counts[e.space_slug].count++
    }
    return Object.entries(counts)
      .filter(([, { count }]) => count > 0)
      .map(([slug, { name, count }]) => ({ value: slug, label: name, count }))
      .sort((a, b) => b.count - a.count)
  }, [events])

  const formatFacets = useMemo<FacetOption[]>(() => {
    const counts = { has_location: 0, virtual_only: 0 }
    for (const e of events) {
      if (e.location_name) counts.has_location++
      if (e.virtual_link && !e.location_name) counts.virtual_only++
    }
    return [
      { value: "has_location", label: "Has venue",    count: counts.has_location },
      { value: "virtual_only", label: "Online only",  count: counts.virtual_only },
    ].filter((o) => o.count > 0)
  }, [events])

  const capacityFacets = useMemo<FacetOption[]>(() => {
    const limited = events.filter((e) => e.max_attendees != null).length
    const unlimited = events.filter((e) => e.max_attendees == null).length
    return [
      { value: "limited",   label: "Has capacity limit", count: limited },
      { value: "unlimited", label: "No limit",           count: unlimited },
    ].filter((o) => o.count > 0)
  }, [events])



  const activeCount = Object.values(filters).filter(Boolean).length

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Filter icon + label */}
      <div className={cn(
        "flex items-center gap-1 text-xs font-medium shrink-0",
        activeCount > 0 ? "text-primary" : "text-muted-foreground"
      )}>
        <SlidersHorizontal className="w-3 h-3" />
        {activeCount > 0 ? `${activeCount} active` : "Filter"}
      </div>

      {/* Dynamic facet dropdowns */}
      {typeFacets.length > 1 && (
        <FacetFilter label="Type" options={typeFacets} selected={filters.type} onSelect={(v) => onChange({ type: v })} />
      )}
      {communityFacets.length > 1 && (
        <FacetFilter label="Community" options={communityFacets} selected={filters.community} onSelect={(v) => onChange({ community: v })} />
      )}
      {spaceFacets.length > 1 && (
        <FacetFilter label="Space" options={spaceFacets} selected={filters.space} onSelect={(v) => onChange({ space: v })} />
      )}
      {formatFacets.length > 1 && (
        <FacetFilter label="Format" options={formatFacets} selected={filters.format} onSelect={(v) => onChange({ format: v })} />
      )}
      {capacityFacets.length > 1 && (
        <FacetFilter label="Capacity" options={capacityFacets} selected={filters.capacity} onSelect={(v) => onChange({ capacity: v })} />
      )}


      {/* Clear all */}
      {activeCount > 0 && (
        <button
          onClick={() => onChange(EMPTY_EVENT_FILTERS)}
          className="cursor-pointer flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-accent/50"
        >
          <X className="w-3 h-3" />
          Clear all
        </button>
      )}
    </div>
  )
}

// ── Pure client-side filter function ──────────────────────────

export function applyEventFilters(events: EventWithMeta[], filters: EventFilterState): EventWithMeta[] {
  return events.filter((e) => {
    if (filters.type && e.event_type !== filters.type) return false
    if (filters.community && e.community_slug !== filters.community) return false
    if (filters.space && e.space_slug !== filters.space) return false
    if (filters.format === "has_location" && !e.location_name) return false
    if (filters.format === "virtual_only" && (e.location_name || !e.virtual_link)) return false
    if (filters.capacity === "limited" && e.max_attendees == null) return false
    if (filters.capacity === "unlimited" && e.max_attendees != null) return false
    return true
  })
}
