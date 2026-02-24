"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminOverview } from "./admin-overview"
import { AdminUsers } from "./admin-users"
import { AdminCommunities } from "./admin-communities"
import { AdminAuditLog } from "./admin-audit-log"
import type { PlatformStats, AdminUser, AdminCommunity } from "@/lib/actions/admin-actions"

const TAB_CLASS =
  "rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm"

interface AdminDashboardProps {
  stats: PlatformStats
  initialUsers: AdminUser[]
  initialUsersTotal: number
  initialCommunities: AdminCommunity[]
  initialCommunitiesTotal: number
  initialAuditEntries: {
    id: string
    actor_id: string
    actor_name: string | null
    target_user_id: string | null
    target_name: string | null
    community_id: string | null
    community_name: string | null
    action: string
    details: Record<string, unknown>
    created_at: string
  }[]
  initialAuditTotal: number
}

export function AdminDashboard({
  stats,
  initialUsers,
  initialUsersTotal,
  initialCommunities,
  initialCommunitiesTotal,
  initialAuditEntries,
  initialAuditTotal,
}: AdminDashboardProps) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0 gap-0">
        <TabsTrigger value="overview" className={TAB_CLASS}>
          Overview
        </TabsTrigger>
        <TabsTrigger value="users" className={TAB_CLASS}>
          Users
        </TabsTrigger>
        <TabsTrigger value="communities" className={TAB_CLASS}>
          Communities
        </TabsTrigger>
        <TabsTrigger value="audit" className={TAB_CLASS}>
          Audit Log
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-5">
        <AdminOverview stats={stats} />
      </TabsContent>

      <TabsContent value="users" className="mt-5">
        <AdminUsers
          initialUsers={initialUsers}
          initialTotal={initialUsersTotal}
        />
      </TabsContent>

      <TabsContent value="communities" className="mt-5">
        <AdminCommunities
          initialCommunities={initialCommunities}
          initialTotal={initialCommunitiesTotal}
        />
      </TabsContent>

      <TabsContent value="audit" className="mt-5">
        <AdminAuditLog
          initialEntries={initialAuditEntries}
          initialTotal={initialAuditTotal}
        />
      </TabsContent>
    </Tabs>
  )
}
