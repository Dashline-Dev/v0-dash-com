"use client"

import { useState, useTransition, useMemo } from "react"
import { Loader2, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CommunitySearch } from "@/components/communities/community-search"
import { FacetFilter, type FacetOption } from "@/components/ui/facet-filter"
import { EventCard } from "./event-card"
import { getEvents } from "@/lib/actions/event-actions"
import type { EventWithMeta, EventType } from "@/types/event"
import { EVENT_TYPES } from "@/types/event"

interface EventListProps {
  initialEvents: EventWithMeta[]
  initialTotal: number
  communityId?: string
  spaceId?: string
}

export function EventList({
  initialEvents,
  initialTotal,
  communityId,
  spaceId,
}: EventListProps) {
  const [allEvents, setAllEvents] = useState(() => {
    const seen = new Set<string>()
    return initialEvents.filter((e) => {
      if (seen.has(e.id)) return false
      seen.add(e.id)
      return true
    })
  })
  const [events, setEvents] = useState(allEvents)
  const [total, setTotal] = useState(initialTotal)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [showPast, setShowPast] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Facets from loaded events
  const typeFacets: FacetOption[] = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const e of allEvents) {
      counts[e.event_type] = (counts[e.event_type] || 0) + 1
    }
    return EVENT_TYPES.map((t) => ({
      value: t.value,
      label: t.label,
      count: counts[t.value] || 0,
    }))
  }, [allEvents])

  // Community facets (when not scoped to one community)
  const communityFacets: FacetOption[] = useMemo(() => {
    if (communityId) return []
    const counts: Record<string, { name: string; count: number }> = {}
    for (const e of allEvents) {
      if (!counts[e.community_slug]) {
        counts[e.community_slug] = { name: e.community_name, count: 0 }
      }
      counts[e.community_slug].count++
    }
    return Object.entries(counts).map(([slug, { name, count }]) => ({
      value: slug,
      label: name,
      count,
    }))
  }, [allEvents, communityId])

  const [communityFilter, setCommunityFilter] = useState<string | null>(null)

  // Apply client-side filters
  function applyClientFilters(all: EventWithMeta[], t: string | null, cf: string | null) {
    let filtered = all
    if (t) filtered = filtered.filter((e) => e.event_type === t)
    if (cf) filtered = filtered.filter((e) => e.community_slug === cf)
    setEvents(filtered)
  }

  function fetchEvents(
    searchVal: string,
    past: boolean,
    isLoadMore = false
  ) {
    startTransition(async () => {
      const result = await getEvents({
        communityId,
        spaceId,
        search: searchVal || undefined,
        upcoming: !past,
        limit: 20,
        offset: isLoadMore ? allEvents.length : 0,
      })

      if (isLoadMore) {
        const newAll = [...allEvents, ...result.events]
        const seen = new Set<string>()
        const deduped = newAll.filter((e) => {
          if (seen.has(e.id)) return false
          seen.add(e.id)
          return true
        })
        setAllEvents(deduped)
        applyClientFilters(deduped, typeFilter, communityFilter)
      } else {
        setAllEvents(result.events)
        applyClientFilters(result.events, typeFilter, communityFilter)
      }
      setTotal(result.total)
    })
  }

  function handleSearch(value: string) {
    setSearch(value)
    fetchEvents(value, showPast)
  }

  function handleTogglePast() {
    const next = !showPast
    setShowPast(next)
    fetchEvents(search, next)
  }

  function handleTypeFilter(v: string | null) {
    setTypeFilter(v)
    applyClientFilters(allEvents, v, communityFilter)
  }

  function handleCommunityFilter(v: string | null) {
    setCommunityFilter(v)
    applyClientFilters(allEvents, typeFilter, v)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search + past toggle */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex-1">
          <CommunitySearch
            value={search}
            onChange={handleSearch}
            placeholder="Search events..."
          />
        </div>
        <button
          onClick={handleTogglePast}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors shrink-0 ${showPast ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent/50"}`}
        >
          {showPast ? "Showing all" : "Upcoming only"}
        </button>
      </div>

      {/* Faceted filters */}
      <div className="flex items-center gap-2 overflow-x-auto">
        <FacetFilter
          label="Type"
          options={typeFacets}
          selected={typeFilter}
          onSelect={handleTypeFilter}
        />
        {communityFacets.length > 1 && (
          <FacetFilter
            label="Community"
            options={communityFacets}
            selected={communityFilter}
            onSelect={handleCommunityFilter}
          />
        )}
      </div>

      {/* Results */}
      {isPending && events.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CalendarDays className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-foreground">No events found</p>
          <p className="text-xs text-muted-foreground mt-1">
            {search ? "Try a different search term" : "Check back later for upcoming events"}
          </p>
        </div>
      ) : (
        <>
          <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          {events.length < total && !typeFilter && !communityFilter && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchEvents(search, showPast, true)}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Load more events
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
