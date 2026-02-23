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
  const redirectTo = (formData.get("redirectTo") as string) || "/"

  if (!email || !password) {
    const url = new URL("/signin", req.url)
    url.searchParams.set("error", "Email and password are required.")
    return NextResponse.redirect(url, 303)
  }

  const rows = await sql(
    `SELECT id, email, display_name, avatar_url, password_hash
     FROM auth_users WHERE LOWER(email) = LOWER($1)`,
    [email]
  )

  if (rows.length === 0) {
    const url = new URL("/signin", req.url)
    url.searchParams.set("error", "Invalid email or password.")
    return NextResponse.redirect(url, 303)
  }

  const user = rows[0] as {
    id: string
    email: string
    display_name: string
    avatar_url: string | null
    password_hash: string
  }
  const valid = await bcrypt.compare(password, user.password_hash)

  if (!valid) {
    const url = new URL("/signin", req.url)
    url.searchParams.set("error", "Invalid email or password.")
    return NextResponse.redirect(url, 303)
  }

  // Create session
  const token = generateToken()
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000)
  await sql(
    `INSERT INTO auth_sessions (user_id, token, expires_at) VALUES ($1::uuid, $2, $3)`,
    [user.id, token, expiresAt.toISOString()]
  )

  // Redirect with Set-Cookie header on the 303 response
  const res = NextResponse.redirect(new URL(redirectTo, req.url), 303)
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "none" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })

  return res
}
