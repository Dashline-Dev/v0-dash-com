"use client"

import { cn } from "@/lib/utils"
import { COMMUNITY_CATEGORIES, type CommunityCategory } from "@/types/community"

interface CategoryFilterProps {
  selected: CommunityCategory | null
  onSelect: (category: CommunityCategory | null) => void
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
          selected === null
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        )}
      >
        All
      </button>
      {COMMUNITY_CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onSelect(selected === cat.value ? null : cat.value)}
          className={cn(
            "shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
            selected === cat.value
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  )
}
