"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Search,
  Users,
  CalendarDays,
  MapPin,
  LayoutGrid,
  Filter,
  TrendingUp,
  Loader2,
  X,
  ChevronDown,
  Clock,
  Sparkles,
  ArrowRight,
  Calendar,
  Star,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { globalSearch } from "@/lib/actions/search-actions"
import type { SearchResult, SearchResultType } from "@/types/search"
import type { TrendingItem } from "@/types/search"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const TYPE_FILTERS: { value: SearchResultType | "all"; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "All", icon: Sparkles },
  { value: "community", label: "Communities", icon: Users },
  { value: "event", label: "Events", icon: CalendarDays },
  { value: "space", label: "Spaces", icon: LayoutGrid },
  { value: "area", label: "Areas", icon: MapPin },
]

const EVENT_TIME_FILTERS = [
  { value: "all", label: "Any time" },
  { value: "today", label: "Today" },
  { value: "this-week", label: "This week" },
  { value: "this-month", label: "This month" },
  { value: "upcoming", label: "Upcoming" },
]

const TYPE_ICONS: Record<string, React.ElementType> = {
  community: Users,
  event: CalendarDays,
  space: LayoutGrid,
  area: MapPin,
}

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  community: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-600 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800" },
  event: { bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-600 dark:text-orange-400", border: "border-orange-200 dark:border-orange-800" },
  space: { bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-600 dark:text-purple-400", border: "border-purple-200 dark:border-purple-800" },
  area: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800" },
}

interface ExploreViewProps {
  initialTrending: TrendingItem[]
}

export function ExploreView({ initialTrending }: ExploreViewProps) {
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<SearchResultType | "all">("all")
  const [timeFilter, setTimeFilter] = useState("all")
  const [results, setResults] = useState<SearchResult[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([])
      setTotal(0)
      setHasSearched(false)
      return
    }

    setHasSearched(true)
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await globalSearch({
          query: query.trim(),
          type: typeFilter,
          limit: 24,
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

  // Group trending items by type
  const trendingCommunities = useMemo(
    () => initialTrending.filter((t) => t.type === "community").slice(0, 4),
    [initialTrending]
  )
  const trendingEvents = useMemo(
    () => initialTrending.filter((t) => t.type === "event").slice(0, 4),
    [initialTrending]
  )

  const isSearching = query.trim().length >= 2
  const showResults = isSearching && (loading || results.length > 0 || hasSearched)

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      {/* Hero search section */}
      <div className="bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Discover Your Community
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto">
              Find communities, events, spaces, and neighborhoods that match your interests
            </p>
          </div>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search communities, events, spaces..."
                className="pl-12 pr-12 h-12 text-base rounded-full border-2 border-border focus:border-primary shadow-sm"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery("")
                    setResults([])
                    setTotal(0)
                    setHasSearched(false)
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Type filter tabs */}
            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
              {TYPE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setTypeFilter(f.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all",
                    typeFilter === f.value
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <f.icon className="w-4 h-4" />
                  {f.label}
                </button>
              ))}
            </div>

            {/* Event time filter - only show when filtering events */}
            {typeFilter === "event" && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      {EVENT_TIME_FILTERS.find((t) => t.value === timeFilter)?.label}
                      <ChevronDown className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center">
                    <DropdownMenuLabel>Event Time</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {EVENT_TIME_FILTERS.map((t) => (
                      <DropdownMenuItem
                        key={t.value}
                        onClick={() => setTimeFilter(t.value)}
                        className={timeFilter === t.value ? "bg-muted" : ""}
                      >
                        {t.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Search results */}
        {showResults && (
          <div className="mb-8">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-16">
                <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-1">No results found</h3>
                <p className="text-sm text-muted-foreground">
                  Try different keywords or adjust your filters
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{total}</span> result
                    {total !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.map((result) => (
                    <SearchResultCard key={`${result.type}-${result.id}`} result={result} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Default view - Trending & Featured */}
        {!showResults && (
          <div className="space-y-10">
            {/* Quick actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <QuickActionCard
                icon={Users}
                title="Browse Communities"
                subtitle="Find your people"
                href="/communities"
                color="blue"
              />
              <QuickActionCard
                icon={CalendarDays}
                title="Upcoming Events"
                subtitle="What's happening"
                href="/events"
                color="orange"
              />
              <QuickActionCard
                icon={MapPin}
                title="Explore Areas"
                subtitle="By location"
                href="/areas"
                color="emerald"
              />
              <QuickActionCard
                icon={Star}
                title="Featured"
                subtitle="Editor's picks"
                href="/featured"
                color="amber"
              />
            </div>

            {/* Trending Communities */}
            {trendingCommunities.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Trending Communities
                  </h2>
                  <Link
                    href="/communities"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    View all
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {trendingCommunities.map((item) => (
                    <TrendingCommunityCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming Events */}
            {trendingEvents.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-500" />
                    Popular Events
                  </h2>
                  <Link
                    href="/events"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    View all
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {trendingEvents.map((item) => (
                    <TrendingEventCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}

            {/* Categories */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Browse by Category
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {[
                  "Torah Study",
                  "Shabbat",
                  "Women's",
                  "Young Professionals",
                  "Families",
                  "Seniors",
                  "Singles",
                  "Teens",
                  "Chesed",
                  "Prayer",
                  "Social",
                  "Learning",
                ].map((category) => (
                  <Link
                    key={category}
                    href={`/explore?category=${encodeURIComponent(category.toLowerCase())}`}
                    className="flex items-center justify-center px-4 py-3 rounded-lg border border-border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all text-sm font-medium text-foreground"
                  >
                    {category}
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Quick Action Card ────────────────────────────────────────

function QuickActionCard({
  icon: Icon,
  title,
  subtitle,
  href,
  color,
}: {
  icon: React.ElementType
  title: string
  subtitle: string
  href: string
  color: "blue" | "orange" | "emerald" | "amber"
}) {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900",
    orange: "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900",
    emerald: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900",
    amber: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900",
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center p-4 md:p-5 rounded-xl border-2 transition-all hover:scale-[1.02] hover:shadow-md",
        colorClasses[color]
      )}
    >
      <Icon className="w-6 h-6 md:w-7 md:h-7 mb-2" />
      <span className="font-semibold text-sm text-foreground">{title}</span>
      <span className="text-xs text-muted-foreground">{subtitle}</span>
    </Link>
  )
}

// ── Trending Community Card ──────────────────────────────────

function TrendingCommunityCard({ item }: { item: TrendingItem }) {
  return (
    <Link href={item.href}>
      <Card className="group overflow-hidden hover:shadow-md transition-all hover:border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="w-12 h-12 rounded-lg border border-border">
              <AvatarImage src={item.imageUrl || undefined} alt={item.title} />
              <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold">
                {item.title.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {item.subtitle || "Community"}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <Users className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  {item.metric} {item.metricLabel}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// ── Trending Event Card ──────────────────────────────────────

function TrendingEventCard({ item }: { item: TrendingItem }) {
  return (
    <Link href={item.href}>
      <Card className="group overflow-hidden hover:shadow-md transition-all hover:border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex flex-col items-center justify-center border border-orange-100 dark:border-orange-900">
              <CalendarDays className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {item.subtitle || "Event"}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                  {item.metric} {item.metricLabel}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// ── Search Result Card ───────────────────────────────────────

function SearchResultCard({ result }: { result: SearchResult }) {
  const Icon = TYPE_ICONS[result.type] || Search
  const colors = TYPE_COLORS[result.type] || TYPE_COLORS.community

  return (
    <Link href={result.href}>
      <Card className="group h-full overflow-hidden hover:shadow-md transition-all hover:border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border",
                colors.bg,
                colors.border
              )}
            >
              <Icon className={cn("w-5 h-5", colors.text)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                  {result.title}
                </h3>
              </div>
              {result.subtitle && (
                <p className="text-xs text-muted-foreground truncate">
                  {result.subtitle}
                </p>
              )}
              <Badge
                variant="secondary"
                className={cn("text-[10px] mt-2 capitalize", colors.bg, colors.text)}
              >
                {result.type}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
