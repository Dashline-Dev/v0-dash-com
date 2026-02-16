"use client"

import { useState } from "react"
import { MessageCircle, Calendar, FileText, Users, Megaphone } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SpaceWithMeta, SpaceMember } from "@/types/space"
import { SPACE_MEMBER_ROLE_LABELS, type SpaceMemberRole } from "@/types/space"
import type { EventWithMeta } from "@/types/event"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { EventCard } from "@/components/events/event-card"
import { AnnouncementCard } from "@/components/announcements/announcement-card"
import type { AnnouncementWithMeta } from "@/types/announcement"

type Tab = "about" | "calendar" | "members"

interface SpaceDetailProps {
  space: SpaceWithMeta
  members: SpaceMember[]
  events?: EventWithMeta[]
  announcements?: AnnouncementWithMeta[]
}

export function SpaceDetail({ space, members, events = [], announcements = [] }: SpaceDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>("about")

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "about", label: "About", icon: <FileText className="w-4 h-4" /> },
    { id: "calendar", label: "Calendar", icon: <Calendar className="w-4 h-4" /> },
    { id: "members", label: "Members", icon: <Users className="w-4 h-4" /> },
  ]

  return (
    <div className="px-4 md:px-6 lg:px-10 py-6">
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-border mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.id
                ? "text-primary border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground hover:border-border"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "about" && <AboutTab space={space} announcements={announcements} />}
      {activeTab === "calendar" && <CalendarTab events={events} />}
      {activeTab === "members" && <MembersTab members={members} />}
    </div>
  )
}

// ─── About Tab ──────────────────────────────────────────────────────────────

function AboutTab({ space, announcements = [] }: { space: SpaceWithMeta; announcements?: AnnouncementWithMeta[] }) {
  return (
    <div className="max-w-2xl space-y-6">
      {/* Description */}
      {space.description && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-2">Description</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{space.description}</p>
        </div>
      )}

      {/* Details */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Details</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Type</dt>
            <dd className="font-medium text-foreground capitalize">{space.type}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Visibility</dt>
            <dd className="font-medium text-foreground capitalize">{space.visibility.replace("_", " ")}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Members</dt>
            <dd className="font-medium text-foreground">{space.member_count}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Created</dt>
            <dd className="font-medium text-foreground">
              {new Date(space.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </dd>
          </div>
        </dl>
      </div>

      {/* ── Extension Point: Events ────────────────────────────────────── */}
      {/* When the Events module is built, add an upcoming events section here:
          <SpaceUpcomingEvents spaceId={space.id} />
      */}
      <div className="rounded-lg border border-dashed border-border p-6 text-center">
        <MessageCircle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm font-medium text-muted-foreground">Discussion Feed</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Posts and discussions coming soon
        </p>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <Megaphone className="w-4 h-4" />
            Announcements
          </h2>
          <div className="flex flex-col gap-2">
            {announcements.map((a) => (
              <AnnouncementCard key={a.id} announcement={a} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Calendar Tab ───────────────────────────────────────────────────────────

function CalendarTab({ events }: { events: EventWithMeta[] }) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Calendar className="w-12 h-12 text-muted-foreground/30 mb-3" />
        <p className="text-lg font-medium text-foreground">No events yet</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Events published to this space will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3 max-w-2xl">
      {events.map((event) => (
        <EventCard key={event.id} event={event} href={`/events/${event.slug}`} />
      ))}
    </div>
  )
}

// ─── Members Tab ────────────────────────────────────────────────────────────

function MembersTab({ members }: { members: SpaceMember[] }) {
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Users className="w-12 h-12 text-muted-foreground/30 mb-3" />
        <p className="text-lg font-medium text-foreground">No members yet</p>
        <p className="text-sm text-muted-foreground mt-1">Be the first to join this space</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-w-2xl">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30"
        >
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {member.user_id.slice(-2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{member.user_id}</p>
            <p className="text-xs text-muted-foreground">
              Joined {new Date(member.joined_at).toLocaleDateString()}
            </p>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            {SPACE_MEMBER_ROLE_LABELS[member.role]}
          </Badge>
        </div>
      ))}
    </div>
  )
}
