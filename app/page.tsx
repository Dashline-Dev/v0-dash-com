import Link from "next/link"
import { MapPin, ChevronRight, Search, TrendingUp, Users } from "lucide-react"
import { getCommunities } from "@/lib/actions/community-actions"
import { getAreas } from "@/lib/actions/area-actions"
import { getTrending, getUpcomingEvents } from "@/lib/actions/search-actions"
import { CommunityCard } from "@/components/communities/community-card"
import { UpcomingEventsList } from "@/components/events/upcoming-events"

export default async function HomePage() {
  const [communities, areasResult, trending, upcomingEvents] = await Promise.all([
    getCommunities({ limit: 8 }),
    getAreas({ type: "city", limit: 8 }),
    getTrending(),
    getUpcomingEvents(8),
  ])

  return (
    <div className="px-4 py-5 md:px-6 lg:px-10 md:py-8 pb-24 md:pb-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground text-balance">
            Community Circle
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Discover events, communities, and areas near you
          </p>
        </div>
        <Link
          href="/explore"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary/50 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Explore</span>
        </Link>
      </div>

      {/* Areas -- horizontal scrollable pills */}
      {areasResult.areas.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              Explore by Area
            </h2>
            <Link
              href="/areas"
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5"
            >
              All
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
            {areasResult.areas.map((area) => (
              <Link
                key={area.id}
                href={`/areas/${area.slug}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-sm text-foreground hover:bg-accent/50 hover:border-primary/30 transition-colors shrink-0"
              >
                <MapPin className="w-3 h-3 text-primary" />
                {area.name}
                <span className="text-xs text-muted-foreground">
                  {area.community_count}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trending -- compact row list */}
      {trending.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              Trending
            </h2>
          </div>
          <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
            {trending.slice(0, 6).map((item) => (
              <Link
                key={`${item.type}-${item.id}`}
                href={item.href}
                className="flex items-center gap-3 py-2 px-3 hover:bg-accent/50 transition-colors group"
              >
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted shrink-0">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {item.title}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {item.subtitle}
                </span>
                <span className="text-xs font-medium text-foreground shrink-0">
                  {item.metric} {item.metricLabel}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming events */}
      <section className="mb-6">
        <UpcomingEventsList events={upcomingEvents} />
      </section>

      {/* Featured communities -- row list */}
      {communities.data.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              Featured Communities
            </h2>
            <Link
              href="/communities"
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5"
            >
              All
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
            {communities.data.map((community) => (
              <CommunityCard key={community.id} community={community} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
