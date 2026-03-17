"use client"

import { CalendarPlus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AddToCalendarButtonProps {
  title: string
  startTime: string  // ISO string
  endTime: string    // ISO string
  locationName?: string | null
  locationAddress?: string | null
  description?: string | null
  timezone?: string | null
}

function toGoogleCalendarDate(isoString: string, timezone?: string | null): string {
  const date = new Date(isoString)
  // Format as YYYYMMDDTHHmmssZ (UTC)
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
}

export function AddToCalendarButton({
  title,
  startTime,
  endTime,
  locationName,
  locationAddress,
  description,
  timezone,
}: AddToCalendarButtonProps) {
  function handleGoogleCalendar() {
    const start = toGoogleCalendarDate(startTime)
    const end = toGoogleCalendarDate(endTime)

    const location = [locationName, locationAddress].filter(Boolean).join(", ")

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: title,
      dates: `${start}/${end}`,
      ...(location && { location }),
      ...(description && { details: description }),
      ...(timezone && { ctz: timezone }),
    })

    window.open(
      `https://calendar.google.com/calendar/render?${params.toString()}`,
      "_blank",
      "noopener,noreferrer"
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleGoogleCalendar}
      className="w-full gap-2"
    >
      <svg
        viewBox="0 0 24 24"
        className="w-4 h-4 shrink-0"
        aria-hidden="true"
      >
        <path
          fill="#4285F4"
          d="M22 12.1c0-.7-.1-1.4-.2-2.1H12v4h5.6c-.2 1.3-1 2.4-2.1 3.1v2.6h3.4c2-1.8 3.1-4.5 3.1-7.6z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.7 0 5-.9 6.6-2.4l-3.4-2.6c-.9.6-2 1-3.2 1-2.5 0-4.6-1.7-5.4-3.9H3.1v2.6C4.7 20.9 8.1 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M6.6 15.1c-.2-.6-.3-1.3-.3-2.1s.1-1.5.3-2.1V8.3H3.1C2.4 9.7 2 11.3 2 13s.4 3.3 1.1 4.7l3.5-2.6z"
        />
        <path
          fill="#EA4335"
          d="M12 5.1c1.4 0 2.6.5 3.6 1.3L18.2 4C16.6 2.5 14.4 1.5 12 1.5 8.1 1.5 4.7 3.6 3.1 6.8l3.5 2.6C7.4 6.8 9.5 5.1 12 5.1z"
        />
      </svg>
      Add to Google Calendar
    </Button>
  )
}
