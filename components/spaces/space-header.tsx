"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Users, ArrowLeft, LogIn, LogOut, Share2, Settings, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SpaceIcon } from "./space-icon"
import { joinSpace, leaveSpace } from "@/lib/actions/space-actions"
import type { SpaceWithMeta } from "@/types/space"
import { SPACE_TYPE_LABELS, SPACE_MEMBER_ROLE_LABELS, type SpaceMemberRole } from "@/types/space"

export function SpaceHeader({ space }: { space: SpaceWithMeta }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const isMember = !!space.current_user_role
  const isAdmin = space.current_user_role === "admin"

  const handleJoinLeave = async () => {
    setLoading(true)
    try {
      if (isMember) {
        await leaveSpace(space.id)
      } else {
        await joinSpace(space.id)
      }
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleShare = () => {
    try {
      navigator.clipboard.writeText(window.location.href)
    } catch {
      // Clipboard not available
    }
  }

  const backHref = space.community_slug
    ? `/communities/${space.community_slug}`
    : "/spaces"

  return (
    <div className="border-b border-border bg-card">
      <div className="px-4 md:px-6 lg:px-10 py-4 md:py-5">
        {/* Back link */}
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          {space.community_name ? `Back to ${space.community_name}` : "All Spaces"}
        </Link>

        <div className="flex flex-col gap-4">
          {/* Icon + Name */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <SpaceIcon name={space.icon} className="w-6 h-6 md:w-7 md:h-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold text-foreground truncate">
                  {space.name}
                </h1>
                <Badge variant="secondary" className="text-[10px] shrink-0 font-medium">
                  {SPACE_TYPE_LABELS[space.type]}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {space.member_count} members
                </span>
                {space.community_name && (
                  <span className="hidden sm:inline">
                    in{" "}
                    <Link
                      href={`/communities/${space.community_slug}`}
                      className="text-primary hover:underline"
                    >
                      {space.community_name}
                    </Link>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {isMember && space.current_user_role !== "admin" && (
              <Badge variant="secondary" className="text-xs">
                {SPACE_MEMBER_ROLE_LABELS[space.current_user_role as SpaceMemberRole]}
              </Badge>
            )}
            {isAdmin && (
              <Badge className="text-xs bg-primary/10 text-primary hover:bg-primary/10">Admin</Badge>
            )}
            <Button
              variant={isMember ? "outline" : "default"}
              size="sm"
              onClick={handleJoinLeave}
              disabled={loading || isAdmin}
              className="gap-1.5"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isMember ? (
                <>
                  <LogOut className="w-4 h-4" />
                  Leave
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Join
                </>
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleShare} className="text-muted-foreground" aria-label="Share">
              <Share2 className="w-4 h-4" />
            </Button>
            {isAdmin && (
              <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label="Settings">
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
