"use client"

import { useState, useTransition, useCallback, useMemo } from "react"
import {
  CalendarDays,
  List,
  MapPin,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  Monitor,
  Video,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CommunitySearch } from "@/components/communities/community-search"
import { EventCard } from "./event-card"
import { getEvents, getEventsForMonth } from "@/lib/actions/event-actions"
import type { EventWithMeta, EventType } from "@/types/event"
import { EVENT_TYPES, formatEventTime, isEventPast, EVENT_TYPE_LABELS } from "@/types/event"
import { cn } from "@/lib/utils"
import { FacetFilter, type FacetOption } from "@/components/ui/facet-filter"
import { AreaMap, type MapEvent } from "@/components/google-area-map"
import { GoogleMapsProvider } from "@/components/maps/google-maps-provider"

// ── Types ───────────────────────────────────────────────────

type ViewMode = "calendar" | "list" | "map"
type CalendarMode = "today" | "week" | "month"

interface EventsViewProps {
  initialEvents: EventWithMeta[]
  initialTotal: number
  communityId?: string
  communitySlug?: string
  spaceId?: string
  basePath?: string
  defaultView?: ViewMode
  defaultCalendarMode?: CalendarMode
  // Controlled mode — when provided, the parent owns view/calendarMode state
  // and the built-in tab bar is suppressed
  controlledView?: ViewMode
  controlledCalendarMode?: CalendarMode
  onViewChange?: (v: ViewMode) => void
  onCalendarModeChange?: (m: CalendarMode) => void
}

// ── Main Component ──────────────────────────────────────────

export function EventsView({
  initialEvents,
  initialTotal,
  communityId,
  communitySlug,
  spaceId,
  basePath,
  defaultView = "calendar",
  defaultCalendarMode = "today",
  controlledView,
  controlledCalendarMode,
  onViewChange,
  onCalendarModeChange,
}: EventsViewProps) {
  const isControlled = controlledView !== undefined

  const [_view, _setView] = useState<ViewMode>(defaultView)
  const [_calendarMode, _setCalendarMode] = useState<CalendarMode>(defaultCalendarMode)

  const view = isControlled ? controlledView! : _view
  const calendarMode = isControlled ? (controlledCalendarMode ?? "today") : _calendarMode
  const setView = isControlled ? (onViewChange ?? (() => {})) : _setView
  const setCalendarMode = isControlled ? (onCalendarModeChange ?? (() => {})) : _setCalendarMode

  return (
    <div className="flex flex-col gap-3">
      {/* Built-in view mode tabs — only shown when NOT in controlled mode */}
      {!isControlled && (
        <div className="flex items-center gap-1 border-b border-border pb-2">
          <ViewTab
            active={view === "calendar"}
            onClick={() => setView("calendar")}
            icon={<CalendarDays className="w-3.5 h-3.5" />}
            label="Calendar"
          />
          <ViewTab
            active={view === "list"}
            onClick={() => setView("list")}
            icon={<List className="w-3.5 h-3.5" />}
            label="List"
          />
          <ViewTab
            active={view === "map"}
            onClick={() => setView("map")}
            icon={<MapPin className="w-3.5 h-3.5" />}
            label="Map"
          />
          {view === "calendar" && (
            <div className="flex items-center gap-0.5 ml-auto">
              <SubTab active={calendarMode === "today"} onClick={() => setCalendarMode("today")} label="Today" />
              <SubTab active={calendarMode === "week"}  onClick={() => setCalendarMode("week")}  label="Week" />
              <SubTab active={calendarMode === "month"} onClick={() => setCalendarMode("month")} label="Month" />
            </div>
          )}
        </div>
      )}

      {/* View content */}
      {view === "calendar" && (
        <CalendarView
          initialEvents={initialEvents}
          mode={calendarMode}
          communityId={communityId}
          basePath={basePath}
        />
      )}
      {view === "list" && (
        <ListView
          initialEvents={initialEvents}
          initialTotal={initialTotal}
          communityId={communityId}
          spaceId={spaceId}
          basePath={basePath}
        />
      )}
      {view === "map" && (
        <MapView events={initialEvents} basePath={basePath} />
      )}
    </div>
  )
}

// ── Tab Components ──────────────────────────────────────────

function ViewTab({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
      )}
    >
      {icon}
      {label}
    </button>
  )
}

function SubTab({ active, onClick, label }: {
  active: boolean; onClick: () => void; label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 text-xs font-medium rounded transition-colors",
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
      )}
    >
      {label}
    </button>
  )
}

// ── Calendar View ───────────────────────────────────────────

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function CalendarView({ initialEvents, mode, communityId, basePath }: {
  initialEvents: EventWithMeta[]; mode: CalendarMode; communityId?: string; basePath?: string
}) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [events, setEvents] = useState(initialEvents)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Week navigation
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(now)
    d.setDate(d.getDate() - d.getDay())
    d.setHours(0, 0, 0, 0)
    return d
  })

  const fetchMonth = useCallback((y: number, m: number) => {
    startTransition(async () => {
      const result = await getEventsForMonth(y, m, communityId)
      setEvents(result)
      setSelectedDate(null)
    })
  }, [communityId])

  function prevMonth() {
    const m = month === 1 ? 12 : month - 1
    const y = month === 1 ? year - 1 : year
    setMonth(m); setYear(y); fetchMonth(y, m)
  }
  function nextMonth() {
    const m = month === 12 ? 1 : month + 1
    const y = month === 12 ? year + 1 : year
    setMonth(m); setYear(y); fetchMonth(y, m)
  }

  function prevWeek() {
    setWeekStart((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() - 7)
      return d
    })
  }
  function nextWeek() {
    setWeekStart((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() + 7)
      return d
    })
  }

  // Map events to date keys
  const eventsByDate: Record<string, EventWithMeta[]> = {}
  for (const event of events) {
    const date = new Date(event.start_time)
    const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    if (!eventsByDate[key]) eventsByDate[key] = []
    eventsByDate[key].push(event)
  }

  // ── Today View ──
  if (mode === "today") {
    const todayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
    const todayEvents = eventsByDate[todayKey] || []

    // Group by hour
    const hourGroups: Record<number, EventWithMeta[]> = {}
    for (const e of todayEvents) {
      const h = new Date(e.start_time).getHours()
      if (!hourGroups[h]) hourGroups[h] = []
      hourGroups[h].push(e)
    }
    const hours = Object.keys(hourGroups).map(Number).sort((a, b) => a - b)

    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">
            {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </h3>
          <span className="text-xs text-muted-foreground">{todayEvents.length} events</span>
        </div>
        {todayEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No events today.</p>
        ) : (
          <div className="flex flex-col">
            {hours.map((hour) => (
              <div key={hour} className="flex gap-3 border-l-2 border-border pl-3 pb-4 last:pb-0">
                <span className="text-xs font-medium text-muted-foreground w-12 shrink-0 pt-0.5">
                  {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                </span>
                <div className="flex-1 border border-border rounded-lg divide-y divide-border overflow-hidden">
                  {hourGroups[hour].map((event) => (
                    <EventCard key={event.id} event={event} basePath={basePath} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Week View ──
  if (mode === "week") {
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      return d
    })

    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">
            {weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </h3>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevWeek}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextWeek}>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-px bg-border border border-border rounded-lg overflow-hidden">
          {weekDays.map((day, i) => {
            const key = `${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`
            const dayEvents = eventsByDate[key] || []
            const isToday = day.toDateString() === now.toDateString()
            const isSelected = selectedDate === key

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(isSelected ? null : key)}
                className={cn(
                  "flex flex-col items-center py-2 px-1 min-h-[72px] bg-card transition-colors",
                  isSelected && "bg-primary/5",
                  !isSelected && "hover:bg-accent/50"
                )}
              >
                <span className="text-[10px] text-muted-foreground font-medium">
                  {WEEKDAYS[i]}
                </span>
                <span className={cn(
                  "text-sm font-medium mt-0.5",
                  isToday ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center" : "text-foreground"
                )}>
                  {day.getDate()}
                </span>
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-1">
                    {dayEvents.slice(0, 3).map((_, idx) => (
                      <div key={idx} className="w-1.5 h-1.5 rounded-full bg-primary" />
                    ))}
                  </div>
                )}
                {dayEvents.length > 0 && (
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    {dayEvents.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Selected day details */}
        {selectedDate && (
          <div className="mt-3">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">
              {new Date(
                Number(selectedDate.split("-")[0]),
                Number(selectedDate.split("-")[1]) - 1,
                Number(selectedDate.split("-")[2])
              ).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </h4>
            {(eventsByDate[selectedDate] || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No events.</p>
            ) : (
              <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
                {(eventsByDate[selectedDate] || []).map((event) => (
                  <EventCard key={event.id} event={event} basePath={basePath} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ── Month View ──
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : []

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">
          {MONTH_NAMES[month - 1]} {year}
        </h3>
        <div className="flex items-center gap-1">
          {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground mr-1" />}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/30">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1.5 text-center text-[10px] font-medium text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e-${i}`} className="h-10 md:h-12 border-b border-r border-border bg-muted/20" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateKey = `${year}-${month}-${day}`
            const dayEvents = eventsByDate[dateKey] || []
            const isToday = now.getFullYear() === year && now.getMonth() + 1 === month && now.getDate() === day
            const isSelected = selectedDate === dateKey

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                className={cn(
                  "h-10 md:h-12 border-b border-r border-border flex flex-col items-center pt-1 gap-0.5 transition-colors",
                  isSelected ? "bg-primary/5 ring-1 ring-inset ring-primary/30" : "hover:bg-muted/50",
                  isToday && !isSelected && "bg-accent/10"
                )}
              >
                <span className={cn(
                  "text-[11px] font-medium leading-none",
                  isToday ? "bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-[10px]" : "text-foreground"
                )}>
                  {day}
                </span>
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5">
                    {dayEvents.slice(0, 3).map((_, idx) => (
                      <div key={idx} className="w-1 h-1 rounded-full bg-primary" />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day events */}
      {selectedDate && (
        <div className="mt-3">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">
            {new Date(year, month - 1, Number(selectedDate.split("-")[2])).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </h4>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events on this day.</p>
          ) : (
            <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
              {selectedEvents.map((event) => (
                <EventCard key={event.id} event={event} basePath={basePath} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── List View ───────────────────────────────────────────────

function ListView({ initialEvents, initialTotal, communityId, spaceId, basePath }: {
  initialEvents: EventWithMeta[]; initialTotal: number; communityId?: string; spaceId?: string; basePath?: string
}) {
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

  function applyClientFilters(all: EventWithMeta[], t: string | null) {
    setEvents(t ? all.filter((e) => e.event_type === t) : all)
  }

  function fetchEvents(s: string, past: boolean, isLoadMore = false) {
    startTransition(async () => {
      const result = await getEvents({
        communityId, spaceId,
        search: s || undefined,
        upcoming: !past,
        limit: 20, offset: isLoadMore ? allEvents.length : 0,
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
        applyClientFilters(deduped, typeFilter)
      } else {
        setAllEvents(result.events)
        applyClientFilters(result.events, typeFilter)
      }
      setTotal(result.total)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search + past toggle */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex-1">
          <CommunitySearch value={search} onChange={(v) => { setSearch(v); fetchEvents(v, showPast) }} placeholder="Search events..." />
        </div>
        <button
          onClick={() => { const next = !showPast; setShowPast(next); fetchEvents(search, next) }}
          className={cn("px-2.5 py-1 text-xs font-medium rounded-md transition-colors shrink-0",
            showPast ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent/50"
          )}
        >
          {showPast ? "All" : "Upcoming"}
        </button>
      </div>

      {/* Faceted type filter */}
      <FacetFilter
        label="Type"
        options={typeFacets}
        selected={typeFilter}
        onSelect={(v) => { setTypeFilter(v); applyClientFilters(allEvents, v) }}
      />

      {/* Results */}
      {isPending && events.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No events found.</p>
      ) : (
        <>
          <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
            {events.map((event) => (
              <EventCard key={event.id} event={event} basePath={basePath} />
            ))}
          </div>
          {events.length < total && !typeFilter && (
            <div className="flex justify-center">
              <Button variant="outline" size="sm" onClick={() => fetchEvents(search, showPast, true)} disabled={isPending}>
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Map View ────────────────────────────────────────────────

function MapView({ events, basePath }: { events: EventWithMeta[]; basePath?: string }) {
  const eventsWithCoords = events.filter(
    (e) => e.latitude != null && e.longitude != null && !isNaN(Number(e.latitude)) && !isNaN(Number(e.longitude))
  )

  const mapEvents: MapEvent[] = eventsWithCoords.map((e) => ({
    id: e.id,
    title: e.title,
    slug: e.slug,
    lat: Number(e.latitude),
    lng: Number(e.longitude),
    start_time: e.start_time,
    event_type: e.event_type,
  }))

  if (mapEvents.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <div className="border border-border rounded-lg bg-muted/30 flex items-center justify-center min-h-[300px]">
          <div className="text-center py-12">
            <MapPin className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-medium text-muted-foreground">No events with locations</p>
            <p className="text-xs text-muted-foreground mt-1">
              Events with coordinates will appear on the map.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <GoogleMapsProvider>
        <AreaMap events={mapEvents} height="400px" />
      </GoogleMapsProvider>

      {/* List below the map */}
      <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
        {eventsWithCoords.map((event) => (
          <EventCard key={event.id} event={event} basePath={basePath} />
        ))}
      </div>
    </div>
  )
}
