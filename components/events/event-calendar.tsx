"use client"

import { useState, useTransition, useCallback } from "react"
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EventCard } from "./event-card"
import { getEventsForMonth } from "@/lib/actions/event-actions"
import type { EventWithMeta } from "@/types/event"

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

// Intl-based Hebrew calendar helpers — no external library needed
const hebrewDayFmt = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", { day: "numeric" })
const hebrewMonthFmt = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", { month: "long", year: "numeric" })

function hebrewDay(date: Date): string {
  return hebrewDayFmt.format(date)
}

function hebrewMonthYear(date: Date): string {
  return hebrewMonthFmt.format(date)
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
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const fetchMonth = useCallback(
    (newYear: number, newMonth: number) => {
      startTransition(async () => {
        const result = await getEventsForMonth(newYear, newMonth, communityId)
        setEvents(result)
        setSelectedDate(null)
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

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const today = new Date()

  // Map events to dates
  const eventsByDate: Record<string, EventWithMeta[]> = {}
  for (const event of events) {
    const date = new Date(event.start_time)
    const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    if (!eventsByDate[key]) eventsByDate[key] = []
    eventsByDate[key].push(event)
  }

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : []

  return (
    <div className="flex flex-col gap-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-foreground leading-tight">
            {MONTH_NAMES[month - 1]} {year}
          </h2>
          <span
            className="text-xs text-muted-foreground mt-0.5 leading-tight"
            dir="rtl"
            lang="he"
          >
            {hebrewMonthYear(new Date(year, month - 1, 15))}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isPending && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mr-2" />}
          <Button variant="ghost" size="icon" onClick={prevMonth} aria-label="Previous month">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={nextMonth} aria-label="Next month">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-12 md:h-16 border-b border-r border-border bg-muted/30" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateKey = `${year}-${month}-${day}`
            const cellDate = new Date(year, month - 1, day)
            const dayEvents = eventsByDate[dateKey] || []
            const hasEvents = dayEvents.length > 0
            const isToday =
              today.getFullYear() === year &&
              today.getMonth() + 1 === month &&
              today.getDate() === day
            const isSelected = selectedDate === dateKey

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                className={`h-14 md:h-18 border-b border-r border-border flex flex-col items-center justify-start pt-1.5 gap-0 transition-colors text-left
                  ${isSelected ? "bg-primary/5 ring-1 ring-primary/30" : "hover:bg-muted/50"}
                  ${isToday ? "bg-accent/10" : ""}
                `}
              >
                <span
                  className={`text-xs font-medium leading-none ${
                    isToday
                      ? "bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center"
                      : "text-foreground"
                  }`}
                >
                  {day}
                </span>
                <span
                  className="text-[9px] leading-tight text-muted-foreground mt-0.5"
                  dir="rtl"
                  lang="he"
                >
                  {hebrewDay(cellDate)}
                </span>
                {hasEvents && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 3).map((_, idx) => (
                      <div
                        key={idx}
                        className="w-1.5 h-1.5 rounded-full bg-primary"
                      />
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
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground">
            Events on {new Date(year, month - 1, Number(selectedDate.split("-")[2])).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </h3>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events on this day.</p>
          ) : (
            selectedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          )}
        </div>
      )}
    </div>
  )
}
