import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth-session"

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const displayName = formData.get("displayName") as string

  if (!email || !password || !displayName) {
    const url = new URL("/signup", req.url)
    url.searchParams.set("error", "All fields are required.")
    return NextResponse.redirect(url, 303)
  }

  if (password.length < 6) {
    const url = new URL("/signup", req.url)
    url.searchParams.set("error", "Password must be at least 6 characters.")
    return NextResponse.redirect(url, 303)
  }

  const existing = await sql(
    `SELECT id FROM auth_users WHERE LOWER(email) = LOWER($1)`,
    [email]
  )
  if (existing.length > 0) {
    const url = new URL("/signup", req.url)
    url.searchParams.set("error", "An account with this email already exists.")
    return NextResponse.redirect(url, 303)
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

  // Create session
  const token = generateToken()
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000)
  await sql(
    `INSERT INTO auth_sessions (user_id, token, expires_at) VALUES ($1::uuid, $2, $3)`,
    [user.id, token, expiresAt.toISOString()]
  )

  // Redirect with Set-Cookie header on the 303 response
  const res = NextResponse.redirect(new URL("/", req.url), 303)
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "none" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })

  return res
}
