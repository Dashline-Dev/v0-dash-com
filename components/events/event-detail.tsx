"use client"

import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  Globe,
  ArrowLeft,
  Share2,
  Monitor,
  Pencil,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RsvpButton } from "./rsvp-button"
import { EventShareDialog } from "./event-share-dialog"
import { EventInvitationDisplay } from "./event-invitation-display"
import type { EventWithMeta } from "@/types/event"
import {
  EVENT_TYPE_LABELS,
  formatEventDateRange,
  formatEventDate,
  formatEventTime,
  isEventPast,
  isEventFull,
  getEventCapacityText,
} from "@/types/event"
import { toHebrewDate } from "@/lib/hebrew-date"

interface EventDetailProps {
  event: EventWithMeta
  rsvps?: { id: string; user_id: string; status: string }[]
  communities?: { id: string; name: string; slug: string }[]
  canEdit?: boolean
}

const TYPE_ICON: Record<string, React.ElementType> = {
  in_person: MapPin,
  virtual: Monitor,
  hybrid: Video,
}

export function EventDetail({ event, rsvps, communities = [], canEdit = false }: EventDetailProps) {
  const past = isEventPast(event.end_time)
  const full = isEventFull(event)
  const capacityText = getEventCapacityText(event)
  const TypeIcon = TYPE_ICON[event.event_type] ?? Calendar



  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <div>
        {event.community_slug ? (
          <Link
            href={`/communities/${event.community_slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {event.community_name}
            {event.space_name && (
              <>
                <span className="text-border">/</span>
                {event.space_name}
              </>
            )}
          </Link>
        ) : (
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            All Events
          </Link>
        )}
      </div>

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
              <Badge
                variant="secondary"
                className="text-xs"
              >
                <TypeIcon className="w-3 h-3 mr-1" />
                {EVENT_TYPE_LABELS[event.event_type]}
              </Badge>
              {past && (
                <Badge variant="secondary" className="text-xs">Past event</Badge>
              )}
              {capacityText && (
                <Badge variant="outline" className="text-xs">{capacityText}</Badge>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground text-balance">
              {event.title}
            </h1>
          </div>

          <div className="flex items-center gap-1">
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground shrink-0"
                aria-label="Edit event"
                asChild
              >
                <Link href={`/events/${event.slug}/edit`}>
                  <Pencil className="w-4 h-4" />
                </Link>
              </Button>
            )}
            <EventShareDialog
              eventId={event.id}
              eventSlug={event.slug}
              currentCommunityId={event.community_id}
              communities={communities}
            >
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground shrink-0"
                aria-label="Share event"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </EventShareDialog>
          </div>
        </div>

        {/* RSVP */}
        <div className="flex items-center gap-3 flex-wrap">
          <RsvpButton
            eventId={event.id}
            currentStatus={event.current_user_rsvp}
            isFull={full}
            isPast={past}
          />
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {event.rsvp_count} going
          </span>
        </div>
      </div>

      <Separator />

      {/* Details grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: description */}
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
                  {toHebrewDate(new Date(event.start_time)).full}
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
                    <p className="font-medium text-foreground">Online</p>
                    <a
                      href={event.virtual_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-xs hover:underline break-all"
                    >
                      Join link
                    </a>
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
              {event.space_name && (
                <p className="text-xs text-muted-foreground">
                  in {event.space_name}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
