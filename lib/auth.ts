"use server"

import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import crypto from "crypto"

// ── Types ──────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
}

// ── Session helpers ────────────────────────────────────────

const SESSION_COOKIE = "session_token"
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 // 30 days in seconds

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

/** Get the currently logged-in user from the session cookie, or null */
export async function getSession(): Promise<AuthUser | null> {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (!token) return null

  const rows = await sql(
    `SELECT u.id, u.email, u.display_name, u.avatar_url
     FROM auth_sessions s
     JOIN auth_users u ON u.id = s.user_id
     WHERE s.token = $1 AND s.expires_at > now()`,
    [token]
  )

  if (rows.length === 0) return null
  return rows[0] as AuthUser
}

async function createSession(userId: string): Promise<string> {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000)

  await sql(
    `INSERT INTO auth_sessions (user_id, token, expires_at) VALUES ($1, $2, $3)`,
    [userId, token, expiresAt.toISOString()]
  )

  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })

  return token
}

async function destroySession(): Promise<void> {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (token) {
    await sql(`DELETE FROM auth_sessions WHERE token = $1`, [token])
  }
  jar.delete(SESSION_COOKIE)
}

// ── Auth actions ───────────────────────────────────────────

export async function signUp(formData: {
  email: string
  password: string
  displayName: string
}): Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }> {
  const { email, password, displayName } = formData

  if (!email || !password || !displayName) {
    return { ok: false, error: "All fields are required." }
  }
  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." }
  }

  // Check if email already exists
  const existing = await sql(
    `SELECT id FROM auth_users WHERE LOWER(email) = LOWER($1)`,
    [email]
  )
  if (existing.length > 0) {
    return { ok: false, error: "An account with this email already exists." }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const rows = await sql(
    `INSERT INTO auth_users (email, password_hash, display_name)
     VALUES (LOWER($1), $2, $3)
     RETURNING id, email, display_name, avatar_url`,
    [email, passwordHash, displayName]
  )

  const user = rows[0] as AuthUser

  // Also create a user_profiles row so membership queries can join
  await sql(
    `INSERT INTO user_profiles (neon_auth_id, display_name)
     VALUES ($1, $2)
     ON CONFLICT (neon_auth_id) DO NOTHING`,
    [user.id, displayName]
  )

  await createSession(user.id)
  return { ok: true, user }
}

export async function signIn(formData: {
  email: string
  password: string
}): Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }> {
  const { email, password } = formData

  if (!email || !password) {
    return { ok: false, error: "Email and password are required." }
  }

  const rows = await sql(
    `SELECT id, email, display_name, avatar_url, password_hash
     FROM auth_users WHERE LOWER(email) = LOWER($1)`,
    [email]
  )

  if (rows.length === 0) {
    return { ok: false, error: "Invalid email or password." }
  }

  const user = rows[0] as AuthUser & { password_hash: string }
  const valid = await bcrypt.compare(password, user.password_hash)

  if (!valid) {
    return { ok: false, error: "Invalid email or password." }
  }

  await createSession(user.id)
  return {
    ok: true,
    user: { id: user.id, email: user.email, display_name: user.display_name, avatar_url: user.avatar_url },
  }
}

export async function signOut(): Promise<void> {
  await destroySession()
}
