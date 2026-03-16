"use client"

import { useState, useCallback, useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { toHebrewDate, hebrewMonthYearStr } from "@/lib/hebrew-date"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// ── Helpers ──────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return ""
  const d = new Date(dateStr + "T12:00:00")
  const greg = d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  const heb = toHebrewDate(d).short
  return `${greg} · ${heb}`
}

function dateStrToYM(dateStr: string): { year: number; month: number } {
  if (!dateStr) {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  }
  const d = new Date(dateStr + "T12:00:00")
  return { year: d.getFullYear(), month: d.getMonth() }
}

// ── Time picker helpers ───────────────────────────────────────

/** Build list of times in 15-min increments */
function buildTimeSlots(): string[] {
  const slots: string[] = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`)
    }
  }
  return slots
}

const TIME_SLOTS = buildTimeSlots()

function formatTimeDisplay(time: string): string {
  if (!time) return ""
  const [h, m] = time.split(":").map(Number)
  const ampm = h >= 12 ? "PM" : "AM"
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`
}

// ── Calendar component ────────────────────────────────────────

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const MONTH_NAMES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

interface CalendarProps {
  selectedDate: string // "YYYY-MM-DD"
  minDate?: string
  onSelect: (dateStr: string) => void
}

function Calendar({ selectedDate, minDate, onSelect }: CalendarProps) {
  const initial = dateStrToYM(selectedDate)
  const [viewYear, setViewYear] = useState(initial.year)
  const [viewMonth, setViewMonth] = useState(initial.month)

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  function buildDayStr(day: number): string {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  function isDisabled(day: number): boolean {
    if (!minDate) return false
    return buildDayStr(day) < minDate
  }

  // Hebrew label for each day
  function hebrewLabel(day: number): string {
    const d = new Date(viewYear, viewMonth, day)
    return toHebrewDate(d).dayStr
  }

  const hebrewHeader = useMemo(() => {
    return hebrewMonthYearStr(new Date(viewYear, viewMonth, 1))
  }, [viewYear, viewMonth])

  const cells = useMemo(() => {
    const blanks = Array(firstDay).fill(null)
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    return [...blanks, ...days]
  }, [firstDay, daysInMonth])

  return (
    <div className="p-3 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1.5 rounded hover:bg-accent transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="text-center">
          <p className="text-sm font-semibold">{MONTH_NAMES_EN[viewMonth]} {viewYear}</p>
          <p className="text-xs text-muted-foreground" dir="rtl" lang="he">{hebrewHeader}</p>
        </div>

        <button
          type="button"
          onClick={nextMonth}
          className="p-1.5 rounded hover:bg-accent transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`blank-${idx}`} />
          }
          const dayStr = buildDayStr(day)
          const isSelected = dayStr === selectedDate
          const isToday = dayStr === todayStr
          const disabled = isDisabled(day)
          const hebLabel = hebrewLabel(day)

          return (
            <button
              key={dayStr}
              type="button"
              onClick={() => !disabled && onSelect(dayStr)}
              disabled={disabled}
              className={cn(
                "flex flex-col items-center justify-center rounded-md py-1 text-center transition-colors",
                "disabled:opacity-30 disabled:cursor-not-allowed",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : isToday
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-accent"
              )}
            >
              <span className="text-xs font-medium leading-tight">{day}</span>
              <span
                className={cn(
                  "text-[8px] leading-tight",
                  isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                )}
                dir="rtl"
                lang="he"
              >
                {hebLabel}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Time picker ───────────────────────────────────────────────

interface TimePickerProps {
  value: string
  onChange: (time: string) => void
}

function TimePicker({ value, onChange }: TimePickerProps) {
  const [customMode, setCustomMode] = useState(false)
  const [customValue, setCustomValue] = useState(value)

  const handleCustomSubmit = () => {
    if (customValue && /^\d{2}:\d{2}$/.test(customValue)) {
      onChange(customValue)
      setCustomMode(false)
    }
  }

  return (
    <div className="border-t border-border px-3 pt-3 pb-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-muted-foreground">Time</p>
        <button
          type="button"
          onClick={() => setCustomMode(!customMode)}
          className="text-xs text-primary hover:underline"
        >
          {customMode ? "Presets" : "Custom time"}
        </button>
      </div>

      {customMode ? (
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            className="flex-1 h-8 px-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button type="button" size="sm" onClick={handleCustomSubmit} className="h-8">
            Set
          </Button>
        </div>
      ) : (
        <div className="max-h-40 overflow-y-auto">
          <div className="grid grid-cols-4 gap-1">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => onChange(slot)}
                className={cn(
                  "px-1.5 py-1.5 text-xs rounded-md text-center transition-colors",
                  slot === value
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-accent text-foreground"
                )}
              >
                {formatTimeDisplay(slot)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main HebrewDatePicker export ──────────────────────────────

interface HebrewDatePickerProps {
  /** "YYYY-MM-DD" */
  date: string
  /** "HH:MM" (24-hr) */
  time: string
  label?: string
  minDate?: string
  showTimePicker?: boolean
  onDateChange: (date: string) => void
  onTimeChange?: (time: string) => void
}

export function HebrewDatePicker({
  date,
  time,
  label,
  minDate,
  showTimePicker = true,
  onDateChange,
  onTimeChange,
}: HebrewDatePickerProps) {
  const [open, setOpen] = useState(false)

  const displayText = useMemo(() => {
    if (!date) return label ?? "Pick a date"
    const datePart = formatDisplayDate(date)
    if (showTimePicker && time) return `${datePart}  ${formatTimeDisplay(time)}`
    return datePart
  }, [date, time, label, showTimePicker])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-border bg-background",
            "hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary transition-colors text-left",
            !date && "text-muted-foreground"
          )}
        >
          <span className="flex-1 truncate">{displayText}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          selectedDate={date}
          minDate={minDate}
          onSelect={(d) => {
            onDateChange(d)
            if (!showTimePicker) setOpen(false)
          }}
        />
        {showTimePicker && onTimeChange && (
          <TimePicker
            value={time}
            onChange={(t) => {
              onTimeChange(t)
            }}
          />
        )}
        {showTimePicker && (
          <div className="px-3 pb-3 flex justify-end">
            <Button type="button" size="sm" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
