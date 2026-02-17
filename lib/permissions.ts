/**
 * Roles & Permissions system
 *
 * Role hierarchy (high → low):
 *   superadmin > owner > admin > moderator > member > guest
 *
 * Permissions are inferred from role + context. Each action maps to a
 * minimum role required. Higher roles inherit all lower permissions.
 */

// ── Role hierarchy ─────────────────────────────────────────

export const ROLES = [
  "superadmin",
  "owner",
  "admin",
  "moderator",
  "member",
  "guest",
] as const

export type Role = (typeof ROLES)[number]

const ROLE_LEVEL: Record<Role, number> = {
  superadmin: 6,
  owner: 5,
  admin: 4,
  moderator: 3,
  member: 2,
  guest: 1,
}

export const ROLE_LABELS: Record<Role, string> = {
  superadmin: "Super Admin",
  owner: "Owner",
  admin: "Admin",
  moderator: "Moderator",
  member: "Member",
  guest: "Guest",
}

export const ROLE_COLORS: Record<Role, string> = {
  superadmin: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  owner: "bg-primary/10 text-primary",
  admin: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  moderator:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  member: "bg-secondary text-secondary-foreground",
  guest: "bg-muted text-muted-foreground",
}

// ── Permissions ────────────────────────────────────────────

export const PERMISSIONS = {
  // Community management
  community_edit: "community:edit",
  community_delete: "community:delete",
  community_manage_settings: "community:manage_settings",

  // Member management
  member_view: "member:view",
  member_invite: "member:invite",
  member_approve: "member:approve",
  member_remove: "member:remove",
  member_ban: "member:ban",
  member_change_role: "member:change_role",

  // Content moderation
  content_create: "content:create",
  content_edit_own: "content:edit_own",
  content_edit_any: "content:edit_any",
  content_delete_own: "content:delete_own",
  content_delete_any: "content:delete_any",
  content_pin: "content:pin",

  // Events
  event_create: "event:create",
  event_edit_any: "event:edit_any",
  event_delete_any: "event:delete_any",

  // Spaces
  space_create: "space:create",
  space_edit: "space:edit",
  space_delete: "space:delete",

  // Analytics
  analytics_view: "analytics:view",

  // Audit
  audit_view: "audit:view",
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

/**
 * Map each permission to the minimum role required.
 * Higher roles automatically inherit all permissions of lower roles.
 */
const PERMISSION_MIN_ROLE: Record<Permission, Role> = {
  // Community management
  "community:edit": "admin",
  "community:delete": "owner",
  "community:manage_settings": "admin",

  // Member management
  "member:view": "moderator",
  "member:invite": "moderator",
  "member:approve": "moderator",
  "member:remove": "moderator",
  "member:ban": "admin",
  "member:change_role": "admin",

  // Content moderation
  "content:create": "member",
  "content:edit_own": "member",
  "content:edit_any": "moderator",
  "content:delete_own": "member",
  "content:delete_any": "moderator",
  "content:pin": "moderator",

  // Events
  "event:create": "member",
  "event:edit_any": "moderator",
  "event:delete_any": "admin",

  // Spaces
  "space:create": "admin",
  "space:edit": "admin",
  "space:delete": "owner",

  // Analytics
  "analytics:view": "admin",

  // Audit
  "audit:view": "admin",
}

// ── Core functions ─────────────────────────────────────────

/** Check if roleA >= roleB in the hierarchy */
export function isRoleAtLeast(roleA: Role, roleB: Role): boolean {
  return ROLE_LEVEL[roleA] >= ROLE_LEVEL[roleB]
}

/** Check whether a given role has a specific permission */
export function hasPermission(role: Role, permission: Permission): boolean {
  const minRole = PERMISSION_MIN_ROLE[permission]
  if (!minRole) return false
  return isRoleAtLeast(role, minRole)
}

/** Get all permissions for a role */
export function getPermissionsForRole(role: Role): Permission[] {
  return Object.entries(PERMISSION_MIN_ROLE)
    .filter(([, minRole]) => isRoleAtLeast(role, minRole))
    .map(([perm]) => perm as Permission)
}

/** Roles that a given role can assign to others (can only assign roles below their own) */
export function getAssignableRoles(actorRole: Role): Role[] {
  const actorLevel = ROLE_LEVEL[actorRole]
  return ROLES.filter(
    (r) => r !== "superadmin" && r !== "guest" && ROLE_LEVEL[r] < actorLevel
  )
}

/** Check if actor can modify target's role */
export function canModifyMember(actorRole: Role, targetRole: Role): boolean {
  // Can only modify members below you in the hierarchy
  return ROLE_LEVEL[actorRole] > ROLE_LEVEL[targetRole]
}

// ── Context helper ─────────────────────────────────────────

export interface PermissionContext {
  userRole: Role
  isSuperAdmin: boolean
}

/** Resolve the effective role considering superadmin override */
export function getEffectiveRole(ctx: PermissionContext): Role {
  if (ctx.isSuperAdmin) return "superadmin"
  return ctx.userRole
}

/** Check a permission within a context */
export function checkPermission(
  ctx: PermissionContext,
  permission: Permission
): boolean {
  const effectiveRole = getEffectiveRole(ctx)
  return hasPermission(effectiveRole, permission)
}

// ── Permission groups for UI ───────────────────────────────

export const PERMISSION_GROUPS = [
  {
    label: "Community",
    permissions: [
      { key: PERMISSIONS.community_edit, label: "Edit community settings" },
      { key: PERMISSIONS.community_delete, label: "Delete community" },
      {
        key: PERMISSIONS.community_manage_settings,
        label: "Manage community settings",
      },
    ],
  },
  {
    label: "Members",
    permissions: [
      { key: PERMISSIONS.member_view, label: "View member list" },
      { key: PERMISSIONS.member_invite, label: "Invite members" },
      { key: PERMISSIONS.member_approve, label: "Approve join requests" },
      { key: PERMISSIONS.member_remove, label: "Remove members" },
      { key: PERMISSIONS.member_ban, label: "Ban members" },
      { key: PERMISSIONS.member_change_role, label: "Change member roles" },
    ],
  },
  {
    label: "Content",
    permissions: [
      { key: PERMISSIONS.content_create, label: "Create posts" },
      { key: PERMISSIONS.content_edit_own, label: "Edit own posts" },
      { key: PERMISSIONS.content_edit_any, label: "Edit any post" },
      { key: PERMISSIONS.content_delete_own, label: "Delete own posts" },
      { key: PERMISSIONS.content_delete_any, label: "Delete any post" },
      { key: PERMISSIONS.content_pin, label: "Pin posts" },
    ],
  },
  {
    label: "Events",
    permissions: [
      { key: PERMISSIONS.event_create, label: "Create events" },
      { key: PERMISSIONS.event_edit_any, label: "Edit any event" },
      { key: PERMISSIONS.event_delete_any, label: "Delete any event" },
    ],
  },
  {
    label: "Spaces",
    permissions: [
      { key: PERMISSIONS.space_create, label: "Create spaces" },
      { key: PERMISSIONS.space_edit, label: "Edit spaces" },
      { key: PERMISSIONS.space_delete, label: "Delete spaces" },
    ],
  },
  {
    label: "Admin",
    permissions: [
      { key: PERMISSIONS.analytics_view, label: "View analytics" },
      { key: PERMISSIONS.audit_view, label: "View audit log" },
    ],
  },
] as const
