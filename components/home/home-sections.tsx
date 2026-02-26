"use client"

import { useState } from "react"
import { CalendarDays, Star, Users, Compass } from "lucide-react"
import { EventsView } from "@/components/events/events-view"
import type { EventWithMeta, RsvpStatus } from "@/types/event"
import { cn } from "@/lib/utils"

interface HomeSectionsProps {
  initialAttending: EventWithMeta[]
  initialInterested: EventWithMeta[]
  initialFromSpaces: EventWithMeta[]
  initialDiscover: EventWithMeta[]
  isGuest: boolean
}

type TabKey = "attending" | "interested" | "fromSpaces" | "discover"

const TABS: {
  key: TabKey
  label: string
  icon: React.ElementType
  guestHidden?: boolean
}[] = [
  { key: "attending",  label: "Attending",       icon: CalendarDays, guestHidden: true },
  { key: "interested", label: "Interested",       icon: Star,         guestHidden: true },
  { key: "fromSpaces", label: "From My Spaces",   icon: Users,        guestHidden: true },
  { key: "discover",   label: "Discover",         icon: Compass },
]

export function HomeSections({
  initialAttending,
  initialInterested,
  initialFromSpaces,
  initialDiscover,
  isGuest,
}: HomeSectionsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>(
    isGuest ? "discover" : "attending"
  )

  // Keep per-tab event state so RSVP changes persist when switching tabs
  const [sections, setSections] = useState({
    attending:  initialAttending,
    interested: initialInterested,
    fromSpaces: initialFromSpaces,
    discover:   initialDiscover,
  })

  const visibleTabs = TABS.filter((t) => !isGuest || !t.guestHidden)

  const activeEvents = sections[activeTab]
  const activeTotal  = activeEvents.length

  return (
    <div className="flex flex-col gap-0">
      {/* Tab bar */}
      <div className="flex items-center border-b border-border overflow-x-auto scrollbar-none -mb-px">
        {visibleTabs.map((tab) => {
          const Icon    = tab.icon
          const count   = sections[tab.key].length
          const isActive = activeTab === tab.key

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors shrink-0",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", isActive ? "text-primary" : "")} />
              {tab.label}
              {count > 0 && (
                <span
                  className={cn(
                    "text-xs rounded-full px-1.5 py-0.5 leading-none tabular-nums",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* EventsView for the active tab */}
      <div className="pt-4">
        {activeEvents.length === 0 ? (
          <EmptyState tab={activeTab} isGuest={isGuest} />
        ) : (
          <EventsView
            key={activeTab}
            initialEvents={activeEvents}
            initialTotal={activeTotal}
            defaultView="list"
            defaultCalendarMode="today"
          />
        )}
      </div>
    </div>
  )
}

function EmptyState({ tab, isGuest }: { tab: TabKey; isGuest: boolean }) {
  const messages: Record<TabKey, string> = {
    attending:  "You haven't RSVPed to any upcoming events yet.",
    interested: "You haven't marked any events as interested.",
    fromSpaces: "No upcoming events in the communities and spaces you've joined.",
    discover:   "No public events to discover right now.",
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
      <p className="text-sm text-muted-foreground">{messages[tab]}</p>
      {(tab === "attending" || tab === "interested") && (
        <a
          href="/explore"
          className="text-sm text-primary hover:underline font-medium"
        >
          Browse events
        </a>
      )}
      {tab === "fromSpaces" && (
        <a
          href="/communities"
          className="text-sm text-primary hover:underline font-medium"
        >
          Join communities
        </a>
      )}
    </div>
  )
}
