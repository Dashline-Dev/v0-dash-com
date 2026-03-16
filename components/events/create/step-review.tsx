"use client"

import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Video, Globe, Lock, Link2, Users, Shirt, Phone, Info } from "lucide-react"
import type { EventFormData } from "./create-wizard"
import { EVENT_TYPE_LABELS, EVENT_VISIBILITY_LABELS } from "@/types/event"
import { getTemplateById } from "@/lib/event-templates"
import { InvitationCard } from "@/components/events/invitation-card"

interface StepReviewProps {
  formData: EventFormData
  communities?: { id: string; name: string; slug: string }[]
}

export function StepReview({ formData, communities = [] }: StepReviewProps) {
  const community = communities.find((c) => c.id === formData.community_id)
  const template = formData.template_id ? getTemplateById(formData.template_id) : null
  const visibilityIcon = {
    public: Globe,
    unlisted: Link2,
    private: Lock,
  }[formData.visibility]
  const VisIcon = visibilityIcon

  const formatDate = (date: string) => {
    if (!date) return ""
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (time: string) => {
    if (!time) return ""
    const [hours, minutes] = time.split(":")
    const h = parseInt(hours)
    const ampm = h >= 12 ? "PM" : "AM"
    const hour12 = h % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  // Construct a preview event object for the invitation card
  const previewEvent = {
    title: formData.title || "Your Event",
    start_time: formData.start_date && formData.start_time 
      ? `${formData.start_date}T${formData.start_time}:00` 
      : new Date().toISOString(),
    end_time: formData.end_date && formData.end_time
      ? `${formData.end_date}T${formData.end_time}:00`
      : new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    location_name: formData.location_name,
    location_address: formData.location_address,
    dress_code: formData.dress_code,
    invitation_message: formData.invitation_message,
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Review Your Event</h2>
        <p className="text-sm text-muted-foreground">
          Make sure everything looks good before creating your event.
        </p>
      </div>

      {/* Invitation preview */}
      {template && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Invitation Preview
          </h3>
          <div className="flex justify-center">
            <div className="w-full max-w-sm">
              <InvitationCard
                event={previewEvent}
                template={template}
                className="w-full shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Uploaded invitation image */}
      {formData.invitation_image_url && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Uploaded Invitation
          </h3>
          <div className="rounded-lg overflow-hidden border border-border max-w-sm mx-auto">
            <img
              src={formData.invitation_image_url}
              alt="Invitation"
              className="w-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Event details card */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-foreground">{formData.title || "Untitled Event"}</h3>
          {formData.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
              {formData.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1.5">
            {formData.event_type === "in_person" && <MapPin className="w-3 h-3" />}
            {formData.event_type === "virtual" && <Video className="w-3 h-3" />}
            {formData.event_type === "hybrid" && <Users className="w-3 h-3" />}
            {EVENT_TYPE_LABELS[formData.event_type]}
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <VisIcon className="w-3 h-3" />
            {EVENT_VISIBILITY_LABELS[formData.visibility]}
          </Badge>
          {template && (
            <Badge variant="outline" className="gap-1.5 bg-primary/5">
              {template.name}
            </Badge>
          )}
          {community && (
            <Badge variant="outline" className="gap-1.5">
              {community.name}
            </Badge>
          )}
        </div>

        <hr className="border-border" />

        <div className="grid gap-3 text-sm">
          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">{formatDate(formData.start_date)}</p>
              {formData.start_date !== formData.end_date && (
                <p className="text-muted-foreground">to {formatDate(formData.end_date)}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <p>
              {formatTime(formData.start_time)} - {formatTime(formData.end_time)}
              <span className="text-muted-foreground ml-1">({formData.timezone})</span>
            </p>
          </div>

          {formData.location_name && (
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{formData.location_name}</p>
                {formData.location_address && (
                  <p className="text-muted-foreground">{formData.location_address}</p>
                )}
              </div>
            </div>
          )}

          {formData.virtual_link && (
            <div className="flex items-center gap-3">
              <Video className="w-4 h-4 text-muted-foreground" />
              <p className="text-primary truncate">{formData.virtual_link}</p>
            </div>
          )}

          {formData.max_attendees && (
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-muted-foreground" />
              <p>Maximum {formData.max_attendees} attendees</p>
            </div>
          )}
        </div>

        {/* Additional invitation details */}
        {(formData.dress_code || formData.contact_info || formData.additional_info) && (
          <>
            <hr className="border-border" />
            <div className="grid gap-3 text-sm">
              {formData.dress_code && (
                <div className="flex items-center gap-3">
                  <Shirt className="w-4 h-4 text-muted-foreground" />
                  <p>Dress code: {formData.dress_code}</p>
                </div>
              )}
              {formData.contact_info && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <p>Contact: {formData.contact_info}</p>
                </div>
              )}
              {formData.additional_info && (
                <div className="flex items-start gap-3">
                  <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <p className="text-muted-foreground">{formData.additional_info}</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Gallery preview */}
        {formData.gallery_images && formData.gallery_images.length > 0 && (
          <>
            <hr className="border-border" />
            <div className="space-y-2">
              <p className="text-sm font-medium">{formData.gallery_images.length} photos attached</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {formData.gallery_images.slice(0, 4).map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`Gallery ${idx + 1}`}
                    className="w-16 h-16 rounded object-cover border"
                  />
                ))}
                {formData.gallery_images.length > 4 && (
                  <div className="w-16 h-16 rounded bg-muted flex items-center justify-center text-sm text-muted-foreground">
                    +{formData.gallery_images.length - 4}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
