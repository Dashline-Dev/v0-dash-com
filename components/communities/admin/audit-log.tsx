"use client"

import { useState, useCallback } from "react"
import { Loader2, Shield, UserMinus, UserPlus, Settings, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getAuditLog, type AuditEntry } from "@/lib/actions/audit-actions"

const ACTION_CONFIG: Record<
  string,
  { label: string; icon: typeof Shield; color: string }
> = {
  role_changed: {
    label: "Role Changed",
    icon: Shield,
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  member_removed: {
    label: "Member Removed",
    icon: UserMinus,
    color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  },
  member_banned: {
    label: "Member Banned",
    icon: UserMinus,
    color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  },
  member_approved: {
    label: "Member Approved",
    icon: UserPlus,
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  settings_updated: {
    label: "Settings Updated",
    icon: Settings,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
}

const DEFAULT_CONFIG = {
  label: "Action",
  icon: Clock,
  color: "bg-secondary text-secondary-foreground",
}

interface AuditLogProps {
  communityId: string
  initialEntries: AuditEntry[]
  initialTotal: number
}

export function AuditLog({
  communityId,
  initialEntries,
  initialTotal,
}: AuditLogProps) {
  const [entries, setEntries] = useState(initialEntries)
  const [total] = useState(initialTotal)
  const [loading, setLoading] = useState(false)

  const loadMore = useCallback(async () => {
    if (loading) return
    setLoading(true)
    try {
      const result = await getAuditLog(communityId, 50, entries.length)
      setEntries((prev) => [...prev, ...result.entries])
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [communityId, entries.length, loading])

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          No audit events recorded yet.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Role changes, member removals, and other admin actions will appear
          here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between py-2 px-3 text-xs font-medium text-muted-foreground">
        <span>
          {total} event{total !== 1 ? "s" : ""}
        </span>
      </div>

      {entries.map((entry) => {
        const config = ACTION_CONFIG[entry.action] || DEFAULT_CONFIG
        const Icon = config.icon
        const details = entry.details || {}

        return (
          <div
            key={entry.id}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <div className="mt-0.5 p-1.5 rounded-md bg-secondary/80">
              <Icon className="w-3.5 h-3.5 text-muted-foreground" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className={`text-[10px] ${config.color}`}>
                  {config.label}
                </Badge>
                {details.from && details.to && (
                  <span className="text-xs text-muted-foreground">
                    {String(details.from)} &rarr; {String(details.to)}
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground mt-1">
                <span className="font-medium">
                  {entry.actor_name || `User ${entry.actor_id.slice(-6)}`}
                </span>
                {entry.target_name && (
                  <>
                    {" acted on "}
                    <span className="font-medium">
                      {entry.target_name || `User ${entry.target_user_id?.slice(-6)}`}
                    </span>
                  </>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(entry.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        )
      })}

      {entries.length < total && (
        <div className="flex justify-center pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Load more"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
