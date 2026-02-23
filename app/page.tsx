import Link from "next/link"
import { MapPin, ChevronRight, Search, TrendingUp, Users } from "lucide-react"
import { getCommunities } from "@/lib/actions/community-actions"
import { getAreas } from "@/lib/actions/area-actions"
import { getTrending, getUpcomingEvents } from "@/lib/actions/search-actions"
import { CommunityCard } from "@/components/communities/community-card"
import { AreaCard } from "@/components/areas/area-card"
import { UpcomingEventsList } from "@/components/events/upcoming-events"
import { Badge } from "@/components/ui/badge"

export default async function HomePage() {
  const [communities, areasResult, trending, upcomingEvents] = await Promise.all([
    getCommunities({ limit: 4 }),
    getAreas({ type: "city", limit: 4 }),
    getTrending(),
    getUpcomingEvents(6),
  ])

  const TYPE_ICONS: Record<string, React.ElementType> = {
    community: Users,
    event: Search,
  }

  return (
    <div className="px-4 py-5 md:px-6 lg:px-10 md:py-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground text-balance">
            Welcome to Community Circle
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
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

      {/* Areas discovery */}
      {areasResult.areas.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <MapPin className="w-4.5 h-4.5 text-primary" />
              Explore by Area
            </h2>
            <Link
              href="/areas"
              className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              View all
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {areasResult.areas.map((area) => (
              <AreaCard key={area.id} area={area} />
            ))}
          </div>
        </section>
      )}

      {/* Trending */}
      {trending.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4.5 h-4.5 text-primary" />
              Trending
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {trending.slice(0, 6).map((item) => {
              const Icon = TYPE_ICONS[item.type] || Users
              return (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={item.href}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted shrink-0">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
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
        </section>
      )}

      {/* Upcoming events */}
      <section className="mb-8">
        <UpcomingEventsList events={upcomingEvents} />
      </section>

      {/* Featured communities */}
      {communities.data.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-primary" />
              Featured Communities
            </h2>
            <Link
              href="/communities"
              className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              View all
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {communities.data.map((community) => (
              <CommunityCard key={community.id} community={community} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
