import { redirect } from "next/navigation"
import { getSession, type AuthUser } from "@/lib/auth-session"

/**
 * Guard: returns the authenticated superadmin user or redirects away.
 * Use in server components and server actions that require superadmin access.
 */
export async function requireSuperAdmin(): Promise<AuthUser> {
  const session = await getSession()
  if (!session || !session.is_superadmin) {
    redirect("/")
  }
  return session
}

/** Non-throwing variant -- returns null if the user is not a superadmin */
export async function getSuperAdminSession(): Promise<AuthUser | null> {
  const session = await getSession()
  if (!session || !session.is_superadmin) return null
  return session
}
