"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getGlobalAuditLog } from "@/lib/actions/admin-actions"

interface AuditEntry {
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
}

interface AdminAuditLogProps {
  initialEntries: AuditEntry[]
  initialTotal: number
}

const ACTION_COLORS: Record<string, string> = {
  superadmin_granted:
    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  superadmin_revoked:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  community_verified:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  community_unverified:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  user_deleted_by_admin:
    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  community_deleted_by_admin:
    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  role_updated:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  member_removed:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
}

function formatAction(action: string): string {
  return action
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function AdminAuditLog({
  initialEntries,
  initialTotal,
}: AdminAuditLogProps) {
  const [entries, setEntries] = useState(initialEntries)
  const [total] = useState(initialTotal)
  const [loading, setLoading] = useState(false)
  const [offset, setOffset] = useState(0)
  const limit = 50
  const hasMore = entries.length < total

  const loadMore = async () => {
    setLoading(true)
    try {
      const newOffset = offset + limit
      const result = await getGlobalAuditLog({ limit, offset: newOffset })
      setEntries((prev) => [...prev, ...result.entries])
      setOffset(newOffset)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {total} audit event{total !== 1 ? "s" : ""} total
      </p>

      <div className="space-y-1">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="secondary"
                  className={`text-[10px] shrink-0 ${ACTION_COLORS[entry.action] || "bg-secondary text-secondary-foreground"}`}
                >
                  {formatAction(entry.action)}
                </Badge>
                {entry.community_name && (
                  <span className="text-xs text-muted-foreground">
                    in {entry.community_name}
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground mt-1">
                <span className="font-medium">
                  {entry.actor_name || "System"}
                </span>
                {entry.target_name && (
                  <>
                    {" "}
                    &rarr;{" "}
                    <span className="font-medium">{entry.target_name}</span>
                  </>
                )}
              </p>
              {Object.keys(entry.details).length > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {Object.entries(entry.details)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(", ")}
                </p>
              )}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
              {new Date(entry.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        ))}

        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No audit events recorded yet.
          </p>
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Show more"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
