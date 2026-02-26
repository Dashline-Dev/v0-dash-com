"use client"

import { useState, useTransition } from "react"
import { Loader2, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CommunitySearch } from "@/components/communities/community-search"
import { EventFilters, applyEventFilters, EMPTY_EVENT_FILTERS, type EventFilterState } from "./event-filters"
import { EventCard } from "./event-card"
import { getEvents } from "@/lib/actions/event-actions"
import type { EventWithMeta } from "@/types/event"

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
  const [total, setTotal] = useState(initialTotal)
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<EventFilterState>(EMPTY_EVENT_FILTERS)
  const [showPast, setShowPast] = useState(false)
  const [isPending, startTransition] = useTransition()

  const events = applyEventFilters(allEvents, filters)
  const hasActiveFilters = Object.values(filters).some(Boolean)

  function fetchEvents(searchVal: string, past: boolean, isLoadMore = false) {
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
        const merged = [...allEvents, ...result.events]
        const seen = new Set<string>()
        const deduped = merged.filter((e) => {
          if (seen.has(e.id)) return false
          seen.add(e.id)
          return true
        })
        setAllEvents(deduped)
      } else {
        setAllEvents(result.events)
      }
      setTotal(result.total)
    })
  }

  function handleFilterChange(next: Partial<EventFilterState>) {
    setFilters((prev) => ({ ...prev, ...next }))
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search + past toggle */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <CommunitySearch
            value={search}
            onChange={(v) => { setSearch(v); fetchEvents(v, showPast) }}
            placeholder="Search events..."
          />
        </div>
        <button
          onClick={() => { const next = !showPast; setShowPast(next); fetchEvents(search, next) }}
          className={`cursor-pointer px-2.5 py-1 text-xs font-medium rounded-md border transition-colors shrink-0 ${
            showPast
              ? "bg-foreground text-background border-foreground"
              : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
          }`}
        >
          {showPast ? "Showing all" : "Upcoming"}
        </button>
      </div>

      {/* Dynamic attribute filters */}
      <EventFilters events={allEvents} filters={filters} onChange={handleFilterChange} />

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
            {search || hasActiveFilters ? "Try adjusting your search or filters" : "Check back later for upcoming events"}
          </p>
        </div>
      ) : (
        <>
          <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          {allEvents.length < total && !hasActiveFilters && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchEvents(search, showPast, true)}
                disabled={isPending}
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
