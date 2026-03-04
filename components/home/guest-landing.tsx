"use client"

import { useState } from "react"
import Link from "next/link"
import {
  CalendarDays,
  Users,
  Layers,
  MapPin,
  Clock,
  Globe,
  Video,
  BadgeCheck,
  ArrowRight,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { EventWithMeta } from "@/types/event"
import type { CommunityListItem } from "@/types/community"

// ── Types ──────────────────────────────────────────────────────────────

interface GuestLandingProps {
  topEvents: EventWithMeta[]
  topCommunities: CommunityListItem[]
  totalEvents: number
  totalCommunities: number
}

// ── Helpers ─────────────────────────────────────────────────────────────

function formatDate(str: string) {
  const d = new Date(str)
  return {
    day: d.getDate().toString(),
    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  }
}

const TYPE_ICON = {
  virtual: Video,
  hybrid: Globe,
  in_person: MapPin,
}

const CATEGORY_COLORS: Record<string, string> = {
  technology: "text-blue-600 dark:text-blue-400",
  sports: "text-green-600 dark:text-green-400",
  arts: "text-pink-600 dark:text-pink-400",
  neighborhood: "text-amber-600 dark:text-amber-400",
  wellness: "text-teal-600 dark:text-teal-400",
  education: "text-indigo-600 dark:text-indigo-400",
  music: "text-fuchsia-600 dark:text-fuchsia-400",
  food: "text-orange-600 dark:text-orange-400",
  gaming: "text-cyan-600 dark:text-cyan-400",
  business: "text-slate-600 dark:text-slate-400",
  social: "text-rose-600 dark:text-rose-400",
  general: "text-muted-foreground",
}

// ── Sub-components ──────────────────────────────────────────────────────

function GuestEventRow({ event }: { event: EventWithMeta }) {
  const { day, month, weekday, time } = formatDate(event.start_time)
  const LocationIcon = TYPE_ICON[event.event_type] ?? MapPin

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/40 transition-colors group">
      {/* Date badge */}
      <div className="flex flex-col items-center justify-center rounded-md bg-primary/8 px-2 py-1.5 min-w-[2.75rem] shrink-0 text-center">
        <span className="text-[9px] font-bold tracking-widest text-primary leading-tight uppercase">
          {month}
        </span>
        <span className="text-lg font-bold text-foreground leading-tight">{day}</span>
        <span className="text-[9px] text-muted-foreground leading-tight">{weekday}</span>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/events/${event.slug}`}
          className="text-sm font-medium text-foreground truncate block group-hover:text-primary transition-colors"
        >
          {event.title}
        </Link>
        <div className="flex items-center gap-2.5 mt-0.5 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-0.5">
            <Clock className="w-3 h-3 shrink-0" />
            {time}
          </span>
          {(event.location_name || event.event_type !== "in_person") && (
            <span className="flex items-center gap-0.5 truncate max-w-[160px]">
              <LocationIcon className="w-3 h-3 shrink-0" />
              <span className="truncate">
                {event.event_type === "virtual"
                  ? "Virtual"
                  : event.event_type === "hybrid"
                  ? event.location_name ?? "Hybrid"
                  : event.location_name}
              </span>
            </span>
          )}
          {event.community_name && (
            <span className="text-muted-foreground/70 truncate hidden sm:inline">
              {event.community_name}
            </span>
          )}
        </div>
      </div>

      {/* Gated RSVP */}
      <div className="shrink-0">
        <Link
          href="/signup"
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors whitespace-nowrap"
        >
          RSVP
          <ArrowRight className="w-2.5 h-2.5" />
        </Link>
      </div>
    </div>
  )
}

function GuestCommunityRow({ community }: { community: CommunityListItem }) {
  const categoryColor =
    CATEGORY_COLORS[community.category] || CATEGORY_COLORS.general

  return (
    <Link
      href="/signup"
      className="group flex items-center gap-3 py-2.5 px-3 border-b border-border last:border-b-0 transition-colors hover:bg-accent/50"
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-primary/10 overflow-hidden shrink-0">
        {community.avatar_url ? (
          <img
            src={community.avatar_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-primary text-xs font-bold">
            {community.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {community.name}
          </h3>
          {community.is_verified && (
            <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />
          )}
          <span className={cn("text-[11px] font-medium shrink-0", categoryColor)}>
            {community.category}
          </span>
        </div>
        {community.description && (
          <p className="text-xs text-muted-foreground truncate leading-snug mt-0.5">
            {community.description}
          </p>
        )}
      </div>

      {/* Members */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
        <Users className="w-3 h-3" />
        {community.member_count.toLocaleString()}
      </div>
    </Link>
  )
}

// ── Main Component ──────────────────────────────────────────────────────

export function GuestLanding({
  topEvents,
  topCommunities,
  totalEvents,
  totalCommunities,
}: GuestLandingProps) {
  const [bannerDismissed, setBannerDismissed] = useState(false)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:px-6 md:py-12 pb-28 md:pb-16">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="text-center mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/8 text-primary text-xs font-medium mb-5">
          <Layers className="w-3 h-3" />
          Community Circle
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground text-balance leading-tight mb-4">
          Your communities,{" "}
          <span className="text-primary">all in one place</span>
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-8 text-pretty">
          Discover local events, join communities that share your passions, and
          stay connected to everything that matters to you.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          <Link
            href="/signup"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Get started — it&apos;s free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/signin"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            Sign in
          </Link>
        </div>

        {/* Stats bar */}
        {(totalCommunities > 0 || totalEvents > 0) && (
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            {totalCommunities > 0 && (
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary/60" />
                <strong className="text-foreground font-semibold">
                  {totalCommunities.toLocaleString()}
                </strong>{" "}
                communities
              </span>
            )}
            {totalCommunities > 0 && totalEvents > 0 && (
              <span className="text-border">·</span>
            )}
            {totalEvents > 0 && (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-primary/60" />
                <strong className="text-foreground font-semibold">
                  {totalEvents.toLocaleString()}
                </strong>{" "}
                upcoming events
              </span>
            )}
          </div>
        )}
      </section>

      {/* ── Feature Strip ────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        {[
          {
            icon: CalendarDays,
            title: "Discover Events",
            desc: "Browse upcoming public events in your area or online — from meetups to concerts.",
          },
          {
            icon: Users,
            title: "Join Communities",
            desc: "Find and join spaces built around shared interests, neighborhoods, and more.",
          },
          {
            icon: Layers,
            title: "Create Spaces",
            desc: "Start your own community, host events, and grow an audience around what you love.",
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="flex flex-col gap-3 p-5 rounded-xl border border-border bg-card"
          >
            <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
              <Icon className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-1">{title}</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── Upcoming Events ───────────────────────────────────────────── */}
      {topEvents.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground">
              What&apos;s happening
            </h2>
            <Link
              href="/signup"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              See all
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="relative rounded-xl border border-border bg-card overflow-hidden">
            <div className="divide-y divide-border">
              {topEvents.map((event) => (
                <GuestEventRow key={event.id} event={event} />
              ))}
            </div>

            {/* Fade/blur gate overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-card to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center pb-3">
              <Link
                href="/signup"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-sm hover:bg-primary/90 transition-colors"
              >
                Sign up to see all events
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Communities ───────────────────────────────────────────────── */}
      {topCommunities.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground">
              Popular communities
            </h2>
            <Link
              href="/signup"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Browse all
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="relative rounded-xl border border-border bg-card overflow-hidden">
            <div>
              {topCommunities.map((community) => (
                <GuestCommunityRow key={community.id} community={community} />
              ))}
            </div>

            {/* Fade/blur gate overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-card to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center pb-3">
              <Link
                href="/signup"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-sm hover:bg-primary/90 transition-colors"
              >
                Join the conversation
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Bottom inline CTA (desktop) ───────────────────────────────── */}
      <section className="hidden md:flex flex-col items-center text-center gap-4 py-10 border-t border-border">
        <h2 className="text-xl font-bold text-foreground">Ready to join?</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Create a free account to RSVP to events, join communities, and connect
          with people around you.
        </p>
        <Link
          href="/signup"
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Create free account
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* ── Sticky mobile sign-up banner ──────────────────────────────── */}
      {!bannerDismissed && (
        <div
          className={cn(
            "fixed bottom-16 left-0 right-0 z-40 md:hidden",
            "px-4 pb-3"
          )}
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-primary-foreground shadow-lg border border-primary/20">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">Ready to join?</p>
              <p className="text-xs text-primary-foreground/80 mt-0.5">
                Create a free account to get started.
              </p>
            </div>
            <Link
              href="/signup"
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-foreground text-primary text-xs font-semibold hover:bg-primary-foreground/90 transition-colors"
            >
              Sign up
              <ArrowRight className="w-3 h-3" />
            </Link>
            <button
              onClick={() => setBannerDismissed(true)}
              aria-label="Dismiss sign-up banner"
              className="shrink-0 p-1 rounded-md text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
