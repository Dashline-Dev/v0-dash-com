"use server"

import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import crypto from "crypto"
import { getSession, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth-session"

// NOTE: Do NOT re-export getSession / getAccountInfo from here.
// This file is "use server" -- re-exports would turn read helpers
// into server actions, breaking cookie access from server components.
// Import read helpers directly from "@/lib/auth-session" instead.
export type { AuthUser } from "@/lib/auth-session"

// ── Internal helpers ───────────────────────────────────────

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

async function createSession(userId: string): Promise<string> {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000)
  console.log("[v0] createSession: inserting session for user", userId, "token:", token.slice(0, 8) + "...")
  await sql(
    `INSERT INTO auth_sessions (user_id, token, expires_at) VALUES ($1::uuid, $2, $3)`,
    [userId, token, expiresAt.toISOString()]
  )
  console.log("[v0] createSession: session inserted, setting cookie. NODE_ENV:", process.env.NODE_ENV, "secure:", process.env.NODE_ENV === "production")

  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })
  console.log("[v0] createSession: cookie set successfully")

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
}): Promise<{ ok: true; user: { id: string; email: string; display_name: string; avatar_url: string | null } } | { ok: false; error: string }> {
  const { email, password, displayName } = formData

  if (!email || !password || !displayName) {
    return { ok: false, error: "All fields are required." }
  }
  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." }
  }

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

  const user = rows[0] as { id: string; email: string; display_name: string; avatar_url: string | null }

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
}): Promise<{ ok: true; user: { id: string; email: string; display_name: string; avatar_url: string | null } } | { ok: false; error: string }> {
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

  const user = rows[0] as { id: string; email: string; display_name: string; avatar_url: string | null; password_hash: string }
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

// ── Account management actions ─────────────────────────────

export async function changePassword(formData: {
  currentPassword: string
  newPassword: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { currentPassword, newPassword } = formData
  const session = await getSession()
  if (!session) return { ok: false, error: "Not authenticated." }

  if (!newPassword || newPassword.length < 6) {
    return { ok: false, error: "New password must be at least 6 characters." }
  }

  const rows = await sql(
    `SELECT password_hash FROM auth_users WHERE id = $1`,
    [session.id]
  )
  if (rows.length === 0) return { ok: false, error: "User not found." }

  const valid = await bcrypt.compare(currentPassword, rows[0].password_hash as string)
  if (!valid) return { ok: false, error: "Current password is incorrect." }

  const newHash = await bcrypt.hash(newPassword, 12)
  await sql(
    `UPDATE auth_users SET password_hash = $1, updated_at = now() WHERE id = $2`,
    [newHash, session.id]
  )

  return { ok: true }
}

export async function updateEmail(formData: {
  newEmail: string
  password: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { newEmail, password } = formData
  const session = await getSession()
  if (!session) return { ok: false, error: "Not authenticated." }

  if (!newEmail || !newEmail.includes("@")) {
    return { ok: false, error: "Enter a valid email address." }
  }

  const rows = await sql(
    `SELECT password_hash FROM auth_users WHERE id = $1`,
    [session.id]
  )
  if (rows.length === 0) return { ok: false, error: "User not found." }

  const valid = await bcrypt.compare(password, rows[0].password_hash as string)
  if (!valid) return { ok: false, error: "Password is incorrect." }

  const existing = await sql(
    `SELECT id FROM auth_users WHERE LOWER(email) = LOWER($1) AND id != $2`,
    [newEmail, session.id]
  )
  if (existing.length > 0) {
    return { ok: false, error: "This email is already in use." }
  }

  await sql(
    `UPDATE auth_users SET email = LOWER($1), updated_at = now() WHERE id = $2`,
    [newEmail, session.id]
  )

  return { ok: true }
}

export async function updateDisplayName(formData: {
  displayName: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession()
  if (!session) return { ok: false, error: "Not authenticated." }

  if (!formData.displayName || formData.displayName.trim().length === 0) {
    return { ok: false, error: "Display name is required." }
  }

  await sql(
    `UPDATE auth_users SET display_name = $1, updated_at = now() WHERE id = $2`,
    [formData.displayName.trim(), session.id]
  )

  await sql(
    `UPDATE user_profiles SET display_name = $1, updated_at = now() WHERE neon_auth_id = $2`,
    [formData.displayName.trim(), session.id]
  )

  return { ok: true }
}

export async function deleteAccount(formData: {
  password: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession()
  if (!session) return { ok: false, error: "Not authenticated." }

  const rows = await sql(
    `SELECT password_hash FROM auth_users WHERE id = $1`,
    [session.id]
  )
  if (rows.length === 0) return { ok: false, error: "User not found." }

  const valid = await bcrypt.compare(formData.password, rows[0].password_hash as string)
  if (!valid) return { ok: false, error: "Password is incorrect." }

  await sql(`DELETE FROM community_members WHERE user_id = $1`, [session.id])
  await sql(`DELETE FROM space_members WHERE user_id = $1`, [session.id])
  await sql(`DELETE FROM user_profiles WHERE neon_auth_id = $1`, [session.id])

  await destroySession()

  await sql(`DELETE FROM auth_users WHERE id = $1`, [session.id])

  return { ok: true }
}
