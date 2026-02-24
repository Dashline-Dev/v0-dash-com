import { requireSuperAdmin } from "@/lib/superadmin"
import {
  getAdminStats,
  getAllUsers,
  getAllCommunities,
  getGlobalAuditLog,
} from "@/lib/actions/admin-actions"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin Console - Community Circle",
  description: "Platform administration and management.",
}

export default async function AdminPage() {
  await requireSuperAdmin()

  const [stats, usersResult, communitiesResult, auditResult] =
    await Promise.all([
      getAdminStats(),
      getAllUsers({ limit: 50, offset: 0 }),
      getAllCommunities({ limit: 50, offset: 0 }),
      getGlobalAuditLog({ limit: 50, offset: 0 }),
    ])

  return (
    <div className="px-4 py-5 md:px-6 lg:px-10 md:py-8">
      <div className="max-w-5xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground">Admin Console</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Platform-wide administration and monitoring
          </p>
        </div>

        <AdminDashboard
          stats={stats}
          initialUsers={usersResult.users}
          initialUsersTotal={usersResult.total}
          initialCommunities={communitiesResult.communities}
          initialCommunitiesTotal={communitiesResult.total}
          initialAuditEntries={auditResult.entries}
          initialAuditTotal={auditResult.total}
        />
      </div>
    </div>
  )
}
