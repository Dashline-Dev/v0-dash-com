"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CommunityAbout } from "./community-about"
import { MemberList } from "./member-list"
import { RulesList } from "./rules-list"
import { CommunitySpaces } from "./community-spaces"
import { CommunityEvents } from "./community-events"
import { CommunityAnnouncements } from "./community-announcements"
import type { CommunityWithMeta, CommunityMember } from "@/types/community"
import type { SpaceWithMeta } from "@/types/space"
import type { EventWithMeta } from "@/types/event"
import type { AnnouncementWithMeta } from "@/types/announcement"
import type { AreaWithMeta } from "@/types/area"

interface CommunityTabsProps {
  community: CommunityWithMeta
  members: CommunityMember[]
  membersCursor: string | null
  membersHasMore: boolean
  spaces: SpaceWithMeta[]
  events: EventWithMeta[]
  announcements: AnnouncementWithMeta[]
  areas?: AreaWithMeta[]
  canCreateSpace?: boolean
}

export function CommunityTabs({
  community,
  members,
  membersCursor,
  membersHasMore,
  spaces,
  events,
  announcements,
  areas = [],
  canCreateSpace = false,
}: CommunityTabsProps) {
  return (
    <Tabs defaultValue="events" className="w-full">
      <TabsList className="w-full justify-start bg-transparent! rounded-none! h-auto p-0! gap-6 border-b border-border overflow-x-auto scrollbar-none">
        {[
          { value: "events", label: "Events", count: events.length },
          { value: "about", label: "About" },
          { value: "announcements", label: "Updates", count: announcements.length },
          { value: "spaces", label: "Spaces", count: spaces.length },
          { value: "members", label: "Members", count: members.length },
          { value: "rules", label: "Rules" },
        ].map(({ value, label, count }) => (
          <TabsTrigger
            key={value}
            value={value}
            className="relative shrink-0 bg-transparent! rounded-none! shadow-none! border-b-2 border-transparent -mb-px data-[state=active]:border-primary px-0 pb-3 pt-0 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground hover:text-foreground transition-colors whitespace-nowrap flex items-center gap-1.5 h-auto"
          >
            {label}
            {count !== undefined && count > 0 && (
              <span className="text-xs text-muted-foreground/70 font-normal">
                {count}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="about" className="mt-5">
        <CommunityAbout community={community} areas={areas} />
      </TabsContent>

      <TabsContent value="announcements" className="mt-5">
        <CommunityAnnouncements communitySlug={community.slug} announcements={announcements} />
      </TabsContent>

      <TabsContent value="events" className="mt-5">
        <CommunityEvents communitySlug={community.slug} communityId={community.id} events={events} />
      </TabsContent>

      <TabsContent value="spaces" className="mt-5">
        <CommunitySpaces communitySlug={community.slug} spaces={spaces} canCreate={canCreateSpace} />
      </TabsContent>

      <TabsContent value="members" className="mt-5">
        <MemberList
          communityId={community.id}
          initialMembers={members}
          initialCursor={membersCursor}
          initialHasMore={membersHasMore}
        />
      </TabsContent>

      <TabsContent value="rules" className="mt-5">
        <RulesList rules={community.rules} />
      </TabsContent>
    </Tabs>
  )
}
