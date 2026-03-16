// ── Visibility: Who can discover/see the community ─────────────────────

export type CommunityVisibility = "public" | "unlisted" | "private"

export const COMMUNITY_VISIBILITY_OPTIONS: {
  value: CommunityVisibility
  label: string
  description: string
}[] = [
  {
    value: "public",
    label: "Public",
    description: "Anyone can find and view this community",
  },
  {
    value: "unlisted",
    label: "Unlisted",
    description: "Only accessible via direct link",
  },
  {
    value: "private",
    label: "Private",
    description: "Only members can see it exists",
  },
]

// ── Join Policy: How people can join ───────────────────────────────────

export type JoinPolicy = "open" | "approval" | "invite_only"

export const JOIN_POLICY_OPTIONS: {
  value: JoinPolicy
  label: string
  description: string
}[] = [
  {
    value: "open",
    label: "Open",
    description: "Anyone can join instantly",
  },
  {
    value: "approval",
    label: "Approval Required",
    description: "Members must request to join",
  },
  {
    value: "invite_only",
    label: "Invite Only",
    description: "Only by invitation from admins",
  },
]

// ── Category: What kind of community ───────────────────────────────────

export type CommunityCategory =
  | "general"
  | "technology"
  | "sports"
  | "arts"
  | "neighborhood"
  | "wellness"
  | "education"
  | "music"
  | "food"
  | "gaming"
  | "business"
  | "social"

export const COMMUNITY_CATEGORIES: { value: CommunityCategory; label: string }[] = [
  { value: "general", label: "General" },
  { value: "technology", label: "Technology" },
  { value: "sports", label: "Sports" },
  { value: "arts", label: "Arts" },
  { value: "neighborhood", label: "Neighborhood" },
  { value: "wellness", label: "Wellness" },
  { value: "education", label: "Education" },
  { value: "music", label: "Music" },
  { value: "food", label: "Food" },
  { value: "gaming", label: "Gaming" },
  { value: "business", label: "Business" },
  { value: "social", label: "Social" },
]

// ── Posting Policy ─────────────────────────────────────────────────────

export type PostingPolicy = "everyone" | "admins_only" | "selected_users"

// ── Member Enums ───────────────────────────────────────────────────────

export type MemberRole = "owner" | "admin" | "moderator" | "member"

export type MemberStatus = "active" | "pending" | "banned" | "muted"

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  owner: "Owner",
  admin: "Admin",
  moderator: "Moderator",
  member: "Member",
}

export const MEMBER_ROLE_HIERARCHY: Record<MemberRole, number> = {
  owner: 4,
  admin: 3,
  moderator: 2,
  member: 1,
}

// ── Core Records ───────────────────────────────────────────────────────

export interface Community {
  id: string
  name: string
  slug: string
  description: string | null
  category: CommunityCategory
  cover_image_url: string | null
  avatar_url: string | null
  location_name: string | null
  latitude: number | null
  longitude: number | null
  member_count: number
  is_verified: boolean
  visibility: CommunityVisibility
  join_policy: JoinPolicy
  posting_policy: PostingPolicy
  contact_email: string | null
  timezone: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface CommunityMember {
  id: string
  community_id: string
  user_id: string
  role: MemberRole
  status: MemberStatus
  joined_at: string
  display_name?: string | null
  avatar_url?: string | null
}

export interface CommunityTag {
  id: string
  community_id: string
  tag: string
}

export interface CommunityRule {
  id: string
  community_id: string
  title: string
  description: string | null
  sort_order: number
}

// ── Composite Types ────────────────────────────────────────────────────

export interface CommunityWithMeta extends Community {
  tags: string[]
  rules: CommunityRule[]
  current_user_role: MemberRole | null
}

export interface CommunityListItem extends Community {
  tags: string[]
  current_user_role: MemberRole | null
}

// ── Input Types ────────────────────────────────────────────────────────

export interface CreateCommunityInput {
  name: string
  slug: string
  description: string
  category: CommunityCategory
  visibility: CommunityVisibility
  join_policy: JoinPolicy
  posting_policy: PostingPolicy
  cover_image_url?: string | null
  avatar_url?: string | null
  location_name?: string | null
  latitude?: number | null
  longitude?: number | null
  contact_email?: string | null
  timezone?: string
  tags?: string[]
  rules?: { title: string; description: string }[]
  areaIds?: string[]
}

export interface UpdateCommunityInput {
  name?: string
  slug?: string
  description?: string
  category?: CommunityCategory
  visibility?: CommunityVisibility
  join_policy?: JoinPolicy
  posting_policy?: PostingPolicy
  cover_image_url?: string | null
  avatar_url?: string | null
  location_name?: string | null
  latitude?: number | null
  longitude?: number | null
  contact_email?: string | null
  timezone?: string
}

// ── Pagination ─────────────────────────────────────────────────────────

export interface CursorPagination {
  cursor?: string | null
  limit?: number
}

export interface PaginatedResult<T> {
  data: T[]
  nextCursor: string | null
  hasMore: boolean
}

// ── Filter Types ───────────────────────────────────────────────────────

export interface CommunityFilters {
  search?: string
  category?: CommunityCategory | null
  cursor?: string | null
  limit?: number
}
