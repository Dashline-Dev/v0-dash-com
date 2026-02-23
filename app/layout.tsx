import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { cookies } from "next/headers"
import { sql } from "@/lib/db"
import { TopNav } from "@/components/shell/top-nav"
import { BottomNav } from "@/components/shell/bottom-nav"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Community Circle",
  description:
    "Discover and build communities around the things you care about.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

/** Read session from the cookie – uses SameSite=None for iframe compat. */
async function readUser() {
  try {
    const jar = await cookies()
    const token = jar.get("session_token")?.value
    if (!token) return null

    const rows = await sql(
      `SELECT u.id, u.email, u.display_name, u.avatar_url
       FROM auth_sessions s
       JOIN auth_users u ON u.id = s.user_id
       WHERE s.token = $1 AND s.expires_at > now()`,
      [token]
    )
    if (rows.length === 0) return null
    const u = rows[0]
    return {
      id: u.id as string,
      name: u.display_name as string,
      avatar: (u.avatar_url as string) || null,
    }
  } catch {
    return null
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await readUser()

  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="min-h-dvh flex flex-col">
          <TopNav user={user} />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <BottomNav user={user} />
        </div>
        <Analytics />
      </body>
    </html>
  )
}
