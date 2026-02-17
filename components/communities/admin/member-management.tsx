"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  MoreHorizontal,
  Loader2,
  Shield,
  UserMinus,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  getCommunityMembers,
  updateMemberRole,
  removeMember,
} from "@/lib/actions/community-actions"
import type { CommunityMember, MemberRole } from "@/types/community"
import {
  ROLE_LABELS,
  ROLE_COLORS,
  canModifyMember,
  getAssignableRoles,
  type Role,
} from "@/lib/permissions"

interface MemberManagementProps {
  communityId: string
  currentUserRole: Role
  initialMembers: CommunityMember[]
  initialCursor: string | null
  initialHasMore: boolean
}

export function MemberManagement({
  communityId,
  currentUserRole,
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

  const assignableRoles = getAssignableRoles(currentUserRole)

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
    const result = await updateMemberRole(memberId, role)
    if (result.success) {
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role } : m))
      )
    }
    setActionLoading(null)
    router.refresh()
  }

  const handleRemove = async (memberId: string) => {
    setActionLoading(memberId)
    const result = await removeMember(memberId)
    if (result.success) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId))
    }
    setActionLoading(null)
    router.refresh()
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <span>{members.length} member{members.length !== 1 ? "s" : ""}</span>
      </div>

      {members.map((member) => {
        const memberRole = member.role as Role
        const name = member.display_name || `User ${member.user_id.slice(-6)}`
        const initials = name.slice(0, 2).toUpperCase()
        const canModify = canModifyMember(currentUserRole, memberRole)

        return (
          <div
            key={member.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <Avatar className="w-9 h-9">
              {member.avatar_url && (
                <AvatarImage src={member.avatar_url} alt={name} />
              )}
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {name}
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
              className={`text-[10px] shrink-0 ${ROLE_COLORS[memberRole] || ROLE_COLORS.member}`}
            >
              {ROLE_LABELS[memberRole] || member.role}
            </Badge>

            {canModify && (
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
                  {assignableRoles.length > 0 && (
                    <>
                      <DropdownMenuLabel className="text-xs">
                        Change Role
                      </DropdownMenuLabel>
                      {assignableRoles.map((role) => (
                        <DropdownMenuItem
                          key={role}
                          onClick={() =>
                            handleRoleChange(member.id, role as MemberRole)
                          }
                          disabled={member.role === role}
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          {ROLE_LABELS[role]}
                          {member.role === role && (
                            <span className="ml-auto text-xs text-muted-foreground">
                              current
                            </span>
                          )}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                    </>
                  )}
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
        )
      })}

      {members.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No members found.
        </p>
      )}

      {hasMore && (
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
              "Show more"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
