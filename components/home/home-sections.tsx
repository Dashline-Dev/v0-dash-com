"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronRight, CalendarDays, Star, Users, Compass } from "lucide-react"
import { HomeEventRow } from "./home-event-row"
import type { EventWithMeta, RsvpStatus } from "@/types/event"

interface HomeSectionsProps {
  initialAttending: EventWithMeta[]
  initialInterested: EventWithMeta[]
  initialFromSpaces: EventWithMeta[]
  initialDiscover: EventWithMeta[]
  isGuest: boolean
}

type SectionKey = "attending" | "interested" | "fromSpaces" | "discover"

function SectionHeader({
  icon: Icon,
  label,
  count,
  href,
  hrefLabel,
  emphasis,
}: {
  icon: React.ElementType
  label: string
  count: number
  href?: string
  hrefLabel?: string
  emphasis?: "strong" | "normal" | "muted"
}) {
  const textClass =
    emphasis === "strong"
      ? "text-foreground"
      : emphasis === "muted"
      ? "text-muted-foreground"
      : "text-foreground"

  return (
    <div className="flex items-center justify-between mb-2">
      <h2 className={`text-sm font-semibold flex items-center gap-1.5 ${textClass}`}>
        <Icon className={`w-3.5 h-3.5 ${emphasis === "strong" ? "text-primary" : "text-muted-foreground"}`} />
        {label}
        {count > 0 && (
          <span className="text-xs font-normal text-muted-foreground">({count})</span>
        )}
      </h2>
      {href && hrefLabel && (
        <Link
          href={href}
          className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5"
        >
          {hrefLabel}
          <ChevronRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  )
}

function EmptyState({ message, cta }: { message: string; cta?: { label: string; href: string } }) {
  return (
    <div className="py-4 px-3 text-sm text-muted-foreground">
      {message}
      {cta && (
        <Link
          href={cta.href}
          className="ml-2 text-primary hover:underline font-medium"
        >
          {cta.label}
        </Link>
      )}
    </div>
  )
}

export function HomeSections({
  initialAttending,
  initialInterested,
  initialFromSpaces,
  initialDiscover,
  isGuest,
}: HomeSectionsProps) {
  const [attending, setAttending] = useState(initialAttending)
  const [interested, setInterested] = useState(initialInterested)
  const [fromSpaces, setFromSpaces] = useState(initialFromSpaces)
  const [discover, setDiscover] = useState(initialDiscover)

  // Build a lookup of all events for section reassignment
  const allEvents = [...attending, ...interested, ...fromSpaces, ...discover]
  const eventMap = new Map(allEvents.map((e) => [e.id, e]))

  function handleRsvpChange(eventId: string, newStatus: RsvpStatus | null) {
    const event = eventMap.get(eventId)
    if (!event) return

    // Remove from all sections first
    const remove = (arr: EventWithMeta[]) => arr.filter((e) => e.id !== eventId)
    const updatedEvent: EventWithMeta = { ...event, current_user_rsvp: newStatus }

    // Update eventMap for future calls
    eventMap.set(eventId, updatedEvent)

    if (newStatus === "going") {
      setAttending((prev) => sortByDate([...remove(prev), updatedEvent]))
      setInterested(remove)
      setFromSpaces(remove)
      setDiscover(remove)
    } else if (newStatus === "interested") {
      setInterested((prev) => sortByDate([...remove(prev), updatedEvent]))
      setAttending(remove)
      setFromSpaces(remove)
      setDiscover(remove)
    } else {
      // not_going or cancelled — remove from home entirely
      setAttending(remove)
      setInterested(remove)
      setFromSpaces(remove)
      setDiscover(remove)
    }
  }

  const showAttending = !isGuest
  const showInterested = !isGuest
  const showFromSpaces = !isGuest

  return (
    <div className="flex flex-col gap-7">
      {/* 1. Attending */}
      {showAttending && (
        <section>
          <SectionHeader
            icon={CalendarDays}
            label="Attending"
            count={attending.length}
            href={attending.length > 5 ? "/events?rsvp=going" : undefined}
            hrefLabel="View all"
            emphasis="strong"
          />
          <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
            {attending.length === 0 ? (
              <EmptyState
                message="You're not attending any upcoming events."
                cta={{ label: "Browse Events", href: "/events" }}
              />
            ) : (
              attending.slice(0, 5).map((event) => (
                <HomeEventRow
                  key={event.id}
                  event={event}
                  onRsvpChange={handleRsvpChange}
                />
              ))
            )}
          </div>
        </section>
      )}

      {/* 2. Interested */}
      {showInterested && interested.length > 0 && (
        <section>
          <SectionHeader
            icon={Star}
            label="Interested"
            count={interested.length}
            emphasis="normal"
          />
          <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
            {interested.map((event) => (
              <HomeEventRow
                key={event.id}
                event={event}
                onRsvpChange={handleRsvpChange}
              />
            ))}
          </div>
        </section>
      )}

      {/* 3. From My Spaces */}
      {showFromSpaces && (
        <section>
          <SectionHeader
            icon={Users}
            label="From My Spaces"
            count={fromSpaces.length}
            emphasis="normal"
          />
          <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
            {fromSpaces.length === 0 ? (
              <EmptyState message="No new events in your spaces." />
            ) : (
              fromSpaces.map((event) => (
                <HomeEventRow
                  key={event.id}
                  event={event}
                  onRsvpChange={handleRsvpChange}
                />
              ))
            )}
          </div>
        </section>
      )}

      {/* 4. Discover More */}
      {discover.length > 0 && (
        <section>
          <SectionHeader
            icon={Compass}
            label="Discover More"
            count={discover.length}
            href="/events"
            hrefLabel="Explore all events"
            emphasis="muted"
          />
          <div className="border border-border rounded-lg divide-y divide-border overflow-hidden opacity-90">
            {discover.map((event) => (
              <HomeEventRow
                key={event.id}
                event={event}
                onRsvpChange={handleRsvpChange}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function sortByDate(events: EventWithMeta[]): EventWithMeta[] {
  return [...events].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  )
}
