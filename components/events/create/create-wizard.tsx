"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StepIndicator } from "@/components/ui/step-indicator"
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react"
import { createEvent } from "@/lib/actions/event-actions"
import type { EventType, EventVisibility } from "@/types/event"

import { StepBasics } from "./step-basics"
import { StepDateTime } from "./step-date-time"
import { StepLocation } from "./step-location"
import { StepSettings } from "./step-settings"
import { StepDesignPreview } from "./step-design-preview"
import { StepReview } from "./step-review"

export interface EventFormData {
  title: string
  description: string
  cover_image_url: string
  event_type: EventType
  visibility: EventVisibility
  start_date: string
  start_time: string
  end_date: string
  end_time: string
  timezone: string
  location_name: string
  location_address: string
  virtual_link: string
  max_attendees: string
  community_id: string
  space_id: string
  // Template & invitation fields
  template_id: string
  card_size: string
  invitation_image_url: string
  invitation_message: string
  additional_info: string
  dress_code: string
  contact_info: string
  gallery_images: string[]
  rsvp_deadline: string
}

const STEPS = ["Basics", "Date & Time", "Location", "Settings", "Design & Preview", "Review"]

interface CreateEventWizardProps {
  communities?: { id: string; name: string; slug: string }[]
  preSelectedCommunityId?: string
}

export function CreateEventWizard({ communities = [], preSelectedCommunityId }: CreateEventWizardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState(0)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    cover_image_url: "",
    event_type: "in_person",
    visibility: "public",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    location_name: "",
    location_address: "",
    virtual_link: "",
    max_attendees: "",
    community_id: preSelectedCommunityId || "",
    space_id: "",
    // Template & invitation fields
    template_id: "",
    card_size: "whatsapp",
    invitation_image_url: "",
    invitation_message: "",
    additional_info: "",
    dress_code: "",
    contact_info: "",
    gallery_images: [],
    rsvp_deadline: "",
  })

  const updateFormData = (updates: Partial<EventFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  const canProceed = () => {
    switch (step) {
      case 0: // Basics
        return formData.title.trim().length >= 3
      case 1: // Date & Time
        return formData.start_date && formData.start_time
      case 2: // Location
        if (formData.event_type === "virtual") {
          return formData.virtual_link.trim().length > 0
        }
        if (formData.event_type === "in_person") {
          return formData.location_name.trim().length > 0
        }
        // hybrid - need at least one
        return formData.location_name.trim().length > 0 || formData.virtual_link.trim().length > 0
      case 3: // Settings
        return true
      case 4: // Design & Preview (optional)
        return true
      default:
        return true
    }
  }

  const handleSubmit = () => {
    setError("")
    startTransition(async () => {
      try {
        const startDateTime = `${formData.start_date}T${formData.start_time}:00`
        
        // If no end time specified, default to 1 hour after start time
        let endTime = formData.end_time
        if (!endTime && formData.start_time) {
          const [h, m] = formData.start_time.split(":").map(Number)
          const endH = (h + 1) % 24
          endTime = `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`
        }
        const endDate = formData.end_date || formData.start_date
        const endDateTime = `${endDate}T${endTime || formData.start_time}:00`

        const slug = await createEvent({
          title: formData.title,
          description: formData.description || undefined,
          cover_image_url: formData.cover_image_url || undefined,
          event_type: formData.event_type,
          visibility: formData.visibility,
          start_time: startDateTime,
          end_time: endDateTime,
          timezone: formData.timezone,
          location_name: formData.location_name || undefined,
          location_address: formData.location_address || undefined,
          virtual_link: formData.virtual_link || undefined,
          max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : undefined,
          community_id: formData.community_id || null,
          space_id: formData.space_id || null,
          // Template & invitation fields
          template_id: formData.template_id || undefined,
          invitation_image_url: formData.invitation_image_url || undefined,
          invitation_message: formData.invitation_message || undefined,
          additional_info: formData.additional_info || undefined,
          dress_code: formData.dress_code || undefined,
          contact_info: formData.contact_info || undefined,
          gallery_images: formData.gallery_images.length > 0 ? formData.gallery_images : undefined,
          rsvp_deadline: formData.rsvp_deadline || undefined,
        })

        // Redirect to the event page
        router.push(`/events/${slug}`)
      } catch (e) {
        console.error(e)
        setError("Failed to create event. Please try again.")
      }
    })
  }

  const renderStep = () => {
    switch (step) {
      case 0:
        return <StepBasics formData={formData} updateFormData={updateFormData} />
      case 1:
        return <StepDateTime formData={formData} updateFormData={updateFormData} />
      case 2:
        return <StepLocation formData={formData} updateFormData={updateFormData} />
      case 3:
        return <StepSettings formData={formData} updateFormData={updateFormData} communities={communities} />
      case 4:
        return <StepDesignPreview formData={formData} updateFormData={updateFormData} />
      case 5:
        return <StepReview formData={formData} communities={communities} />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <StepIndicator steps={STEPS} currentStep={step} />

      <Card>
        <CardContent className="pt-6">
          {renderStep()}

          {error && (
            <p className="text-sm text-destructive mt-4">{error}</p>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || isPending}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed() || isPending}
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Event"
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
