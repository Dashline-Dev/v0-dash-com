"use client"

import { cn } from "@/lib/utils"

export interface FacetOption {
  value: string
  label: string
  count: number
}

interface FacetFilterProps {
  /** Label shown before the pills, e.g. "Category" */
  label?: string
  options: FacetOption[]
  selected: string | null
  onSelect: (value: string | null) => void
  /** Show "All" pill with total count */
  showAll?: boolean
  allLabel?: string
}

export function FacetFilter({
  label,
  options,
  selected,
  onSelect,
  showAll = true,
  allLabel = "All",
}: FacetFilterProps) {
  // Only show options that have at least 1 result
  const visible = options.filter((o) => o.count > 0)

  // If no options have results, don't render anything
  if (visible.length === 0) return null

  const totalCount = visible.reduce((sum, o) => sum + o.count, 0)

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
      {label && (
        <span className="text-xs font-medium text-muted-foreground shrink-0 mr-0.5">
          {label}
        </span>
      )}
      {showAll && (
        <button
          onClick={() => onSelect(null)}
          className={cn(
            "shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
            selected === null
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
        >
          {allLabel}
          <span className={cn(
            "text-[10px] tabular-nums",
            selected === null ? "text-background/70" : "text-muted-foreground/60"
          )}>
            {totalCount}
          </span>
        </button>
      )}
      {visible.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(selected === opt.value ? null : opt.value)}
          className={cn(
            "shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
            selected === opt.value
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
        >
          {opt.label}
          <span className={cn(
            "text-[10px] tabular-nums",
            selected === opt.value ? "text-background/70" : "text-muted-foreground/60"
          )}>
            {opt.count}
          </span>
        </button>
      ))}
    </div>
  )
}
