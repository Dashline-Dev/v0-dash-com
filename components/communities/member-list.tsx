"use client"

import { useState, useCallback } from "react"
import { Loader2 } from "lucide-react"
import { MemberCard } from "./member-card"
import { getCommunityMembers } from "@/lib/actions/community-actions"
import type { CommunityMember } from "@/types/community"
import { Button } from "@/components/ui/button"

interface MemberListProps {
  communityId: string
  initialMembers: CommunityMember[]
  initialCursor: string | null
  initialHasMore: boolean
}

export function MemberList({
  communityId,
  initialMembers,
  initialCursor,
  initialHasMore,
}: MemberListProps) {
  const [members, setMembers] = useState(initialMembers)
  const [cursor, setCursor] = useState(initialCursor)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)

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

  if (members.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No members yet.
      </p>
    )
  }

  return (
    <div className="space-y-1">
      {members.map((member) => (
        <MemberCard key={member.id} member={member} />
      ))}
      {hasMore && (
        <div className="flex justify-center pt-3">
          <Button variant="ghost" size="sm" onClick={loadMore} disabled={loading}>
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
