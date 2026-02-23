"use client"

import { useState, useTransition } from "react"
import { Loader2, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CommunitySearch } from "@/components/communities/community-search"
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
  const [events, setEvents] = useState(() => {
    // Deduplicate initial events
    const seen = new Set<string>()
    return initialEvents.filter((e) => {
      if (seen.has(e.id)) return false
      seen.add(e.id)
      return true
    })
  })
  const [total, setTotal] = useState(initialTotal)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<EventType | "all">("all")
  const [showPast, setShowPast] = useState(false)
  const [isPending, startTransition] = useTransition()

  function applyFilters(
    newSearch: string,
    newType: EventType | "all",
    newShowPast: boolean
  ) {
    startTransition(async () => {
      const result = await getEvents({
        communityId,
        spaceId,
        search: newSearch || undefined,
        upcoming: !newShowPast,
        limit: 12,
        offset: 0,
      })
      // Client-side type filter since the action doesn't support it directly
      const filtered =
        newType === "all"
          ? result.events
          : result.events.filter((e) => e.event_type === newType)
      setEvents(filtered)
      setTotal(result.total)
    })
  }

  function handleSearch(value: string) {
    setSearch(value)
    applyFilters(value, typeFilter, showPast)
  }

  function handleTypeFilter(type: EventType | "all") {
    setTypeFilter(type)
    applyFilters(search, type, showPast)
  }

  function handleTogglePast() {
    const next = !showPast
    setShowPast(next)
    applyFilters(search, typeFilter, next)
  }

  function handleLoadMore() {
    startTransition(async () => {
      const result = await getEvents({
        communityId,
        spaceId,
        search: search || undefined,
        upcoming: !showPast,
        limit: 12,
        offset: events.length,
      })
      const filtered =
        typeFilter === "all"
          ? result.events
          : result.events.filter((e) => e.event_type === typeFilter)
      setEvents((prev) => {
        const existingIds = new Set(prev.map((e) => e.id))
        const unique = filtered.filter((e) => !existingIds.has(e.id))
        return [...prev, ...unique]
      })
      setTotal(result.total)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CommunitySearch
          value={search}
          onChange={handleSearch}
          placeholder="Search events..."
        />
        <div className="flex items-center gap-2 overflow-x-auto">
          <Button
            variant={showPast ? "default" : "outline"}
            size="sm"
            onClick={handleTogglePast}
            className="text-xs shrink-0"
          >
            {showPast ? "Showing all" : "Upcoming only"}
          </Button>
        </div>
      </div>

      {/* Type filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Button
          variant={typeFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => handleTypeFilter("all")}
          className="text-xs shrink-0"
        >
          All types
        </Button>
        {EVENT_TYPES.map((t) => (
          <Button
            key={t.value}
            variant={typeFilter === t.value ? "default" : "outline"}
            size="sm"
            onClick={() => handleTypeFilter(t.value)}
            className="text-xs shrink-0"
          >
            {t.label}
          </Button>
        ))}
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
          <div className="flex flex-col gap-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          {events.length < total && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
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
