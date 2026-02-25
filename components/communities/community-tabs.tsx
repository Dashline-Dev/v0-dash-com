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
}: CommunityTabsProps) {
  return (
    <Tabs defaultValue="about" className="w-full">
      <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0 gap-0">
        <TabsTrigger
          value="about"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm"
        >
          About
        </TabsTrigger>
        <TabsTrigger
          value="members"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm"
        >
          Members
        </TabsTrigger>
        <TabsTrigger
          value="announcements"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm"
        >
          Updates
        </TabsTrigger>
        <TabsTrigger
          value="events"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm"
        >
          Events
        </TabsTrigger>
        <TabsTrigger
          value="spaces"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm"
        >
          Spaces
        </TabsTrigger>
        <TabsTrigger
          value="rules"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm"
        >
          Rules
        </TabsTrigger>
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
        <CommunitySpaces communitySlug={community.slug} spaces={spaces} />
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
