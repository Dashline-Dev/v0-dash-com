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

// ── Pure-JS Hebrew calendar conversion ──────────────────────────────────────
// Implements the standard Gregorian→Hebrew algorithm (Dershowitz & Reingold)
// so it works in every environment (Node SSR, all browsers) without Intl locale data.

const HEBREW_UNITS = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"]
const HEBREW_TENS  = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"]
const HEBREW_HUNDREDS = ["", "ק", "ר", "ש", "ת"]
const HEBREW_MONTH_NAMES = [
  "תשרי","חשון","כסלו","טבת","שבט","אדר","ניסן","אייר","סיון","תמוז","אב","אלול",
  "אדר א׳","אדר ב׳",
]

/** Convert a number 1–29 to Hebrew letter notation (e.g. 1→א, 15→ט״ו) */
function numToHebrew(n: number): string {
  // Special cases to avoid divine names
  if (n === 15) return "ט״ו"
  if (n === 16) return "ט״ז"
  let result = ""
  let rem = n
  const h = Math.floor(rem / 100)
  if (h > 0 && h <= 4) { result += HEBREW_HUNDREDS[h]; rem -= h * 100 }
  const t = Math.floor(rem / 10)
  if (t > 0) { result += HEBREW_TENS[t]; rem -= t * 10 }
  if (rem > 0) result += HEBREW_UNITS[rem]
  if (result.length > 1) {
    result = result.slice(0, -1) + "״" + result.slice(-1)
  } else if (result.length === 1) {
    result += "׳"
  }
  return result
}

/** Julian Day Number from a Gregorian date */
function gregorianToJD(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12)
  const yr = y + 4800 - a
  const mo = m + 12 * a - 3
  return d + Math.floor((153 * mo + 2) / 5) + 365 * yr +
    Math.floor(yr / 4) - Math.floor(yr / 100) + Math.floor(yr / 400) - 32045
}

/** Elapsed days since Hebrew epoch for a given Hebrew year */
function hebrewElapsed(year: number): number {
  const months = Math.floor((235 * year - 234) / 19)
  const parts  = 12084 + 13753 * months
  let day = months * 29 + Math.floor(parts / 25920)
  if ((3 * (day + 1)) % 7 < 3) day++
  return day
}

/** Days in a Hebrew year */
function hebrewYearDays(year: number): number {
  return hebrewElapsed(year + 1) - hebrewElapsed(year)
}

/** Is this Hebrew year a leap year? */
function isHebrewLeap(year: number): boolean {
  return ((7 * year) + 1) % 19 < 7
}

/** Days in each Hebrew month for a given year */
function hebrewMonthDays(year: number, month: number): number {
  if ([1, 3, 5, 7, 11].includes(month)) return 30
  if (month === 6) return isHebrewLeap(year) ? 30 : 29
  if (month === 8) return hebrewYearDays(year) % 10 === 5 ? 30 : 29
  if (month === 9) return hebrewYearDays(year) % 10 === 3 ? 29 : 30
  return 29
}

/** Convert a Gregorian Date to { year, month, day } in the Hebrew calendar */
function gregorianToHebrew(date: Date): { year: number; month: number; day: number; monthName: string } {
  const jd = gregorianToJD(date.getFullYear(), date.getMonth() + 1, date.getDate())
  const HEBREW_EPOCH = 347997 // JDN of Hebrew epoch (1 Tishri 1)
  const daysSinceEpoch = jd - HEBREW_EPOCH

  // Approximate year
  let year = Math.floor((daysSinceEpoch * 98496) / 35975351) + 1
  while (hebrewElapsed(year) > daysSinceEpoch) year--
  while (hebrewElapsed(year + 1) <= daysSinceEpoch) year++

  const months = isHebrewLeap(year) ? 13 : 12
  const startOfYear = hebrewElapsed(year)
  let dayInYear = daysSinceEpoch - startOfYear + 1

  let month = 1
  while (month < months && dayInYear > hebrewMonthDays(year, month)) {
    dayInYear -= hebrewMonthDays(year, month)
    month++
  }

  // Remap month index to named months (Hebrew year starts at Tishri = 7)
  let namedIdx: number
  if (isHebrewLeap(year)) {
    // leap: Tishri(1)=0 … Adar-I(13)=12, Adar-II(14)=13
    const leapMap = [0,1,2,3,4,5,12,6,7,8,9,10,11,13]
    namedIdx = leapMap[month - 1] ?? month - 1
  } else {
    const map = [0,1,2,3,4,5,6,7,8,9,10,11]
    namedIdx = map[month - 1] ?? month - 1
  }

  return { year, month, day: dayInYear, monthName: HEBREW_MONTH_NAMES[namedIdx] ?? "" }
}

function hebrewDay(date: Date): string {
  const { day } = gregorianToHebrew(date)
  return numToHebrew(day)
}

function hebrewMonthYear(date: Date): string {
  const { year, monthName } = gregorianToHebrew(date)
  return `${monthName} ${numToHebrew(year % 1000 === 0 ? 1000 : year % 1000)}`
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
