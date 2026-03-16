"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Clock, Calendar, Plus, X } from "lucide-react"
import type { EventFormData } from "./create-wizard"
import { HebrewDatePicker } from "@/components/ui/hebrew-date-picker"

interface StepDateTimeProps {
  formData: EventFormData
  updateFormData: (updates: Partial<EventFormData>) => void
}

const COMMON_TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Phoenix", label: "Arizona (MST)" },
  { value: "America/Anchorage", label: "Alaska Time" },
  { value: "Pacific/Honolulu", label: "Hawaii Time" },
  { value: "UTC", label: "UTC" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Asia/Jerusalem", label: "Israel (IST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
]

// Common event durations for quick selection
const QUICK_DURATIONS = [
  { label: "1 hr", hours: 1 },
  { label: "1.5 hr", hours: 1.5 },
  { label: "2 hr", hours: 2 },
  { label: "3 hr", hours: 3 },
  { label: "4 hr", hours: 4 },
]

export function StepDateTime({ formData, updateFormData }: StepDateTimeProps) {
  const [showEndDate, setShowEndDate] = useState(
    !!(formData.end_date && formData.start_date && formData.end_date !== formData.start_date)
  )
  const [showEndTime, setShowEndTime] = useState(!!formData.end_time)

  const handleStartDateChange = (date: string) => {
    updateFormData({
      start_date: date,
      end_date: showEndDate ? formData.end_date : date,
    })
  }

  // Apply a quick duration from start time
  const applyDuration = (hours: number) => {
    if (!formData.start_time) return

    const [h, m] = formData.start_time.split(":").map(Number)
    const startMinutes = h * 60 + m
    const endMinutes = startMinutes + hours * 60

    const endH = Math.floor(endMinutes / 60) % 24
    const endM = endMinutes % 60
    const endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`

    updateFormData({ end_time: endTime })
    setShowEndTime(true)
  }

  const toggleEndTime = () => {
    if (showEndTime) {
      updateFormData({ end_time: "" })
      setShowEndTime(false)
    } else {
      setShowEndTime(true)
    }
  }

  const toggleEndDate = () => {
    if (showEndDate) {
      updateFormData({ end_date: formData.start_date })
      setShowEndDate(false)
    } else {
      setShowEndDate(true)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Date &amp; Time</h2>
        <p className="text-sm text-muted-foreground">
          When is your event happening?
        </p>
      </div>

      <div className="space-y-5">
        {/* Start date + time — single combined picker */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            Start Date &amp; Time
          </Label>
          <HebrewDatePicker
            date={formData.start_date}
            time={formData.start_time}
            label="Pick start date &amp; time"
            showTimePicker
            onDateChange={handleStartDateChange}
            onTimeChange={(t) => updateFormData({ start_time: t })}
          />
        </div>

        {/* End time — expandable */}
        {showEndTime && (
          <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                End Date &amp; Time
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleEndTime}
                className="h-6 px-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3 mr-1" />
                Remove
              </Button>
            </div>
            <HebrewDatePicker
              date={formData.end_date || formData.start_date}
              time={formData.end_time}
              label="Pick end date &amp; time"
              minDate={formData.start_date}
              showTimePicker
              onDateChange={(d) => updateFormData({ end_date: d })}
              onTimeChange={(t) => updateFormData({ end_time: t })}
            />

            {/* Quick duration buttons */}
            {formData.start_time && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-xs text-muted-foreground self-center">Duration:</span>
                {QUICK_DURATIONS.map((d) => (
                  <Button
                    key={d.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyDuration(d.hours)}
                    className="h-6 text-xs px-2"
                  >
                    {d.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add options */}
        {!showEndTime && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleEndTime}
            className="text-muted-foreground"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add End Time
          </Button>
        )}

        {/* Timezone */}
        <div className="pt-4 border-t space-y-2">
          <Label htmlFor="timezone" className="text-sm text-muted-foreground">
            Timezone
          </Label>
          <Select
            value={formData.timezone}
            onValueChange={(val) => updateFormData({ timezone: val })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {COMMON_TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
