import Link from "next/link"
import { Plus, Search } from "lucide-react"
import { getAuthenticatedUser } from "@/lib/mock-user"
import { getHomeEvents } from "@/lib/actions/home-actions"
import { HomeSections } from "@/components/home/home-sections"

function getGreeting(name: string): string {
  const hour = new Date().getHours()
  const part =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
  const firstName = name.split(" ")[0]
  return `${part}, ${firstName}`
}

function formatTodayDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
}

export default async function HomePage() {
  const [user, sections] = await Promise.all([
    getAuthenticatedUser(),
    getHomeEvents(),
  ])

  const isGuest = !user

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 md:px-6 md:py-7 pb-24 md:pb-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            {user ? getGreeting(user.name) : "Community Circle"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {formatTodayDate()}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Explore link */}
          <Link
            href="/explore"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Explore</span>
          </Link>

          {/* Create event — available to all logged-in users */}
          {user && (
            <Link
              href="/events/create"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Event</span>
            </Link>
          )}
        </div>
      </div>

      {/* Event sections */}
      <HomeSections
        initialAttending={sections.attending}
        initialInterested={sections.interested}
        initialFromSpaces={sections.fromSpaces}
        initialDiscover={sections.discover}
        isGuest={isGuest}
      />
    </div>
  )
}
