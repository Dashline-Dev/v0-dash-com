"use client"

import { useState, useTransition, useCallback, useMemo } from "react"
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  Clock,
  CalendarDays,
  Video,
  Users,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EventCard } from "./event-card"
import { getEventsForMonth } from "@/lib/actions/event-actions"
import { toHebrewDate, hebrewMonthYearStr } from "@/lib/hebrew-date"
import type { EventWithMeta } from "@/types/event"
import { cn } from "@/lib/utils"

interface EventCalendarProps {
  initialEvents: EventWithMeta[]
  initialYear: number
  initialMonth: number
  communityId?: string
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const WEEKDAYS_SHORT = ["S", "M", "T", "W", "T", "F", "S"]

// Event type colors
const EVENT_TYPE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  in_person: { bg: "bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  virtual: { bg: "bg-blue-500/10", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500" },
  hybrid: { bg: "bg-purple-500/10", text: "text-purple-700 dark:text-purple-400", dot: "bg-purple-500" },
}

export function EventCalendar({
  initialEvents,
  initialYear,
  initialMonth,
  communityId,
}: EventCalendarProps) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [events, setEvents] = useState(initialEvents)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isPending, startTransition] = useTransition()
  const [view, setView] = useState<"month" | "week">("month")

  const fetchMonth = useCallback(
    (newYear: number, newMonth: number) => {
      startTransition(async () => {
        const result = await getEventsForMonth(newYear, newMonth, communityId)
        setEvents(result)
      })
    },
    [communityId]
  )

  function prevMonth() {
    const newMonth = month === 1 ? 12 : month - 1
    const newYear = month === 1 ? year - 1 : year
    setMonth(newMonth)
    setYear(newYear)
    fetchMonth(newYear, newMonth)
  }

  function nextMonth() {
    const newMonth = month === 12 ? 1 : month + 1
    const newYear = month === 12 ? year + 1 : year
    setMonth(newMonth)
    setYear(newYear)
    fetchMonth(newYear, newMonth)
  }

  function goToToday() {
    const today = new Date()
    setYear(today.getFullYear())
    setMonth(today.getMonth() + 1)
    fetchMonth(today.getFullYear(), today.getMonth() + 1)
  }

  // Build calendar grid data
  const calendarData = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay()
    const daysInMonth = new Date(year, month, 0).getDate()
    const daysInPrevMonth = new Date(year, month - 1, 0).getDate()
    const today = new Date()

    // Map events to dates
    const eventsByDate: Record<string, EventWithMeta[]> = {}
    for (const event of events) {
      const date = new Date(event.start_time)
      const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
      if (!eventsByDate[key]) eventsByDate[key] = []
      eventsByDate[key].push(event)
    }

    // Build weeks array
    const weeks: {
      day: number
      month: number
      year: number
      isCurrentMonth: boolean
      isToday: boolean
      events: EventWithMeta[]
      hebrewDate: ReturnType<typeof toHebrewDate>
    }[][] = []

    let currentWeek: typeof weeks[0] = []
    let dayCounter = 1
    let nextMonthDay = 1

    // Previous month days
    for (let i = 0; i < firstDay; i++) {
      const day = daysInPrevMonth - firstDay + 1 + i
      const prevMonthNum = month === 1 ? 12 : month - 1
      const prevYear = month === 1 ? year - 1 : year
      const cellDate = new Date(prevYear, prevMonthNum - 1, day)
      currentWeek.push({
        day,
        month: prevMonthNum,
        year: prevYear,
        isCurrentMonth: false,
        isToday: false,
        events: [],
        hebrewDate: toHebrewDate(cellDate),
      })
    }

    // Current month days
    while (dayCounter <= daysInMonth) {
      const cellDate = new Date(year, month - 1, dayCounter)
      const dateKey = `${year}-${month}-${dayCounter}`
      const isToday =
        today.getFullYear() === year &&
        today.getMonth() + 1 === month &&
        today.getDate() === dayCounter

      currentWeek.push({
        day: dayCounter,
        month,
        year,
        isCurrentMonth: true,
        isToday,
        events: eventsByDate[dateKey] || [],
        hebrewDate: toHebrewDate(cellDate),
      })

      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
      dayCounter++
    }

    // Next month days to fill last week
    if (currentWeek.length > 0) {
      const nextMonthNum = month === 12 ? 1 : month + 1
      const nextYear = month === 12 ? year + 1 : year
      while (currentWeek.length < 7) {
        const cellDate = new Date(nextYear, nextMonthNum - 1, nextMonthDay)
        currentWeek.push({
          day: nextMonthDay,
          month: nextMonthNum,
          year: nextYear,
          isCurrentMonth: false,
          isToday: false,
          events: [],
          hebrewDate: toHebrewDate(cellDate),
        })
        nextMonthDay++
      }
      weeks.push(currentWeek)
    }

    return { weeks, eventsByDate }
  }, [year, month, events])

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return []
    const key = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`
    return calendarData.eventsByDate[key] || []
  }, [selectedDate, calendarData])

  // Get Hebrew date for header
  const hebrewHeader = hebrewMonthYearStr(new Date(year, month - 1, 15))

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold text-foreground leading-tight">
              {MONTH_NAMES[month - 1]} {year}
            </h2>
            <span
              className="text-sm text-muted-foreground leading-tight"
              dir="rtl"
              lang="he"
            >
              {hebrewHeader}
            </span>
          </div>
          {isPending && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="text-xs"
          >
            Today
          </Button>
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevMonth}
              className="rounded-none border-r border-border h-8 px-2"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextMonth}
              className="rounded-none h-8 px-2"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 bg-muted/50 border-b border-border">
          {WEEKDAYS.map((day, i) => (
            <div
              key={day}
              className={cn(
                "py-3 text-center text-xs font-semibold uppercase tracking-wider",
                i === 6 ? "text-primary/70" : "text-muted-foreground"
              )}
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{WEEKDAYS_SHORT[i]}</span>
            </div>
          ))}
        </div>

        {/* Calendar weeks */}
        <div className="divide-y divide-border">
          {calendarData.weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 divide-x divide-border">
              {week.map((cell, dayIdx) => {
                const hasEvents = cell.events.length > 0
                const cellDate = new Date(cell.year, cell.month - 1, cell.day)
                const isSaturday = dayIdx === 6

                return (
                  <button
                    key={`${cell.year}-${cell.month}-${cell.day}`}
                    onClick={() => setSelectedDate(cellDate)}
                    className={cn(
                      "min-h-[80px] sm:min-h-[100px] p-1.5 sm:p-2 flex flex-col items-start transition-all relative group",
                      "hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset",
                      !cell.isCurrentMonth && "bg-muted/30",
                      cell.isToday && "bg-primary/5",
                      hasEvents && "cursor-pointer"
                    )}
                  >
                    {/* Date numbers */}
                    <div className="flex items-start justify-between w-full gap-1">
                      <div className="flex flex-col items-start">
                        {/* Gregorian date */}
                        <span
                          className={cn(
                            "text-sm sm:text-base font-medium leading-none",
                            !cell.isCurrentMonth && "text-muted-foreground/50",
                            cell.isToday &&
                              "bg-primary text-primary-foreground rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center",
                            isSaturday && cell.isCurrentMonth && "text-primary/80"
                          )}
                        >
                          {cell.day}
                        </span>
                        {/* Hebrew date */}
                        <span
                          className={cn(
                            "text-[10px] sm:text-xs leading-tight mt-0.5",
                            !cell.isCurrentMonth
                              ? "text-muted-foreground/40"
                              : "text-muted-foreground"
                          )}
                          dir="rtl"
                          lang="he"
                        >
                          {cell.hebrewDate.dayStr}
                        </span>
                      </div>

                      {/* Event count badge */}
                      {hasEvents && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "h-5 min-w-[20px] px-1.5 text-[10px] font-semibold",
                            cell.events.length > 0 && "bg-primary text-primary-foreground"
                          )}
                        >
                          {cell.events.length}
                        </Badge>
                      )}
                    </div>

                    {/* Event previews (desktop) */}
                    {hasEvents && (
                      <div className="hidden sm:flex flex-col gap-0.5 mt-1.5 w-full">
                        {cell.events.slice(0, 2).map((event) => {
                          const colors = EVENT_TYPE_COLORS[event.event_type] || EVENT_TYPE_COLORS.in_person
                          return (
                            <div
                              key={event.id}
                              className={cn(
                                "text-[10px] leading-tight px-1.5 py-0.5 rounded truncate",
                                colors.bg,
                                colors.text
                              )}
                            >
                              {event.title}
                            </div>
                          )
                        })}
                        {cell.events.length > 2 && (
                          <span className="text-[10px] text-muted-foreground pl-1">
                            +{cell.events.length - 2} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Event dots (mobile) */}
                    {hasEvents && (
                      <div className="flex sm:hidden gap-0.5 mt-1.5 flex-wrap">
                        {cell.events.slice(0, 4).map((event) => {
                          const colors = EVENT_TYPE_COLORS[event.event_type] || EVENT_TYPE_COLORS.in_person
                          return (
                            <div
                              key={event.id}
                              className={cn("w-1.5 h-1.5 rounded-full", colors.dot)}
                            />
                          )
                        })}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>In-person</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>Virtual</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <span>Hybrid</span>
        </div>
      </div>

      {/* Date detail dialog */}
      <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] p-0">
          {selectedDate && (
            <>
              <DialogHeader className="p-4 pb-2 border-b border-border bg-muted/30">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <DialogTitle className="text-lg font-semibold">
                      {selectedDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </DialogTitle>
                    <span
                      className="text-sm text-muted-foreground mt-0.5"
                      dir="rtl"
                      lang="he"
                    >
                      {toHebrewDate(selectedDate).full}
                    </span>
                  </div>
                </div>
              </DialogHeader>

              <ScrollArea className="max-h-[60vh]">
                <div className="p-4 space-y-3">
                  {selectedDateEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <CalendarDays className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                      <p className="text-muted-foreground">No events on this day</p>
                      <Link href="/events/create">
                        <Button variant="outline" size="sm" className="mt-3">
                          Create Event
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    selectedDateEvents.map((event) => (
                      <Link
                        key={event.id}
                        href={`/events/${event.slug}`}
                        className="block"
                      >
                        <div className="rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors group">
                          <div className="flex items-start gap-3">
                            {/* Time column */}
                            <div className="flex flex-col items-center min-w-[50px] text-center">
                              <span className="text-sm font-semibold text-foreground">
                                {new Date(event.start_time).toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </span>
                              <span className="text-[10px] text-muted-foreground uppercase">
                                {new Date(event.start_time).toLocaleTimeString("en-US", {
                                  hour12: true,
                                }).split(" ")[1]}
                              </span>
                            </div>

                            {/* Event details */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                {event.title}
                              </h4>

                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                                {event.location_name && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {event.location_name}
                                  </span>
                                )}
                                {event.event_type === "virtual" && (
                                  <span className="flex items-center gap-1">
                                    <Video className="w-3 h-3" />
                                    Virtual
                                  </span>
                                )}
                                {event.rsvp_count > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {event.rsvp_count} going
                                  </span>
                                )}
                              </div>

                              {/* Event type badge */}
                              <div className="mt-2">
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    "text-[10px]",
                                    EVENT_TYPE_COLORS[event.event_type]?.bg,
                                    EVENT_TYPE_COLORS[event.event_type]?.text
                                  )}
                                >
                                  {event.event_type.replace("_", " ")}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
