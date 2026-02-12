"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  BadgeCheck,
  MapPin,
  Users,
  Share2,
  Settings,
  LogOut,
  LogIn,
  Loader2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { joinCommunity, leaveCommunity } from "@/lib/actions/community-actions"
import type { CommunityWithMeta, MemberRole } from "@/types/community"
import { MEMBER_ROLE_LABELS } from "@/types/community"
import Link from "next/link"

interface CommunityHeaderProps {
  community: CommunityWithMeta
}

export function CommunityHeader({ community }: CommunityHeaderProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const isMember = !!community.current_user_role
  const isAdmin =
    community.current_user_role === "owner" ||
    community.current_user_role === "admin"

  const handleJoinLeave = async () => {
    setLoading(true)
    try {
      if (isMember) {
        await leaveCommunity(community.id)
      } else {
        await joinCommunity(community.id)
      }
      router.refresh()
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: community.name,
        text: community.description || undefined,
        url: window.location.href,
      })
    } else {
      await navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <div>
      {/* Cover image - subtle, not the focus */}
      <div className="relative w-full h-24 md:h-32 bg-secondary overflow-hidden">
        {community.cover_image_url ? (
          <img
            src={community.cover_image_url}
            alt=""
            className="w-full h-full object-cover opacity-80"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/15 via-primary/5 to-accent/15" />
        )}
      </div>

      {/* Community info - sits cleanly below the banner */}
      <div className="px-4 md:px-6 lg:px-10 border-b border-border bg-card">
        <div className="flex flex-col gap-4 py-4 md:py-5">
          <div className="flex items-start gap-3 md:gap-4">
            {/* Avatar - pulled up to overlap banner slightly */}
            <div className="w-14 h-14 md:w-16 md:h-16 -mt-10 md:-mt-12 rounded-xl border-3 border-card bg-card overflow-hidden shadow-sm shrink-0">
              {community.avatar_url ? (
                <img
                  src={community.avatar_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-xl md:text-2xl font-bold">
                  {community.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Name + meta -- always below the banner */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold text-foreground truncate">
                  {community.name}
                </h1>
                {community.is_verified && (
                  <BadgeCheck className="w-4.5 h-4.5 text-primary shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {community.member_count.toLocaleString()} members
                </span>
                {community.location_name && (
                  <span className="flex items-center gap-1 hidden sm:flex">
                    <MapPin className="w-3.5 h-3.5" />
                    {community.location_name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions row - separate line for clarity */}
          <div className="flex items-center gap-2 flex-wrap">
            {isMember && community.current_user_role !== "owner" && (
              <Badge variant="secondary" className="text-xs">
                {MEMBER_ROLE_LABELS[community.current_user_role as MemberRole]}
              </Badge>
            )}
            {community.current_user_role === "owner" && (
              <Badge className="text-xs bg-primary/10 text-primary hover:bg-primary/10">
                Owner
              </Badge>
            )}
            <Button
              variant={isMember ? "outline" : "default"}
              size="sm"
              onClick={handleJoinLeave}
              disabled={loading || community.current_user_role === "owner"}
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
                  {community.join_policy === "approval" ? "Request to Join" : "Join"}
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="text-muted-foreground"
              aria-label="Share"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground"
                asChild
              >
                <Link href={`/communities/${community.slug}/admin`} aria-label="Admin settings">
                  <Settings className="w-4 h-4" />
                </Link>
              </Button>
            )}
            {community.location_name && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground sm:hidden ml-auto">
                <MapPin className="w-3.5 h-3.5" />
                {community.location_name}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
