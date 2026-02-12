"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CommunityAbout } from "./community-about"
import { MemberList } from "./member-list"
import { RulesList } from "./rules-list"
import { CommunitySpaces } from "./community-spaces"
import type { CommunityWithMeta, CommunityMember } from "@/types/community"
import type { SpaceWithMeta } from "@/types/space"

interface CommunityTabsProps {
  community: CommunityWithMeta
  members: CommunityMember[]
  membersCursor: string | null
  membersHasMore: boolean
  spaces: SpaceWithMeta[]
}

export function CommunityTabs({
  community,
  members,
  membersCursor,
  membersHasMore,
  spaces,
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
        <CommunityAbout community={community} />
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
