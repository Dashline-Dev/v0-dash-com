"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Users,
  CalendarDays,
  MapPin,
  LayoutGrid,
  ArrowRight,
  Loader2,
} from "lucide-react"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command"
import { globalSearch } from "@/lib/actions/search-actions"
import type { SearchResult } from "@/types/search"

const TYPE_ICONS: Record<string, React.ElementType> = {
  community: Users,
  event: CalendarDays,
  space: LayoutGrid,
  area: MapPin,
}

const TYPE_LABELS: Record<string, string> = {
  community: "Communities",
  event: "Events",
  space: "Spaces",
  area: "Areas",
}

const QUICK_LINKS = [
  { label: "Browse Communities", href: "/", icon: Users },
  { label: "Upcoming Events", href: "/events", icon: CalendarDays },
  { label: "Explore Areas", href: "/areas", icon: MapPin },
  { label: "Announcements", href: "/announcements", icon: ArrowRight },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Cmd+K listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await globalSearch({
          query: query.trim(),
          limit: 8,
          offset: 0,
        })
        setResults(res.results)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false)
      setQuery("")
      setResults([])
      router.push(href)
    },
    [router]
  )

  // Group results by type
  const grouped = results.reduce(
    (acc, r) => {
      if (!acc[r.type]) acc[r.type] = []
      acc[r.type].push(r)
      return acc
    },
    {} as Record<string, SearchResult[]>
  )

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-secondary/50 text-muted-foreground text-sm transition-colors hover:bg-secondary hover:text-foreground"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">Search...</span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground">
          <span className="text-[10px]">{"⌘"}</span>K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Search communities, events, spaces, and areas"
      >
        <CommandInput
          placeholder="Search communities, events, spaces, areas..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList className="max-h-[360px]">
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <CommandEmpty>
              No results found for &ldquo;{query}&rdquo;
            </CommandEmpty>
          )}

          {/* Search results grouped by type */}
          {!loading &&
            Object.entries(grouped).map(([type, items]) => {
              const Icon = TYPE_ICONS[type] || Search
              return (
                <CommandGroup
                  key={type}
                  heading={TYPE_LABELS[type] || type}
                >
                  {items.map((item) => (
                    <CommandItem
                      key={`${item.type}-${item.id}`}
                      value={`${item.title} ${item.subtitle}`}
                      onSelect={() => handleSelect(item.href)}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted shrink-0">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-medium text-foreground truncate">
                          {item.title}
                        </span>
                        {item.subtitle && (
                          <span className="text-xs text-muted-foreground truncate">
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 opacity-0 group-data-[selected=true]:opacity-100" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )
            })}

          {/* Quick links when no query */}
          {!loading && query.trim().length < 2 && (
            <>
              <CommandGroup heading="Quick Links">
                {QUICK_LINKS.map((link) => (
                  <CommandItem
                    key={link.href}
                    value={link.label}
                    onSelect={() => handleSelect(link.href)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted shrink-0">
                      <link.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm">{link.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Tip">
                <div className="px-2 py-2 text-xs text-muted-foreground">
                  Type at least 2 characters to search across communities,
                  events, spaces, and areas.
                </div>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
