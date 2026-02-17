/**
 * Session read helpers -- NOT a server action file.
 * These are plain async functions that can be called from server components
 * and will correctly read cookies from the incoming request.
 */
import { sql } from "@/lib/db"
import { cookies } from "next/headers"

export interface AuthUser {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
}

export const SESSION_COOKIE = "session_token"
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60 // 30 days

/** Get the currently logged-in user from the session cookie, or null */
export async function getSession(): Promise<AuthUser | null> {
  try {
    const jar = await cookies()
    const token = jar.get(SESSION_COOKIE)?.value
    console.log("[v0] getSession: token?", !!token, token ? token.slice(0, 8) : "none")
    if (!token) return null

    const rows = await sql(
      `SELECT u.id, u.email, u.display_name, u.avatar_url
       FROM auth_sessions s
       JOIN auth_users u ON u.id = s.user_id
       WHERE s.token = $1 AND s.expires_at > now()`,
      [token]
    )

    console.log("[v0] getSession: rows=", rows.length, rows.length > 0 ? rows[0].id : "none")
    if (rows.length === 0) return null
    return rows[0] as AuthUser
  } catch (err) {
    console.error("[v0] getSession error:", err)
    return null
  }
}

/** Get basic account info for settings page */
export async function getAccountInfo(): Promise<{
  email: string
  display_name: string
  created_at: string
} | null> {
  const session = await getSession()
  if (!session) return null

  const rows = await sql(
    `SELECT email, display_name, created_at FROM auth_users WHERE id = $1`,
    [session.id]
  )
  if (rows.length === 0) return null
  return rows[0] as { email: string; display_name: string; created_at: string }
}
