"use client"

import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Video, Globe, Lock, Link2, Users } from "lucide-react"
import type { EventFormData } from "./create-wizard"
import { EVENT_TYPE_LABELS, EVENT_VISIBILITY_LABELS } from "@/types/event"

interface StepReviewProps {
  formData: EventFormData
  communities?: { id: string; name: string; slug: string }[]
}

export function StepReview({ formData, communities = [] }: StepReviewProps) {
  const community = communities.find((c) => c.id === formData.community_id)
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Review Your Event</h2>
        <p className="text-sm text-muted-foreground">
          Make sure everything looks good before creating your event.
        </p>
      </div>

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
      </div>
    </div>
  )
}
