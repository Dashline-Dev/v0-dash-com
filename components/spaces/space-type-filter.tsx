"use client"

import { cn } from "@/lib/utils"
import type { SpaceType } from "@/types/space"
import { SPACE_TYPE_LABELS } from "@/types/space"

const TYPES: (SpaceType | null)[] = [null, "discussion", "event", "project", "resource"]

interface SpaceTypeFilterProps {
  selected: SpaceType | null
  onSelect: (type: SpaceType | null) => void
}

export function SpaceTypeFilter({ selected, onSelect }: SpaceTypeFilterProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {TYPES.map((type) => (
        <button
          key={type ?? "all"}
          onClick={() => onSelect(type)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors",
            selected === type
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          {type ? SPACE_TYPE_LABELS[type] : "All"}
        </button>
      ))}
    </div>
  )
}
