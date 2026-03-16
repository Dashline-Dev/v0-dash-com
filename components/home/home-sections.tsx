"use client"

import { useState, useMemo } from "react"
import { CalendarDays, Star, Users, Compass, List, MapPin } from "lucide-react"
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
type ViewMode = "calendar" | "list" | "map"
type CalendarMode = "today" | "week" | "month"

const TABS: { key: TabKey; label: string; icon: React.ElementType; guestHidden?: boolean }[] = [
  { key: "following",  label: "Following",  icon: Users,        guestHidden: true },
  { key: "attending",  label: "Attending",  icon: CalendarDays, guestHidden: true },
  { key: "interested", label: "Interested", icon: Star,         guestHidden: true },
  { key: "discover",   label: "Discover",   icon: Compass },
]

const VIEW_ICONS: { key: ViewMode; icon: React.ElementType; label: string }[] = [
  { key: "calendar", icon: CalendarDays, label: "Calendar" },
  { key: "list",     icon: List,         label: "List" },
  { key: "map",      icon: MapPin,       label: "Map" },
]

const CALENDAR_MODES: CalendarMode[] = ["today", "week", "month"]

const EMPTY_MESSAGES: Record<TabKey, { text: string; cta?: { label: string; href: string } }> = {
  following:  { text: "No upcoming events from communities you follow.", cta: { label: "Find communities", href: "/communities" } },
  attending:  { text: "You have no upcoming events.",  cta: { label: "Browse events",    href: "/explore" } },
  interested: { text: "You haven't marked any events as interested.",    cta: { label: "Browse events",    href: "/explore" } },
  discover:   { text: "No public events to discover right now.",         cta: { label: "Explore",          href: "/communities" } },
}

export function HomeSections({
  initialAttending,
  initialInterested,
  initialFromSpaces,
  initialDiscover,
  isGuest,
}: HomeSectionsProps) {
  const defaultTab: TabKey = isGuest ? "discover" : "following"

  const [activeTab, setActiveTab]       = useState<TabKey>(defaultTab)
  const [view, setView]                 = useState<ViewMode>("list")
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("today")

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

  const visibleTabs  = TABS.filter((t) => !isGuest || !t.guestHidden)
  const activeEvents = sectionEvents[activeTab]

  return (
    <div className="flex flex-col">
      {/* ── Single unified toolbar ── */}
      <div className="flex items-center border-b border-border overflow-x-auto scrollbar-none">
        {/* Category tabs — left side */}
        <div className="flex items-center flex-1 min-w-0">
          {visibleTabs.map((tab) => {
            const Icon     = tab.icon
            const count    = sectionEvents[tab.key].length
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "cursor-pointer flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors shrink-0 -mb-px",
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", isActive && "text-primary")} />
                {tab.label}
                {count > 0 && (
                  <span className={cn(
                    "text-xs rounded-full px-1.5 py-0.5 leading-none tabular-nums",
                    isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-border mx-1 shrink-0" />

        {/* View toggle — icon-only buttons, right side */}
        <div className="flex items-center gap-0.5 px-1 shrink-0">
          {VIEW_ICONS.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              title={label}
              aria-label={label}
              className={cn(
                "cursor-pointer flex items-center justify-center w-7 h-7 rounded transition-colors",
                view === key
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Calendar sub-mode strip — only when calendar view is active */}
      {view === "calendar" && (
        <div className="flex items-center gap-0.5 border-b border-border px-3 py-1.5 bg-muted/30">
          {CALENDAR_MODES.map((mode) => (
            <button
              key={mode}
              onClick={() => setCalendarMode(mode)}
              className={cn(
                "px-2.5 py-0.5 text-xs font-medium rounded capitalize transition-colors",
                calendarMode === mode
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="pt-4">
        {activeEvents.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <EventsView
            key={activeTab}
            initialEvents={activeEvents}
            initialTotal={activeEvents.length}
            controlledView={view}
            controlledCalendarMode={calendarMode}
            onViewChange={setView}
            onCalendarModeChange={setCalendarMode}
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
