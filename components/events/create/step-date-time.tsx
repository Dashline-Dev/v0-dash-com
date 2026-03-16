"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
  { label: "1 hour", hours: 1 },
  { label: "1.5 hours", hours: 1.5 },
  { label: "2 hours", hours: 2 },
  { label: "3 hours", hours: 3 },
  { label: "4 hours", hours: 4 },
]

export function StepDateTime({ formData, updateFormData }: StepDateTimeProps) {
  // Track if user wants to show additional options
  const [showEndTime, setShowEndTime] = useState(!!formData.end_time)
  const [showMultiDay, setShowMultiDay] = useState(
    formData.end_date && formData.start_date && formData.end_date !== formData.start_date
  )

  // Auto-set end date when start date changes
  const handleStartDateChange = (date: string) => {
    updateFormData({
      start_date: date,
      end_date: showMultiDay ? formData.end_date : date,
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

  // Toggle multi-day mode
  const toggleMultiDay = () => {
    if (showMultiDay) {
      // Going back to single day
      updateFormData({ end_date: formData.start_date })
      setShowMultiDay(false)
    } else {
      setShowMultiDay(true)
    }
  }

  // Toggle end time
  const toggleEndTime = () => {
    if (showEndTime) {
      updateFormData({ end_time: "" })
      setShowEndTime(false)
    } else {
      setShowEndTime(true)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Date & Time</h2>
        <p className="text-sm text-muted-foreground">
          When is your event happening?
        </p>
      </div>

      {/* Main date and time - always visible */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start_date" className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Date
            </Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => handleStartDateChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="start_time" className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Start Time
            </Label>
            <Input
              id="start_time"
              type="time"
              value={formData.start_time}
              onChange={(e) => updateFormData({ start_time: e.target.value })}
            />
          </div>
        </div>

        {/* End time section - expandable */}
        {showEndTime && (
          <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <Label htmlFor="end_time" className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                End Time
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
            <Input
              id="end_time"
              type="time"
              value={formData.end_time}
              onChange={(e) => updateFormData({ end_time: e.target.value })}
            />
            
            {/* Quick duration buttons */}
            {formData.start_time && (
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground mr-1 self-center">Quick:</span>
                {QUICK_DURATIONS.map((d) => (
                  <Button
                    key={d.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyDuration(d.hours)}
                    className="h-7 text-xs"
                  >
                    {d.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Multi-day section - expandable */}
        {showMultiDay && (
          <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <Label htmlFor="end_date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                End Date
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleMultiDay}
                className="h-6 px-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3 mr-1" />
                Remove
              </Button>
            </div>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => updateFormData({ end_date: e.target.value })}
              min={formData.start_date}
            />
          </div>
        )}

        {/* Add options - only show buttons for options not yet shown */}
        {(!showEndTime || !showMultiDay) && (
          <div className="flex gap-2 pt-2">
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
            {!showMultiDay && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleMultiDay}
                className="text-muted-foreground"
              >
                <Plus className="w-4 h-4 mr-1" />
                Multi-Day Event
              </Button>
            )}
          </div>
        )}

        {/* Timezone - collapsed by default */}
        <div className="pt-4 border-t">
          <div className="space-y-2">
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
    </div>
  )
}
