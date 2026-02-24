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
  console.log("[v0] AdminPage: checking superadmin...")
  await requireSuperAdmin()
  console.log("[v0] AdminPage: superadmin OK, fetching data...")

  let stats, usersResult, communitiesResult, auditResult
  try {
    stats = await getAdminStats()
    console.log("[v0] AdminPage: stats OK")
  } catch (e) {
    console.log("[v0] AdminPage: stats FAILED", e)
    throw e
  }
  try {
    usersResult = await getAllUsers({ limit: 50, offset: 0 })
    console.log("[v0] AdminPage: users OK")
  } catch (e) {
    console.log("[v0] AdminPage: users FAILED", e)
    throw e
  }
  try {
    communitiesResult = await getAllCommunities({ limit: 50, offset: 0 })
    console.log("[v0] AdminPage: communities OK")
  } catch (e) {
    console.log("[v0] AdminPage: communities FAILED", e)
    throw e
  }
  try {
    auditResult = await getGlobalAuditLog({ limit: 50, offset: 0 })
    console.log("[v0] AdminPage: audit OK")
  } catch (e) {
    console.log("[v0] AdminPage: audit FAILED", e)
    throw e
  }

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
