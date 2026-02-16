export interface UserProfile {
  id: string
  neon_auth_id: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  location_name: string | null
  website_url: string | null
  created_at: string
  updated_at: string
}

export type MemberRole = "owner" | "admin" | "moderator" | "member"
export type MemberStatus = "active" | "pending" | "banned"
export type NotificationPreference = "all" | "important" | "none"

export interface CommunityMembership {
  id: string
  community_id: string
  user_id: string
  role: MemberRole
  status: MemberStatus
  notification_preference: NotificationPreference
  joined_at: string
  community_name?: string
  community_slug?: string
  community_cover_image_url?: string | null
}

export interface CommunityMemberRow {
  id: string
  user_id: string
  role: MemberRole
  status: MemberStatus
  joined_at: string
  display_name: string | null
  avatar_url: string | null
}
