"use client"

import { useState } from "react"
import Link from "next/link"
import {
  CalendarDays,
  Users,
  MapPin,
  Clock,
  Globe,
  Video,
  BadgeCheck,
  ArrowRight,
  X,
  Ticket,
  Bell,
  MessageSquare,
  Layers,
  BarChart2,
  Megaphone,
  Mail,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

function formatDate(str: string, timezone?: string | null) {
  const d = new Date(str)
  // Use the event's timezone (or UTC fallback) for consistent SSR/client rendering
  const tz = timezone || "UTC"
  return {
    day: d.toLocaleDateString("en-US", { day: "numeric", timeZone: tz }),
    month: d.toLocaleDateString("en-US", { month: "short", timeZone: tz }).toUpperCase(),
    weekday: d.toLocaleDateString("en-US", { weekday: "short", timeZone: tz }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz }),
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

// ── Sign-up Modal ────────────────────────────────────────────────────────

function SignUpModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-sm p-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="w-4 h-4" />
        </button>

        <DialogHeader className="text-center items-center">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground text-lg font-bold mb-2 select-none">
            CC
          </span>
          <DialogTitle className="text-xl">Create a free account</DialogTitle>
          <DialogDescription>
            Join Community Circle to RSVP, join spaces, and stay connected.
          </DialogDescription>
        </DialogHeader>

        <form method="POST" action="/api/auth/signup" className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="modal-name">Full name</Label>
            <Input
              id="modal-name"
              name="name"
              type="text"
              placeholder="Jane Smith"
              required
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-email">Email</Label>
            <Input
              id="modal-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-password">Password</Label>
            <Input
              id="modal-password"
              name="password"
              type="password"
              placeholder="Create a password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" className="w-full">
            Get started — it&apos;s free
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="text-primary font-medium hover:underline"
            onClick={onClose}
          >
            Sign in
          </Link>
        </p>
      </DialogContent>
    </Dialog>
  )
}

// ── Feature tabs ─────────────────────────────────────────────────────────

const PARTICIPANT_FEATURES = [
  {
    icon: CalendarDays,
    title: "Discover events near you",
    desc: "Browse public events in your city or online, filtered by what you care about.",
  },
  {
    icon: Ticket,
    title: "RSVP in one tap",
    desc: "Reserve your spot instantly. Your upcoming events live in one organized feed.",
  },
  {
    icon: Users,
    title: "Join communities",
    desc: "Find spaces built around shared interests — neighborhoods, hobbies, and more.",
  },
  {
    icon: Bell,
    title: "Never miss a thing",
    desc: "Get notified when communities you follow post new events or announcements.",
  },
  {
    icon: MessageSquare,
    title: "Connect with members",
    desc: "Chat and engage with people who share your interests inside each space.",
  },
  {
    icon: Sparkles,
    title: "Personalized for you",
    desc: "The more you engage, the better your feed gets at surfacing what matters.",
  },
]

const HOST_FEATURES = [
  {
    icon: Layers,
    title: "Create your own space",
    desc: "Launch a community around any topic. Set it as public, private, or invite-only.",
  },
  {
    icon: CalendarDays,
    title: "Host events with ease",
    desc: "Create in-person, virtual, or hybrid events with ticketing, capacity, and more.",
  },
  {
    icon: BarChart2,
    title: "Track attendance",
    desc: "See who is coming, manage RSVPs, and monitor interest across your events.",
  },
  {
    icon: Megaphone,
    title: "Reach your audience",
    desc: "Post announcements and updates directly to your community members.",
  },
  {
    icon: Mail,
    title: "Grow your following",
    desc: "Members who join your space get notified of every new event you create.",
  },
  {
    icon: BadgeCheck,
    title: "Verified host badge",
    desc: "Build credibility with a verified badge once your community gains traction.",
  },
]

function FeatureTabs({ onSignUp }: { onSignUp: () => void }) {
  const [tab, setTab] = useState<"participant" | "host">("participant")
  const features = tab === "participant" ? PARTICIPANT_FEATURES : HOST_FEATURES

  return (
    <section className="mb-12">
      {/* Tab switcher */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary border border-border">
          <button
            onClick={() => setTab("participant")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
              tab === "participant"
                ? "bg-background text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            For Participants
          </button>
          <button
            onClick={() => setTab("host")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
              tab === "host"
                ? "bg-background text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            For Hosts
          </button>
        </div>
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {features.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="flex flex-col gap-2.5 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-0.5">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Inline CTA below features */}
      <div className="flex justify-center mt-6">
        <button
          onClick={onSignUp}
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          {tab === "participant" ? "Start discovering events" : "Launch your community"}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  )
}

// ── Event row ────────────────────────────────────────────────────────────

function GuestEventRow({
  event,
  onSignUp,
}: {
  event: EventWithMeta
  onSignUp: () => void
}) {
  const { day, month, weekday, time } = formatDate(event.start_time, event.timezone)
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
        <button
          onClick={onSignUp}
          className="text-sm font-medium text-foreground truncate block group-hover:text-primary transition-colors text-left w-full"
        >
          {event.title}
        </button>
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
                  ? (event.location_name ?? "Hybrid")
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
        <button
          onClick={onSignUp}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors whitespace-nowrap"
        >
          RSVP
          <ArrowRight className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  )
}

// ── Community row ────────────────────────────────────────────────────────

function GuestCommunityRow({
  community,
  onSignUp,
}: {
  community: CommunityListItem
  onSignUp: () => void
}) {
  const categoryColor =
    CATEGORY_COLORS[community.category] || CATEGORY_COLORS.general

  return (
    <button
      onClick={onSignUp}
      className="group flex items-center gap-3 py-2.5 px-3 border-b border-border last:border-b-0 transition-colors hover:bg-accent/50 w-full text-left"
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
    </button>
  )
}

// ── Main Component ──────────────────────────────────────────────────────

export function GuestLanding({
  topEvents,
  topCommunities,
}: GuestLandingProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)

  const openModal = () => setModalOpen(true)
  const closeModal = () => setModalOpen(false)

  return (
    <>
      <SignUpModal open={modalOpen} onClose={closeModal} />

      <div className="max-w-4xl mx-auto px-4 py-8 md:px-6 md:py-12 pb-28 md:pb-16">

        {/* ── Hero ───────────────────────────────────────────────────── */}
        <section className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground text-balance leading-tight mb-4">
            Your communities,{" "}
            <span className="text-primary">all in one place</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-8 text-pretty">
            Discover local events, join communities that share your passions, and
            stay connected to everything that matters to you.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={openModal}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Get started — it&apos;s free
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              href="/signin"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              Sign in
            </Link>
          </div>
        </section>

        {/* ── Feature Tabs ───────────────────────────────────────────── */}
        <FeatureTabs onSignUp={openModal} />

        {/* ── Upcoming Events ─────────────────────────────────────────── */}
        {topEvents.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-foreground">
                What&apos;s happening
              </h2>
              <button
                onClick={openModal}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                See all
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="relative rounded-xl border border-border bg-card overflow-hidden">
              <div className="divide-y divide-border">
                {topEvents.map((event) => (
                  <GuestEventRow key={event.id} event={event} onSignUp={openModal} />
                ))}
              </div>

              {/* Fade gate */}
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card to-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center pb-3">
                <button
                  onClick={openModal}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-sm hover:bg-primary/90 transition-colors"
                >
                  Sign up to see all events
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── Communities ─────────────────────────────────────────────── */}
        {topCommunities.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-foreground">
                Popular communities
              </h2>
              <button
                onClick={openModal}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Browse all
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="relative rounded-xl border border-border bg-card overflow-hidden">
              <div>
                {topCommunities.map((community) => (
                  <GuestCommunityRow
                    key={community.id}
                    community={community}
                    onSignUp={openModal}
                  />
                ))}
              </div>

              {/* Fade gate */}
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card to-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center pb-3">
                <button
                  onClick={openModal}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-sm hover:bg-primary/90 transition-colors"
                >
                  Join the conversation
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── Bottom CTA (desktop) ────────────────────────────────────── */}
        <section className="hidden md:flex flex-col items-center text-center gap-4 py-10 border-t border-border">
          <h2 className="text-xl font-bold text-foreground">Ready to join?</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Create a free account to RSVP to events, join communities, and connect
            with people around you.
          </p>
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Create free account
            <ArrowRight className="w-4 h-4" />
          </button>
        </section>
      </div>

      {/* ── Sticky mobile banner ────────────────────────────────────────── */}
      {!bannerDismissed && (
        <div className="fixed bottom-16 left-0 right-0 z-40 md:hidden px-4 pb-3">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-primary-foreground shadow-lg border border-primary/20">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">Ready to join?</p>
              <p className="text-xs text-primary-foreground/80 mt-0.5">
                Create a free account to get started.
              </p>
            </div>
            <button
              onClick={openModal}
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-foreground text-primary text-xs font-semibold hover:bg-primary-foreground/90 transition-colors"
            >
              Sign up
              <ArrowRight className="w-3 h-3" />
            </button>
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
    </>
  )
}
