import { ImageResponse } from "next/og"
import { NextResponse } from "next/server"
import { get } from "@vercel/blob"
import { neon } from "@neondatabase/serverless"
import { getTemplateById } from "@/lib/event-templates"

export const runtime = "nodejs"

const sql = neon(process.env.DATABASE_URL!)

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // Fetch event data directly (no auth needed — public OG route)
  const rows = await sql(
    `SELECT e.title, e.description, e.start_time, e.end_time,
            e.location_name, e.invitation_image_url, e.cover_image_url,
            e.template_id, e.invitation_message,
            c.name as community_name, c.avatar_url as community_avatar
     FROM events e
     LEFT JOIN communities c ON c.id = e.community_id
     WHERE e.slug = $1 AND e.status = 'published'
     LIMIT 1`,
    [slug]
  )

  if (!rows || rows.length === 0) {
    return new Response("Not found", { status: 404 })
  }

  const event = rows[0]

  // Prefer the generated invitation image (template render) as the OG image.
  // Fall back to cover_image_url if present.
  const rawImageUrl = (event.invitation_image_url || event.cover_image_url) as string | null

  if (rawImageUrl) {
    try {
      // invitation_image_url is stored as a relative path like /api/file?pathname=...
      // Extract the blob pathname and fetch it directly via @vercel/blob get()
      // so external crawlers (Twitter, WhatsApp, etc.) receive the image bytes directly.
      let blobPathname: string | null = null

      if (rawImageUrl.startsWith("/api/file")) {
        const qs = new URL(rawImageUrl, "http://localhost").searchParams
        blobPathname = qs.get("pathname")
      } else if (rawImageUrl.includes("blob.vercel-storage.com")) {
        // Already a public blob URL — stream via fetch
        const res = await fetch(rawImageUrl)
        if (res.ok) {
          return new NextResponse(res.body, {
            headers: {
              "Content-Type": res.headers.get("Content-Type") || "image/jpeg",
              "Cache-Control": "public, max-age=3600",
            },
          })
        }
      }

      if (blobPathname) {
        const result = await get(blobPathname, { access: "private" }).catch(() => null)
        if (result && result.statusCode !== 304) {
          return new NextResponse(result.stream, {
            headers: {
              "Content-Type": result.blob.contentType || "image/jpeg",
              "Cache-Control": "public, max-age=3600, s-maxage=86400",
            },
          })
        }
      }
    } catch {
      // Fall through to generated ImageResponse below
    }
  }

  // Get template colors if a template is selected
  const template = event.template_id ? getTemplateById(event.template_id) : null
  const bg = template?.style.background ?? "#1a1a2e"
  const frameColor = template?.style.frameColor ?? "#c9a84c"
  const textColor = template?.style.textColor ?? "#ffffff"
  const accentColor = template?.style.accentColor ?? "#c9a84c"
  const isHebrew = template?.style.fontFamily === "hebrew"

  const dateStr = event.start_time ? formatDate(event.start_time) : ""
  const timeStr = event.start_time ? formatTime(event.start_time) : ""

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: bg.startsWith("#") || bg.startsWith("rgb") ? bg : "#1a1a2e",
          position: "relative",
          fontFamily: "serif",
          overflow: "hidden",
        }}
      >
        {/* Border frame */}
        <div
          style={{
            position: "absolute",
            inset: "20px",
            border: `3px solid ${frameColor}`,
            borderRadius: "8px",
            opacity: 0.6,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "28px",
            border: `1px solid ${frameColor}`,
            borderRadius: "6px",
            opacity: 0.3,
            display: "flex",
          }}
        />

        {/* Community badge */}
        {event.community_name && (
          <div
            style={{
              position: "absolute",
              top: "44px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                fontSize: "15px",
                color: accentColor,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                opacity: 0.9,
              }}
            >
              {event.community_name}
            </span>
          </div>
        )}

        {/* Invitation message */}
        {event.invitation_message && (
          <div
            style={{
              fontSize: "18px",
              color: textColor,
              opacity: 0.7,
              marginBottom: "16px",
              display: "flex",
            }}
          >
            {event.invitation_message}
          </div>
        )}

        {/* Event title */}
        <div
          style={{
            fontSize: isHebrew ? "72px" : "64px",
            fontWeight: "bold",
            color: textColor,
            textAlign: "center",
            maxWidth: "900px",
            lineHeight: 1.1,
            marginBottom: "28px",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {event.title}
        </div>

        {/* Divider */}
        <div
          style={{
            width: "120px",
            height: "2px",
            background: accentColor,
            marginBottom: "28px",
            display: "flex",
          }}
        />

        {/* Date & time */}
        <div
          style={{
            fontSize: "26px",
            color: accentColor,
            fontWeight: "600",
            marginBottom: "12px",
            display: "flex",
          }}
        >
          {dateStr}
        </div>
        <div
          style={{
            fontSize: "20px",
            color: textColor,
            opacity: 0.8,
            display: "flex",
          }}
        >
          {timeStr}
        </div>

        {/* Location */}
        {event.location_name && (
          <div
            style={{
              fontSize: "18px",
              color: textColor,
              opacity: 0.65,
              marginTop: "16px",
              display: "flex",
            }}
          >
            {event.location_name}
          </div>
        )}

        {/* Branding footer */}
        <div
          style={{
            position: "absolute",
            bottom: "38px",
            fontSize: "12px",
            color: textColor,
            opacity: 0.4,
            letterSpacing: "0.1em",
            display: "flex",
          }}
        >
          Community Circle
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
