"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Loader2, Shield, UserMinus } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  getCommunityMembers,
  updateMemberRole,
  removeMember,
} from "@/lib/actions/community-actions"
import type { CommunityMember, MemberRole } from "@/types/community"
import { MEMBER_ROLE_LABELS } from "@/types/community"

interface MemberManagementProps {
  communityId: string
  initialMembers: CommunityMember[]
  initialCursor: string | null
  initialHasMore: boolean
}

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-primary/10 text-primary",
  admin: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  moderator: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  member: "bg-secondary text-secondary-foreground",
}

export function MemberManagement({
  communityId,
  initialMembers,
  initialCursor,
  initialHasMore,
}: MemberManagementProps) {
  const router = useRouter()
  const [members, setMembers] = useState(initialMembers)
  const [cursor, setCursor] = useState(initialCursor)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const result = await getCommunityMembers(communityId, cursor)
      setMembers((prev) => [...prev, ...result.data])
      setCursor(result.nextCursor)
      setHasMore(result.hasMore)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [communityId, cursor, hasMore, loading])

  const handleRoleChange = async (memberId: string, role: MemberRole) => {
    setActionLoading(memberId)
    await updateMemberRole(memberId, role)
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role } : m))
    )
    setActionLoading(null)
    router.refresh()
  }

  const handleRemove = async (memberId: string) => {
    setActionLoading(memberId)
    await removeMember(memberId)
    setMembers((prev) => prev.filter((m) => m.id !== memberId))
    setActionLoading(null)
    router.refresh()
  }

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <span>Member</span>
        <span>Actions</span>
      </div>

      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
        >
          <Avatar className="w-9 h-9">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {member.user_id.slice(-2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {member.user_id}
            </p>
            <p className="text-xs text-muted-foreground">
              Joined{" "}
              {new Date(member.joined_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>

          <Badge
            variant="secondary"
            className={`text-[10px] shrink-0 ${ROLE_COLORS[member.role] || ""}`}
          >
            {MEMBER_ROLE_LABELS[member.role]}
          </Badge>

          {member.role !== "owner" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  disabled={actionLoading === member.id}
                >
                  {actionLoading === member.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MoreHorizontal className="w-4 h-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleRoleChange(member.id, "admin")}>
                  <Shield className="w-4 h-4 mr-2" />
                  Make Admin
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRoleChange(member.id, "moderator")}>
                  <Shield className="w-4 h-4 mr-2" />
                  Make Moderator
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRoleChange(member.id, "member")}>
                  <Shield className="w-4 h-4 mr-2" />
                  Set as Member
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleRemove(member.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <UserMinus className="w-4 h-4 mr-2" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ))}

      {members.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No members found.
        </p>
      )}

      {hasMore && (
        <div className="flex justify-center pt-3">
          <Button variant="ghost" size="sm" onClick={loadMore} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Show more"}
          </Button>
        </div>
      )}
    </div>
  )
}
