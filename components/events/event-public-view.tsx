"use client"

import { useState, useEffect } from "react"
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Globe,
  Share2,
  Monitor,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { EventInvitationDisplay } from "./event-invitation-display"
import { AddToCalendarButton } from "./add-to-calendar-button"
import type { EventWithMeta } from "@/types/event"
import {
  EVENT_TYPE_LABELS,
  formatEventDate,
  formatEventTime,
  isEventPast,
} from "@/types/event"
import { toHebrewDate } from "@/lib/hebrew-date"

interface EventPublicViewProps {
  event: EventWithMeta
}

const TYPE_ICON: Record<string, React.ElementType> = {
  in_person: MapPin,
  virtual: Monitor,
  hybrid: Video,
}

export function EventPublicView({ event }: EventPublicViewProps) {
  const past = isEventPast(event.end_time)
  const TypeIcon = TYPE_ICON[event.event_type] ?? Calendar

  const [hebrewDate, setHebrewDate] = useState<string>("")
  useEffect(() => {
    setHebrewDate(toHebrewDate(new Date(event.start_time)).full)
  }, [event.start_time])

  function handleShare() {
    try {
      navigator.clipboard.writeText(window.location.href)
    } catch {
      // Clipboard not available
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Cover image */}
      {event.cover_image_url && (
        <div className="w-full h-48 md:h-64 rounded-xl overflow-hidden bg-secondary">
          <img
            src={event.cover_image_url}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                <TypeIcon className="w-3 h-3 mr-1" />
                {EVENT_TYPE_LABELS[event.event_type]}
              </Badge>
              {past && (
                <Badge variant="secondary" className="text-xs">Past event</Badge>
              )}

            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground text-balance">
              {event.title}
            </h1>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="text-muted-foreground shrink-0"
            aria-label="Share event"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>


      </div>

      <Separator />

      {/* Details grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: description and invitation */}
        <div className="md:col-span-2 flex flex-col gap-5">
          {/* Invitation content (image, message, details) */}
          <EventInvitationDisplay event={event} />

          {event.description && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-2">About this event</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>
          )}
        </div>

        {/* Right: info sidebar */}
        <div className="flex flex-col gap-4">
          {/* Date & time */}
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Date & Time
            </h3>
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="text-sm text-foreground">
                <p className="font-medium">
                  {formatEventDate(event.start_time, event.timezone)}
                </p>
                <p
                  className="text-xs text-muted-foreground mt-0.5"
                  dir="rtl"
                  lang="he"
                >
                  {hebrewDate}
                </p>
                <p className="text-muted-foreground mt-1">
                  {formatEventTime(event.start_time, event.timezone)} - {formatEventTime(event.end_time, event.timezone)}
                </p>
              </div>
            </div>
            {event.timezone && (
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">{event.timezone}</span>
              </div>
            )}
            {!past && (
              <AddToCalendarButton
                title={event.title}
                startTime={event.start_time}
                endTime={event.end_time}
                locationName={event.location_name}
                locationAddress={event.location_address}
                description={event.description}
                timezone={event.timezone}
              />
            )}
          </div>

          {/* Location */}
          {(event.location_name || event.virtual_link) && (
            <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Location
              </h3>
              {event.location_name && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">{event.location_name}</p>
                    {event.location_address && (
                      <p className="text-muted-foreground text-xs mt-0.5">{event.location_address}</p>
                    )}
                  </div>
                </div>
              )}
              {event.virtual_link && (
                <div className="flex items-start gap-3">
                  <Video className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">Online Event</p>
                    <p className="text-muted-foreground text-xs">
                      Sign in to access the link
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Organizer */}
          {event.organizer_name && (
            <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Organized by
              </h3>
              <div className="flex items-center gap-3">
                {event.organizer_avatar ? (
                  <img
                    src={event.organizer_avatar}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {event.organizer_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-sm font-medium text-foreground">
                  {event.organizer_name}
                </span>
              </div>
            </div>
          )}

          {/* Community if attached */}
          {event.community_name && event.community_slug && (
            <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Community
              </h3>
              <Link
                href={`/communities/${event.community_slug}`}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                {event.community_name}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
