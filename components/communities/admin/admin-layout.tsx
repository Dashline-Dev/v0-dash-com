"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SettingsForm } from "./settings-form"
import { MemberManagement } from "./member-management"
import { AnalyticsDashboard } from "./analytics-dashboard"
import type { CommunityWithMeta, CommunityMember } from "@/types/community"

interface AdminLayoutProps {
  community: CommunityWithMeta
  members: CommunityMember[]
  membersCursor: string | null
  membersHasMore: boolean
  analytics: {
    stats: {
      active_members: number
      pending_members: number
      banned_members: number
      new_this_month: number
      new_this_week: number
    }
    roleBreakdown: { role: string; count: number }[]
  }
}

export function AdminLayout({
  community,
  members,
  membersCursor,
  membersHasMore,
  analytics,
}: AdminLayoutProps) {
  return (
    <Tabs defaultValue="settings" className="w-full">
      <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0 gap-0">
        <TabsTrigger
          value="settings"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm"
        >
          Settings
        </TabsTrigger>
        <TabsTrigger
          value="members"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm"
        >
          Members
        </TabsTrigger>
        <TabsTrigger
          value="analytics"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm"
        >
          Analytics
        </TabsTrigger>
      </TabsList>

      <TabsContent value="settings" className="mt-5">
        <SettingsForm community={community} />
      </TabsContent>

      <TabsContent value="members" className="mt-5">
        <MemberManagement
          communityId={community.id}
          initialMembers={members}
          initialCursor={membersCursor}
          initialHasMore={membersHasMore}
        />
      </TabsContent>

      <TabsContent value="analytics" className="mt-5">
        <AnalyticsDashboard data={analytics} />
      </TabsContent>
    </Tabs>
  )
}
