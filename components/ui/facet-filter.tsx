"use client"

import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"
import { useState } from "react"

export interface FacetOption {
  value: string
  label: string
  count: number
}

interface FacetFilterProps {
  /** Label shown as the dropdown trigger, e.g. "Category" */
  label: string
  options: FacetOption[]
  selected: string | null
  onSelect: (value: string | null) => void
}

export function FacetFilter({
  label,
  options,
  selected,
  onSelect,
}: FacetFilterProps) {
  const [open, setOpen] = useState(false)

  // Only show options that have at least 1 result
  const visible = options.filter((o) => o.count > 0)

  // Don't render if no data
  if (visible.length === 0) return null

  const totalCount = visible.reduce((sum, o) => sum + o.count, 0)
  const selectedOption = visible.find((o) => o.value === selected)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
          selected
            ? "border-primary/50 bg-primary/10 text-primary"
            : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/20"
        )}
      >
        {label}
        {selectedOption && (
          <span className="font-semibold">: {selectedOption.label}</span>
        )}
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 z-50 min-w-[180px] max-w-[280px] rounded-lg border border-border bg-popover shadow-md py-1 animate-in fade-in-0 zoom-in-95">
            {/* All option */}
            <button
              onClick={() => { onSelect(null); setOpen(false) }}
              className={cn(
                "w-full flex items-center justify-between px-3 py-1.5 text-xs transition-colors",
                !selected
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-foreground hover:bg-accent/50"
              )}
            >
              <span>All</span>
              <span className="text-muted-foreground tabular-nums">{totalCount}</span>
            </button>

            <div className="h-px bg-border my-1" />

            {visible.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onSelect(selected === opt.value ? null : opt.value); setOpen(false) }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-1.5 text-xs transition-colors",
                  selected === opt.value
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-foreground hover:bg-accent/50"
                )}
              >
                <span>{opt.label}</span>
                <span className="text-muted-foreground tabular-nums">{opt.count}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
