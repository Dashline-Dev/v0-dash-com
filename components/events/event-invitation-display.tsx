"use client"

import { getTemplateById } from "@/lib/event-templates"
import type { EventWithMeta } from "@/types/event"
import { Shirt, Info, Phone, Image as ImageIcon, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EventInvitationDisplayProps {
  event: EventWithMeta
}

export function EventInvitationDisplay({ event }: EventInvitationDisplayProps) {
  const template = event.template_id ? getTemplateById(event.template_id) : null
  const hasInvitationContent =
    event.template_id ||
    event.invitation_image_url ||
    event.invitation_message ||
    event.additional_info ||
    event.dress_code ||
    event.contact_info ||
    (event.gallery_images && event.gallery_images.length > 0)

  if (!hasInvitationContent) {
    return null
  }

  const accentColor = template?.style.accentColor || "#2563EB"

  // The OG image route already handles the priority:
  //   1. uploaded invitation_image_url → redirect to it
  //   2. template → render branded card
  // So we just point the <img> and the download at the same route.
  const ogImageUrl = `/api/og/event/${event.slug}`
  const showPreviewImage = !!(template || event.invitation_image_url)

  async function handleDownload() {
    try {
      const res = await fetch(ogImageUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${event.slug}-invitation.jpg`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      window.open(ogImageUrl, "_blank")
    }
  }

  return (
    <div className="space-y-6">
      {/* Invitation image — the same image social media sees */}
      {showPreviewImage && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
              Invitation
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1.5"
              onClick={handleDownload}
            >
              <Download className="w-3.5 h-3.5" />
              Save Image
            </Button>
          </div>
          <div className="rounded-xl overflow-hidden border border-border shadow-sm">
            <img
              src={ogImageUrl}
              alt={`${event.title} invitation`}
              className="w-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Custom invitation message */}
      {!template && event.invitation_message && (
        <div
          className="py-6 px-4 rounded-xl border border-border bg-card text-center"
          style={{ borderLeftColor: accentColor, borderLeftWidth: "4px" }}
        >
          <p className="text-lg leading-relaxed text-foreground whitespace-pre-wrap">
            {event.invitation_message}
          </p>
        </div>
      )}

      {/* Event details cards */}
      {(event.dress_code || event.additional_info || event.contact_info) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {event.dress_code && (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: accentColor + "15" }}
              >
                <Shirt className="w-5 h-5" style={{ color: accentColor }} />
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Dress Code</h4>
                <p className="text-foreground mt-0.5">{event.dress_code}</p>
              </div>
            </div>
          )}

          {event.contact_info && (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: accentColor + "15" }}
              >
                <Phone className="w-5 h-5" style={{ color: accentColor }} />
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Contact</h4>
                <p className="text-foreground mt-0.5">{event.contact_info}</p>
              </div>
            </div>
          )}

          {event.additional_info && (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card sm:col-span-2">
              <div
                className="p-2 rounded-lg shrink-0"
                style={{ backgroundColor: accentColor + "15" }}
              >
                <Info className="w-5 h-5" style={{ color: accentColor }} />
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Additional Information</h4>
                <p className="text-foreground mt-0.5 whitespace-pre-wrap">{event.additional_info}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Photo gallery */}
      {event.gallery_images && event.gallery_images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
              Photos
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {event.gallery_images.map((url, idx) => (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square rounded-lg overflow-hidden border border-border hover:opacity-90 transition-opacity"
              >
                <img
                  src={url}
                  alt={`Gallery image ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
