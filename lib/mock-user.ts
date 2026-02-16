/**
 * User context -- wraps the real auth session.
 * All consumer code imports getCurrentUser() from here.
 */
import { getSession } from "@/lib/auth"

export interface MockUser {
  id: string
  name: string
  avatar: string | null
}

/** Return the authenticated user, or a guest fallback for read-only pages */
export async function getCurrentUser(): Promise<MockUser> {
  const session = await getSession()
  if (session) {
    return {
      id: session.id,
      name: session.display_name,
      avatar: session.avatar_url,
    }
  }
  // Guest fallback -- lets server components render without auth
  return { id: "guest", name: "Guest", avatar: null }
}

/** Check if there's a real authenticated user (not the guest fallback) */
export async function getAuthenticatedUser(): Promise<MockUser | null> {
  const session = await getSession()
  if (!session) return null
  return {
    id: session.id,
    name: session.display_name,
    avatar: session.avatar_url,
  }
}

// Keep backward compat -- MOCK_USER is no longer used but some imports reference it
export const MOCK_USER: MockUser = { id: "guest", name: "Guest", avatar: null }
