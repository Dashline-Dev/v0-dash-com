"use client"

import { cn } from "@/lib/utils"
import { EVENT_TYPE_LABELS, type EventType } from "@/types/event"
import { MapPin, Video, MonitorSmartphone } from "lucide-react"

const TYPE_ICONS: Record<EventType, React.ElementType> = {
  in_person: MapPin,
  virtual: Video,
  hybrid: MonitorSmartphone,
}

interface EventTypeFilterProps {
  value: EventType | "all"
  onChange: (value: EventType | "all") => void
}

export function EventTypeFilter({ value, onChange }: EventTypeFilterProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
      <button
        onClick={() => onChange("all")}
        className={cn(
          "shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
          value === "all"
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        )}
      >
        All Events
      </button>
      {(Object.entries(EVENT_TYPE_LABELS) as [EventType, string][]).map(
        ([type, label]) => {
          const Icon = TYPE_ICONS[type]
          return (
            <button
              key={type}
              onClick={() => onChange(type)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5",
                value === type
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          )
        }
      )}
    </div>
  )
}
