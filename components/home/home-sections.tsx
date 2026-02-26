"use client"

import { useState, useMemo } from "react"
import { CalendarDays, Star, Users, Compass } from "lucide-react"
import { EventsView } from "@/components/events/events-view"
import type { EventWithMeta } from "@/types/event"
import { cn } from "@/lib/utils"

interface HomeSectionsProps {
  initialAttending: EventWithMeta[]
  initialInterested: EventWithMeta[]
  initialFromSpaces: EventWithMeta[]
  initialDiscover: EventWithMeta[]
  isGuest: boolean
}

type TabKey = "following" | "attending" | "interested" | "discover"

const TABS: {
  key: TabKey
  label: string
  icon: React.ElementType
  guestHidden?: boolean
}[] = [
  { key: "following",  label: "Following",  icon: Users,        guestHidden: true },
  { key: "attending",  label: "Attending",  icon: CalendarDays, guestHidden: true },
  { key: "interested", label: "Interested", icon: Star,         guestHidden: true },
  { key: "discover",   label: "Discover",   icon: Compass },
]

const EMPTY_MESSAGES: Record<TabKey, { text: string; cta?: { label: string; href: string } }> = {
  following:  { text: "No upcoming events from communities you follow.", cta: { label: "Find communities", href: "/communities" } },
  attending:  { text: "You haven't RSVPed to any upcoming events yet.",  cta: { label: "Browse events", href: "/explore" } },
  interested: { text: "You haven't marked any events as interested.",    cta: { label: "Browse events", href: "/explore" } },
  discover:   { text: "No public events to discover right now.",         cta: { label: "Explore communities", href: "/communities" } },
}

export function HomeSections({
  initialAttending,
  initialInterested,
  initialFromSpaces,
  initialDiscover,
  isGuest,
}: HomeSectionsProps) {
  const defaultTab: TabKey = isGuest ? "discover" : "following"
  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab)

  // Following = all events from joined communities (deduplicated), sorted by start_time
  const following = useMemo(() => {
    const seen = new Set<string>()
    return initialFromSpaces.filter((e) => {
      if (seen.has(e.id)) return false
      seen.add(e.id)
      return true
    })
  }, [initialFromSpaces])

  const sectionEvents: Record<TabKey, EventWithMeta[]> = {
    following,
    attending:  initialAttending,
    interested: initialInterested,
    discover:   initialDiscover,
  }

  const visibleTabs = TABS.filter((t) => !isGuest || !t.guestHidden)
  const activeEvents = sectionEvents[activeTab]

  return (
    <div className="flex flex-col gap-0">
      {/* Tab bar */}
      <div className="flex items-center border-b border-border overflow-x-auto scrollbar-none -mb-px">
        {visibleTabs.map((tab) => {
          const Icon     = tab.icon
          const count    = sectionEvents[tab.key].length
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
              <Icon className={cn("w-3.5 h-3.5", isActive && "text-primary")} />
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

      {/* Content */}
      <div className="pt-4">
        {activeEvents.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <EventsView
            key={activeTab}
            initialEvents={activeEvents}
            initialTotal={activeEvents.length}
            defaultView="list"
            defaultCalendarMode="today"
          />
        )}
      </div>
    </div>
  )
}

function EmptyState({ tab }: { tab: TabKey }) {
  const { text, cta } = EMPTY_MESSAGES[tab]
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
      <p className="text-sm text-muted-foreground">{text}</p>
      {cta && (
        <a href={cta.href} className="text-sm text-primary hover:underline font-medium">
          {cta.label}
        </a>
      )}
    </div>
  )
}
