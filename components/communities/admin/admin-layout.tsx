"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SettingsForm } from "./settings-form"
import { MemberManagement } from "./member-management"
import { AnalyticsDashboard } from "./analytics-dashboard"
import { RoleManager } from "./role-manager"
import { AuditLog } from "./audit-log"
import type { CommunityWithMeta, CommunityMember } from "@/types/community"
import type { AuditEntry } from "@/lib/actions/audit-actions"

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
  auditEntries: AuditEntry[]
  auditTotal: number
}

export function AdminLayout({
  community,
  members,
  membersCursor,
  membersHasMore,
  analytics,
  auditEntries,
  auditTotal,
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
        <TabsTrigger
          value="roles"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm"
        >
          Roles
        </TabsTrigger>
        <TabsTrigger
          value="audit"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm"
        >
          Audit Log
        </TabsTrigger>
      </TabsList>

      <TabsContent value="settings" className="mt-5">
        <SettingsForm community={community} />
      </TabsContent>

      <TabsContent value="members" className="mt-5">
        <MemberManagement
          communityId={community.id}
          currentUserRole={(community.current_user_role as "owner" | "admin" | "moderator" | "member") || "member"}
          initialMembers={members}
          initialCursor={membersCursor}
          initialHasMore={membersHasMore}
        />
      </TabsContent>

      <TabsContent value="analytics" className="mt-5">
        <AnalyticsDashboard data={analytics} />
      </TabsContent>

      <TabsContent value="roles" className="mt-5">
        <RoleManager />
      </TabsContent>

      <TabsContent value="audit" className="mt-5">
        <AuditLog
          communityId={community.id}
          initialEntries={auditEntries}
          initialTotal={auditTotal}
        />
      </TabsContent>
    </Tabs>
  )
}
