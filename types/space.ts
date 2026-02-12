// ─── Space Domain Types ─────────────────────────────────────────────────────

export type SpaceType = "discussion" | "event" | "project" | "resource"
export type SpaceVisibility = "public" | "members_only" | "private"
export type SpaceStatus = "active" | "archived" | "draft"
export type SpaceMemberRole = "admin" | "moderator" | "member"

export const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  discussion: "Discussion",
  event: "Event",
  project: "Project",
  resource: "Resource",
}

export const SPACE_TYPE_ICONS: Record<SpaceType, string> = {
  discussion: "MessageCircle",
  event: "Calendar",
  project: "Rocket",
  resource: "BookOpen",
}

export const SPACE_VISIBILITY_LABELS: Record<SpaceVisibility, string> = {
  public: "Public",
  members_only: "Members Only",
  private: "Private",
}

export const SPACE_STATUS_LABELS: Record<SpaceStatus, string> = {
  active: "Active",
  archived: "Archived",
  draft: "Draft",
}

export const SPACE_MEMBER_ROLE_LABELS: Record<SpaceMemberRole, string> = {
  admin: "Admin",
  moderator: "Moderator",
  member: "Member",
}

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface Space {
  id: string
  community_id: string | null
  name: string
  slug: string
  description: string | null
  type: SpaceType
  icon: string | null
  cover_image_url: string | null
  visibility: SpaceVisibility
  status: SpaceStatus
  created_by: string
  created_at: string
  updated_at: string
}

export interface SpaceWithMeta extends Space {
  community_name?: string | null
  community_slug?: string | null
  member_count: number
  current_user_role: string | null
}

export interface SpaceMember {
  id: string
  space_id: string
  user_id: string
  role: SpaceMemberRole
  joined_at: string
}

// ─── Form Data ──────────────────────────────────────────────────────────────

export interface CreateSpaceData {
  community_id?: string
  name: string
  slug: string
  description?: string
  type: SpaceType
  icon?: string
  cover_image_url?: string
  visibility: SpaceVisibility
}

export interface UpdateSpaceData {
  name?: string
  description?: string
  type?: SpaceType
  icon?: string
  cover_image_url?: string
  visibility?: SpaceVisibility
  status?: SpaceStatus
}

// ─── Query Params ───────────────────────────────────────────────────────────

export interface SpaceListParams {
  community_id?: string
  search?: string
  type?: SpaceType
  status?: SpaceStatus
  limit?: number
  offset?: number
}

// ─── Constants ──────────────────────────────────────────────────────────────

export const SPACE_ICON_OPTIONS = [
  "MessageCircle",
  "Calendar",
  "Rocket",
  "BookOpen",
  "Code",
  "Image",
  "Gamepad2",
  "MapPin",
  "Timer",
  "Lightbulb",
  "Megaphone",
  "Shield",
  "Flower2",
  "ArrowLeftRight",
  "Music",
  "Video",
  "Palette",
  "Wrench",
  "Heart",
  "Star",
] as const
