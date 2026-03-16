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
  Check,
  Globe,
  Lock,
  CalendarDays,
  LayoutGrid,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { joinCommunity, leaveCommunity } from "@/lib/actions/community-actions"
import type { CommunityWithMeta, MemberRole } from "@/types/community"
import { MEMBER_ROLE_LABELS } from "@/types/community"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface CommunityHeaderProps {
  community: CommunityWithMeta
  isSuperAdmin?: boolean
  eventCount?: number
  spaceCount?: number
}

export function CommunityHeader({
  community,
  isSuperAdmin = false,
  eventCount = 0,
  spaceCount = 0,
}: CommunityHeaderProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const isMember = !!community.current_user_role
  const isAdmin =
    isSuperAdmin ||
    community.current_user_role === "owner" ||
    community.current_user_role === "admin" ||
    community.current_user_role === "moderator"

  const handleJoinLeave = async () => {
    setLoading(true)
    try {
      if (isMember) {
        await leaveCommunity(community.id)
      } else {
        const result = await joinCommunity(community.id)
        if (!result.success && result.error === "auth_required") {
          router.push("/signin")
          return
        }
      }
      router.refresh()
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  const handleShare = () => {
    if (typeof window === "undefined") return
    try {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard not available
    }
  }

  const visibilityIcon = community.type === "private" ? Lock : Globe
  const VisIcon = visibilityIcon

  return (
    <div className="bg-card border-b border-border">
      {/* Cover image — taller, with gradient overlay */}
      <div className="relative w-full h-44 md:h-56 lg:h-64 overflow-hidden bg-muted">
        {community.cover_image_url ? (
          <img
            src={community.cover_image_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/8 to-accent/20" />
        )}
        {/* Bottom gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

        {/* Admin settings button — top right of cover */}
        {isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm border border-white/20"
            asChild
          >
            <Link href={`/communities/${community.slug}/admin`} aria-label="Admin settings">
              <Settings className="w-4 h-4" />
            </Link>
          </Button>
        )}
      </div>

      {/* Identity bar */}
      <div className="px-4 md:px-6 lg:px-10">
        <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-8 md:-mt-10 pb-4 md:pb-5">
          {/* Avatar — overlaps cover */}
          <div
            className={cn(
              "w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden border-4 bg-card shadow-lg shrink-0",
              "border-card"
            )}
          >
            {community.avatar_url ? (
              <img
                src={community.avatar_url}
                alt={community.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-2xl md:text-3xl font-bold">
                {community.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0 md:pb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
                {community.name}
              </h1>
              {community.is_verified && (
                <BadgeCheck className="w-5 h-5 text-primary shrink-0" />
              )}
              {isMember && (
                <Badge
                  variant="secondary"
                  className="text-[10px] font-semibold uppercase tracking-wide h-5 px-2"
                >
                  {community.current_user_role === "owner"
                    ? "Owner"
                    : MEMBER_ROLE_LABELS[community.current_user_role as MemberRole]}
                </Badge>
              )}
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                <span className="font-medium text-foreground">{community.member_count.toLocaleString()}</span>
                <span>members</span>
              </span>
              {community.location_name && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  {community.location_name}
                </span>
              )}
              {eventCount > 0 && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>{eventCount} upcoming</span>
                </span>
              )}
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <VisIcon className="w-3.5 h-3.5" />
                <span className="capitalize">{community.type}</span>
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 md:pb-1 shrink-0">
            <Button
              variant={isMember ? "outline" : "default"}
              size="sm"
              onClick={handleJoinLeave}
              disabled={loading || community.current_user_role === "owner"}
              className="gap-1.5 min-w-[90px]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isMember ? (
                <>
                  <LogOut className="w-3.5 h-3.5" />
                  Leave
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  {community.join_policy === "approval" ? "Request to Join" : "Join"}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleShare}
              className="shrink-0"
              aria-label="Share"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Description excerpt */}
        {community.description && (
          <div className="pb-4 md:pb-5 max-w-2xl">
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {community.description}
            </p>
          </div>
        )}

        {/* Tags */}
        {community.tags.length > 0 && (
          <div className="pb-4 md:pb-5 flex flex-wrap gap-1.5">
            {community.tags.slice(0, 6).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
