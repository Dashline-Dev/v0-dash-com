"use client"

import { cn } from "@/lib/utils"
import { getTemplateById } from "@/lib/event-templates"
import type { EventWithMeta } from "@/types/event"
import { Shirt, Info, Phone, Calendar } from "lucide-react"

interface EventInvitationDisplayProps {
  event: EventWithMeta
}

export function EventInvitationDisplay({ event }: EventInvitationDisplayProps) {
  const template = event.template_id ? getTemplateById(event.template_id) : null
  const hasInvitationContent =
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
  const fontFamily = template?.style.fontFamily || "sans-serif"
  const headerStyle = template?.style.headerStyle || "modern"

  const headerClasses = {
    elegant: "text-center italic",
    modern: "text-left font-medium",
    playful: "text-center font-bold",
    formal: "text-center uppercase tracking-wider",
    minimal: "text-left font-light",
  }

  return (
    <div className="space-y-6">
      {/* Invitation image */}
      {event.invitation_image_url && (
        <div className="rounded-xl overflow-hidden border border-border shadow-sm">
          <img
            src={event.invitation_image_url}
            alt={`${event.title} invitation`}
            className="w-full object-contain max-h-[600px]"
          />
        </div>
      )}

      {/* Invitation message */}
      {event.invitation_message && (
        <div
          className={cn(
            "py-6 px-4 rounded-xl border border-border bg-card",
            fontFamily === "serif" && "font-serif",
            headerClasses[headerStyle]
          )}
          style={{ borderLeftColor: accentColor, borderLeftWidth: "4px" }}
        >
          <p className="text-lg leading-relaxed text-foreground whitespace-pre-wrap">
            {event.invitation_message}
          </p>
        </div>
      )}

      {/* Event details cards */}
      {(event.dress_code || event.additional_info || event.contact_info || event.rsvp_deadline) && (
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

          {event.rsvp_deadline && (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: accentColor + "15" }}
              >
                <Calendar className="w-5 h-5" style={{ color: accentColor }} />
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">RSVP By</h4>
                <p className="text-foreground mt-0.5">
                  {new Date(event.rsvp_deadline).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
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
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
            Photos
          </h3>
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
