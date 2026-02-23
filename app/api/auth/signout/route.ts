import { sql } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { SESSION_COOKIE } from "@/lib/auth-session"

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (token) {
    await sql(`DELETE FROM auth_sessions WHERE token = $1`, [token])
  }

  const res = NextResponse.redirect(new URL("/", req.url), 303)
  res.cookies.delete(SESSION_COOKIE)

  return res
}
