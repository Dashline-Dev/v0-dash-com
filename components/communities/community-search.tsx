"use client"

import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"

interface CommunitySearchProps {
  value: string
  onChange: (value: string) => void
}

export function CommunitySearch({ value, onChange }: CommunitySearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search communities..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-9 h-10 bg-secondary/50 border-border"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
