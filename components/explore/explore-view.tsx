"use client"

import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import {
  Search,
  Users,
  CalendarDays,
  MapPin,
  LayoutGrid,
  Filter,
  TrendingUp,
  Loader2,
  Map as MapIcon,
  List,
  X,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AreaMap, MapLegend } from "@/components/google-area-map"
import { GoogleMapsProvider } from "@/components/maps/google-maps-provider"
import { globalSearch, getExploreMapMarkers } from "@/lib/actions/search-actions"
import type { SearchResult, SearchResultType, ExploreMapMarker } from "@/types/search"
import type { TrendingItem } from "@/types/search"
import { cn } from "@/lib/utils"

const TYPE_FILTERS: { value: SearchResultType | "all"; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "All", icon: Search },
  { value: "community", label: "Communities", icon: Users },
  { value: "event", label: "Events", icon: CalendarDays },
  { value: "area", label: "Areas", icon: MapPin },
  { value: "space", label: "Spaces", icon: LayoutGrid },
]

const TYPE_ICONS: Record<string, React.ElementType> = {
  community: Users,
  event: CalendarDays,
  space: LayoutGrid,
  area: MapPin,
}

interface ExploreViewProps {
  initialTrending: TrendingItem[]
  initialMarkers: ExploreMapMarker[]
}

export function ExploreView({ initialTrending, initialMarkers }: ExploreViewProps) {
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<SearchResultType | "all">("all")
  const [results, setResults] = useState<SearchResult[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showMap, setShowMap] = useState(true)
  const [markers, setMarkers] = useState<ExploreMapMarker[]>(initialMarkers)

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([])
      setTotal(0)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await globalSearch({
          query: query.trim(),
          type: typeFilter,
          limit: 20,
          offset: 0,
        })
        setResults(res.results)
        setTotal(res.total)
      } catch {
        setResults([])
        setTotal(0)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, typeFilter])

  // Refresh markers when type filter changes
  useEffect(() => {
    async function refresh() {
      try {
        const m = await getExploreMapMarkers({
          type: typeFilter,
        })
        setMarkers(m)
      } catch {
        // keep existing markers
      }
    }
    refresh()
  }, [typeFilter])

  const hasResults = query.trim().length >= 2 && results.length > 0
  const isSearching = query.trim().length >= 2

  // Convert markers to AreaMap format
  const communityMarkers = markers
    .filter((m) => m.type === "community")
    .map((m) => ({
      id: m.id,
      name: m.title,
      slug: m.href.replace("/communities/", ""),
      lat: m.latitude,
      lng: m.longitude,
      member_count: 0,
    }))

  const eventMarkers = markers
    .filter((m) => m.type === "event")
    .map((m) => ({
      id: m.id,
      title: m.title,
      slug: m.href.replace("/events/", ""),
      lat: m.latitude,
      lng: m.longitude,
      start_time: "",
      community_name: m.subtitle || "",
    }))

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]">
      {/* Search bar + filters */}
      <div className="px-4 md:px-6 py-4 border-b border-border bg-card space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search communities, events, spaces, areas..."
              className="pl-9 pr-8"
            />
            {query && (
              <button
                onClick={() => { setQuery(""); setResults([]); setTotal(0) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <Button
            variant={showMap ? "default" : "outline"}
            size="sm"
            onClick={() => setShowMap(!showMap)}
            className="gap-1.5 shrink-0 hidden md:flex"
          >
            {showMap ? <List className="w-3.5 h-3.5" /> : <MapIcon className="w-3.5 h-3.5" />}
            {showMap ? "List" : "Map"}
          </Button>
        </div>

        {/* Type filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
                typeFilter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              <f.icon className="w-3 h-3" />
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Split view content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Results list */}
        <div className={cn(
          "flex-1 overflow-y-auto",
          showMap ? "md:max-w-[50%]" : "w-full"
        )}>
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && isSearching && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Search className="w-8 h-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-foreground">No results found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try a different search term or adjust your filters.
              </p>
            </div>
          )}

          {!loading && hasResults && (
            <div className="divide-y divide-border">
              <div className="px-4 py-2 text-xs text-muted-foreground bg-muted/30">
                {total} result{total !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
              </div>
              {results.map((r) => (
                <SearchResultItem key={`${r.type}-${r.id}`} result={r} />
              ))}
            </div>
          )}

          {/* Default: trending */}
          {!loading && !isSearching && initialTrending.length > 0 && (
            <div className="p-4 md:p-6 space-y-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Trending
              </h2>
              <div className="grid grid-cols-1 gap-2">
                {initialTrending.map((item) => {
                  const Icon = TYPE_ICONS[item.type] || Search
                  return (
                    <Link
                      key={`${item.type}-${item.id}`}
                      href={item.href}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-center w-9 h-9 rounded-md bg-muted shrink-0">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.subtitle}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {item.metric} {item.metricLabel}
                      </Badge>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Map panel */}
        {showMap && (
          <div className="hidden md:flex flex-col flex-1 border-l border-border">
            <GoogleMapsProvider>
              <AreaMap
                center={{ lat: 37.0902, lng: -95.7129 }}
                zoom={4}
                communities={communityMarkers}
                events={eventMarkers}
                height="100%"
                className="rounded-none border-0"
              />
            </GoogleMapsProvider>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Search result item ──────────────────────────────────────

function SearchResultItem({ result }: { result: SearchResult }) {
  const Icon = TYPE_ICONS[result.type] || Search

  const typeColors: Record<string, string> = {
    community: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    event: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    space: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    area: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  }

  return (
    <Link
      href={result.href}
      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center justify-center w-9 h-9 rounded-md bg-muted shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {result.title}
        </p>
        {result.subtitle && (
          <p className="text-xs text-muted-foreground truncate">
            {result.subtitle}
          </p>
        )}
      </div>
      <Badge
        variant="secondary"
        className={cn("text-[10px] shrink-0 capitalize", typeColors[result.type])}
      >
        {result.type}
      </Badge>
    </Link>
  )
}
