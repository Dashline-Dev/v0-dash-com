"use client"

import { useState, useTransition, useCallback } from "react"
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
  X,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CommunitySearch } from "@/components/communities/community-search"
import { EventCard } from "./event-card"
import { getEvents, getEventsForMonth } from "@/lib/actions/event-actions"
import type { EventWithMeta } from "@/types/event"
import { formatEventTime, isEventPast } from "@/types/event"
import { cn } from "@/lib/utils"
import { EventFilters, applyEventFilters, EMPTY_EVENT_FILTERS, type EventFilterState } from "./event-filters"
import { AreaMap, type MapEvent } from "@/components/google-area-map"
import { GoogleMapsProvider } from "@/components/maps/google-maps-provider"
import { toHebrewDate } from "@/lib/hebrew-date"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  controlledView?: ViewMode
  controlledCalendarMode?: CalendarMode
  onViewChange?: (v: ViewMode) => void
  onCalendarModeChange?: (m: CalendarMode) => void
}

// ── Hebrew date helpers ─────────────────────────────────────

const HEBREW_MONTHS = [
  "ניסן", "אייר", "סיון", "תמוז", "אב", "אלול",
  "תשרי", "חשון", "כסלו", "טבת", "שבט", "אדר", "אדר א׳", "אדר ב׳"
]

const HEBREW_DAYS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ז׳", "ח׳", "ט׳", "י׳",
  "י״א", "י״ב", "י״ג", "י״ד", "ט״ו", "ט״ז", "י״ז", "י״ח", "י״ט", "כ׳",
  "כ״א", "כ״ב", "כ״ג", "כ״ד", "כ״ה", "כ״ו", "כ״ז", "כ״ח", "כ״ט", "ל׳"]

function getHebrewDayStr(day: number): string {
  if (day >= 1 && day <= 30) return HEBREW_DAYS[day - 1]
  return String(day)
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
  defaultCalendarMode = "month",
  controlledView,
  controlledCalendarMode,
  onViewChange,
  onCalendarModeChange,
}: EventsViewProps) {
  const isControlled = controlledView !== undefined

  const [_view, _setView] = useState<ViewMode>(defaultView)
  const [_calendarMode, _setCalendarMode] = useState<CalendarMode>(defaultCalendarMode)

  const view = isControlled ? controlledView! : _view
  const calendarMode = isControlled ? (controlledCalendarMode ?? "month") : _calendarMode
  const setView = isControlled ? (onViewChange ?? (() => {})) : _setView
  const setCalendarMode = isControlled ? (onCalendarModeChange ?? (() => {})) : _setCalendarMode

  return (
    <div className="flex flex-col gap-4">
      {/* Built-in view mode tabs */}
      {!isControlled && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
            <ViewTab
              active={view === "calendar"}
              onClick={() => setView("calendar")}
              icon={<CalendarDays className="w-4 h-4" />}
              label="Calendar"
            />
            <ViewTab
              active={view === "list"}
              onClick={() => setView("list")}
              icon={<List className="w-4 h-4" />}
              label="List"
            />
            <ViewTab
              active={view === "map"}
              onClick={() => setView("map")}
              icon={<MapPin className="w-4 h-4" />}
              label="Map"
            />
          </div>
          {view === "calendar" && (
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
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
        "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
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
        "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </button>
  )
}

// ── Calendar View ───────────────────────────────────────────

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const WEEKDAYS_HEB = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"]
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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
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
    })
  }, [communityId])

  function goToToday() {
    const y = now.getFullYear()
    const m = now.getMonth() + 1
    setYear(y)
    setMonth(m)
    fetchMonth(y, m)
  }

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

  // Get Hebrew date for header
  const headerDate = new Date(year, month - 1, 15)
  const headerHebrew = toHebrewDate(headerDate)

  // ── Today View ──
  if (mode === "today") {
    const todayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
    const todayEvents = eventsByDate[todayKey] || []
    const todayHebrew = toHebrewDate(now)

    // Group by hour
    const hourGroups: Record<number, EventWithMeta[]> = {}
    for (const e of todayEvents) {
      const h = new Date(e.start_time).getHours()
      if (!hourGroups[h]) hourGroups[h] = []
      hourGroups[h].push(e)
    }
    const hours = Object.keys(hourGroups).map(Number).sort((a, b) => a - b)

    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5 font-hebrew">
                {todayHebrew.full}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                {todayEvents.length} event{todayEvents.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {todayEvents.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDays className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No events scheduled for today</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {hours.map((hour) => (
                <div key={hour} className="flex gap-4">
                  <div className="w-16 shrink-0 pt-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    {hourGroups[hour].map((event) => (
                      <Link
                        key={event.id}
                        href={basePath ? `${basePath}/events/${event.slug}` : `/events/${event.slug}`}
                        className="group p-3 rounded-lg border border-border bg-background hover:border-primary/30 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                              {event.title}
                            </h4>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatEventTime(event.start_time)}
                              </span>
                              {event.location_name && (
                                <span className="flex items-center gap-1 truncate">
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{event.location_name}</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <EventTypeBadge type={event.event_type} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={prevWeek}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={nextWeek}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Week grid */}
        <div className="grid grid-cols-7 divide-x divide-border">
          {weekDays.map((day, i) => {
            const key = `${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`
            const dayEvents = eventsByDate[key] || []
            const isToday = day.toDateString() === now.toDateString()
            const hebrew = toHebrewDate(day)
            const isSaturday = day.getDay() === 6

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "flex flex-col p-2 min-h-[120px] transition-colors text-left",
                  isSaturday && "bg-amber-50/50 dark:bg-amber-900/10",
                  isToday && "bg-primary/5",
                  "hover:bg-accent/50"
                )}
              >
                {/* Day header */}
                <div className="text-center mb-2">
                  <div className="text-[10px] text-muted-foreground font-medium uppercase">
                    {WEEKDAYS[i]}
                  </div>
                  <div className={cn(
                    "text-lg font-semibold mt-0.5",
                    isToday ? "bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center mx-auto" : "text-foreground"
                  )}>
                    {day.getDate()}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-hebrew mt-0.5">
                    {getHebrewDayStr(hebrew.day)}
                  </div>
                </div>

                {/* Events */}
                <div className="flex-1 flex flex-col gap-1">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded truncate font-medium",
                        event.event_type === "in_person" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                        event.event_type === "virtual" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                        event.event_type === "hybrid" && "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                      )}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] text-muted-foreground font-medium">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Date detail dialog */}
        <DateDetailDialog
          date={selectedDate}
          events={selectedDate ? eventsByDate[`${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`] || [] : []}
          onClose={() => setSelectedDate(null)}
          basePath={basePath}
        />
      </div>
    )
  }

  // ── Month View ──
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-foreground">
              {MONTH_NAMES[month - 1]} {year}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5 font-hebrew">
              {headerHebrew.monthName} {headerHebrew.yearStr}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isPending && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">In Person</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">Virtual</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
          <span className="text-muted-foreground">Hybrid</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-900/30" />
          <span className="text-muted-foreground">Shabbat</span>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={cn(
              "py-3 text-center border-r last:border-r-0 border-border",
              i === 6 && "bg-amber-50/50 dark:bg-amber-900/10"
            )}
          >
            <div className="text-xs font-semibold text-foreground">{d}</div>
            <div className="text-[10px] text-muted-foreground font-hebrew">{WEEKDAYS_HEB[i]}</div>
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {/* Empty cells for days before the first */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className={cn(
              "min-h-[100px] md:min-h-[120px] border-b border-r border-border bg-muted/20",
              (i + 7 - firstDay) % 7 === 6 && "bg-amber-50/30 dark:bg-amber-900/5"
            )}
          />
        ))}

        {/* Actual days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateObj = new Date(year, month - 1, day)
          const dateKey = `${year}-${month}-${day}`
          const dayEvents = eventsByDate[dateKey] || []
          const hebrew = toHebrewDate(dateObj)
          const isToday = now.getFullYear() === year && now.getMonth() + 1 === month && now.getDate() === day
          const dayOfWeek = (firstDay + i) % 7
          const isSaturday = dayOfWeek === 6

          return (
            <button
              key={day}
              onClick={() => setSelectedDate(dateObj)}
              className={cn(
                "min-h-[100px] md:min-h-[120px] border-b border-r border-border p-1.5 md:p-2 flex flex-col text-left transition-all",
                isSaturday && "bg-amber-50/50 dark:bg-amber-900/10",
                isToday && "ring-2 ring-inset ring-primary/50",
                dayEvents.length > 0 && "hover:bg-accent/50",
                !dayEvents.length && "hover:bg-muted/30"
              )}
            >
              {/* Day number row */}
              <div className="flex items-start justify-between mb-1">
                <span className={cn(
                  "text-sm md:text-base font-semibold",
                  isToday
                    ? "bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm"
                    : dayEvents.length > 0 ? "text-foreground" : "text-muted-foreground"
                )}>
                  {day}
                </span>
                <span className="text-[10px] md:text-xs text-muted-foreground font-hebrew">
                  {getHebrewDayStr(hebrew.day)}
                </span>
              </div>

              {/* Events preview */}
              <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "text-[9px] md:text-[10px] px-1 md:px-1.5 py-0.5 rounded truncate font-medium leading-tight",
                      event.event_type === "in_person" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                      event.event_type === "virtual" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                      event.event_type === "hybrid" && "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                    )}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-[9px] md:text-[10px] text-muted-foreground font-medium">
                    +{dayEvents.length - 3} more
                  </span>
                )}
              </div>

              {/* Event count badge */}
              {dayEvents.length > 0 && (
                <div className="mt-auto pt-1">
                  <span className={cn(
                    "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full",
                    dayEvents.length >= 3
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/20 text-primary"
                  )}>
                    {dayEvents.length}
                  </span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Date detail dialog */}
      <DateDetailDialog
        date={selectedDate}
        events={selectedDate ? eventsByDate[`${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`] || [] : []}
        onClose={() => setSelectedDate(null)}
        basePath={basePath}
      />
    </div>
  )
}

// ── Date Detail Dialog ──────────────────────────────────────

function DateDetailDialog({ date, events, onClose, basePath }: {
  date: Date | null
  events: EventWithMeta[]
  onClose: () => void
  basePath?: string
}) {
  if (!date) return null

  const hebrew = toHebrewDate(date)
  const isToday = date.toDateString() === new Date().toDateString()

  return (
    <Dialog open={!!date} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-lg">
                {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </span>
              <span className="text-sm font-normal text-muted-foreground font-hebrew">
                {hebrew.full}
              </span>
            </div>
            {isToday && (
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                Today
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Events for {date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {events.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No events on this day</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={basePath ? `${basePath}/events/${event.slug}` : `/events/${event.slug}`}
                  className="group p-4 rounded-lg border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
                  onClick={onClose}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {event.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {formatEventTime(event.start_time)}
                        </span>
                        {event.location_name && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            {event.location_name}
                          </span>
                        )}
                        {event.rsvp_count > 0 && (
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            {event.rsvp_count} going
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <EventTypeBadge type={event.event_type} />
                      <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Event Type Badge ────────────────────────────────────────

function EventTypeBadge({ type }: { type: string }) {
  const config = {
    in_person: { icon: MapPin, label: "In Person", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    virtual: { icon: Monitor, label: "Virtual", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    hybrid: { icon: Video, label: "Hybrid", className: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  }[type] || { icon: CalendarDays, label: type, className: "bg-muted text-muted-foreground" }

  const Icon = config.icon

  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full", config.className)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
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
  const [total, setTotal] = useState(initialTotal)
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<EventFilterState>(EMPTY_EVENT_FILTERS)
  const [showPast, setShowPast] = useState(false)
  const [isPending, startTransition] = useTransition()

  const events = applyEventFilters(allEvents, filters)
  const hasActiveFilters = Object.values(filters).some(Boolean)

  function fetchEvents(s: string, past: boolean, isLoadMore = false) {
    startTransition(async () => {
      const result = await getEvents({
        communityId, spaceId,
        search: s || undefined,
        upcoming: !past,
        limit: 20, offset: isLoadMore ? allEvents.length : 0,
      })
      if (isLoadMore) {
        const merged = [...allEvents, ...result.events]
        const seen = new Set<string>()
        setAllEvents(merged.filter((e) => { if (seen.has(e.id)) return false; seen.add(e.id); return true }))
      } else {
        setAllEvents(result.events)
      }
      setTotal(result.total)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search + past toggle */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <CommunitySearch value={search} onChange={(v) => { setSearch(v); fetchEvents(v, showPast) }} placeholder="Search events..." />
        </div>
        <Button
          variant={showPast ? "default" : "outline"}
          size="sm"
          onClick={() => { const next = !showPast; setShowPast(next); fetchEvents(search, next) }}
        >
          {showPast ? "All Events" : "Upcoming"}
        </Button>
      </div>

      {/* Rich attribute filters */}
      <EventFilters events={allEvents} filters={filters} onChange={(next) => setFilters((p) => ({ ...p, ...next }))} />

      {/* Results */}
      {isPending && events.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <CalendarDays className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">
            {hasActiveFilters ? "No events match your filters." : "No events found."}
          </p>
        </div>
      ) : (
        <>
          <div className="border border-border rounded-xl divide-y divide-border overflow-hidden bg-card">
            {events.map((event) => (
              <EventCard key={event.id} event={event} basePath={basePath} />
            ))}
          </div>
          {allEvents.length < total && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => fetchEvents(search, showPast, true)}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
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
  const mappable = events.filter((e) => e.latitude && e.longitude)

  if (mappable.length === 0) {
    return (
      <div className="border border-border rounded-xl bg-card p-12 text-center">
        <MapPin className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">No events with location data to display on map.</p>
      </div>
    )
  }

  const mapEvents: MapEvent[] = mappable.map((e) => ({
    id: e.id,
    title: e.title,
    latitude: e.latitude!,
    longitude: e.longitude!,
    type: e.event_type,
    slug: e.slug,
  }))

  return (
    <div className="border border-border rounded-xl overflow-hidden h-[500px]">
      <GoogleMapsProvider>
        <AreaMap events={mapEvents} basePath={basePath} />
      </GoogleMapsProvider>
    </div>
  )
}
