// ─── Space Domain Types ─────────────────────────────────────────────────────

// Type: What kind of space is this?
export type SpaceType = "general" | "discussion" | "events" | "announcements" | "resources" | "projects"

// Visibility: Who can see this space exists? (matches community model)
export type SpaceVisibility = "public" | "unlisted" | "private"

// Join Policy: How do members join? (matches community model)
export type SpaceJoinPolicy = "open" | "approval" | "invite_only"

export type SpaceStatus = "active" | "archived" | "draft"
export type SpaceMemberRole = "admin" | "moderator" | "member"

// ─── Type Labels and Descriptions ───────────────────────────────────────────

export const SPACE_TYPES: { value: SpaceType; label: string; description: string; icon: string }[] = [
  { value: "general", label: "General", description: "All-purpose space for community activities", icon: "Layers" },
  { value: "discussion", label: "Discussion", description: "Conversations and topics", icon: "MessageCircle" },
  { value: "events", label: "Events", description: "Community events and meetups", icon: "Calendar" },
  { value: "announcements", label: "Announcements", description: "Important updates and news", icon: "Megaphone" },
  { value: "resources", label: "Resources", description: "Shared files and links", icon: "BookOpen" },
  { value: "projects", label: "Projects", description: "Collaborative work and initiatives", icon: "Rocket" },
]

export const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  general: "General",
  discussion: "Discussion",
  events: "Events",
  announcements: "Announcements",
  resources: "Resources",
  projects: "Projects",
}

export const SPACE_TYPE_ICONS: Record<SpaceType, string> = {
  general: "Layers",
  discussion: "MessageCircle",
  events: "Calendar",
  announcements: "Megaphone",
  resources: "BookOpen",
  projects: "Rocket",
}

// ─── Visibility Labels and Descriptions (aligned with community model) ──────

export const SPACE_VISIBILITIES: { value: SpaceVisibility; label: string; description: string }[] = [
  { value: "public", label: "Public", description: "Anyone can find and view this space" },
  { value: "unlisted", label: "Unlisted", description: "Only accessible via direct link" },
  { value: "private", label: "Private", description: "Only members can see this space exists" },
]

export const SPACE_VISIBILITY_LABELS: Record<SpaceVisibility, string> = {
  public: "Public",
  unlisted: "Unlisted",
  private: "Private",
}

// ─── Join Policy Labels and Descriptions (aligned with community model) ─────

export const SPACE_JOIN_POLICIES: { value: SpaceJoinPolicy; label: string; description: string }[] = [
  { value: "open", label: "Open", description: "Anyone can join instantly" },
  { value: "approval", label: "Approval Required", description: "Admins must approve new members" },
  { value: "invite_only", label: "Invite Only", description: "Members can only join via invitation" },
]

export const SPACE_JOIN_POLICY_LABELS: Record<SpaceJoinPolicy, string> = {
  open: "Open",
  approval: "Approval Required",
  invite_only: "Invite Only",
}

// ─── Status Labels ──────────────────────────────────────────────────────────

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
  join_policy: SpaceJoinPolicy
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

export interface CreateSpaceInput {
  community_id?: string
  name: string
  slug: string
  description?: string
  type: SpaceType
  icon?: string
  cover_image_url?: string
  visibility: SpaceVisibility
  join_policy: SpaceJoinPolicy
}

export interface UpdateSpaceData {
  name?: string
  description?: string
  type?: SpaceType
  icon?: string
  cover_image_url?: string
  visibility?: SpaceVisibility
  join_policy?: SpaceJoinPolicy
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
  "Layers",
  "MessageCircle",
  "Calendar",
  "Megaphone",
  "BookOpen",
  "Rocket",
  "Code",
  "Image",
  "Gamepad2",
  "MapPin",
  "Timer",
  "Lightbulb",
  "Shield",
  "Flower2",
  "Music",
  "Video",
  "Palette",
  "Wrench",
  "Heart",
  "Star",
] as const

// Legacy aliases for backwards compatibility
export type CreateSpaceData = CreateSpaceInput

// Select option format for forms
export const SPACE_TYPE_OPTIONS = SPACE_TYPES.map(t => ({ value: t.value, label: t.label }))
export const SPACE_VISIBILITY_OPTIONS = SPACE_VISIBILITIES.map(v => ({ value: v.value, label: v.label }))
export const SPACE_JOIN_POLICY_OPTIONS = SPACE_JOIN_POLICIES.map(p => ({ value: p.value, label: p.label }))
