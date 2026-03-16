"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StepIndicator } from "@/components/ui/step-indicator"
import { Loader2, ArrowLeft, ArrowRight, Save, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { updateEvent } from "@/lib/actions/event-actions"
import type { EventWithMeta } from "@/types/event"
import type { EventFormData } from "@/components/events/create/create-wizard"

import { StepBasics } from "@/components/events/create/step-basics"
import { StepDateTime } from "@/components/events/create/step-date-time"
import { StepLocation } from "@/components/events/create/step-location"
import { StepSettings } from "@/components/events/create/step-settings"
import { StepDesignPreview } from "@/components/events/create/step-design-preview"
import { StepReview } from "@/components/events/create/step-review"

const STEPS = ["Basics", "Date & Time", "Location", "Settings", "Design & Preview", "Review"]

// Split an ISO datetime string into { date: "YYYY-MM-DD", time: "HH:MM" }
function splitDateTime(dateStr: string): { date: string; time: string } {
  try {
    const d = new Date(dateStr)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    const hours = String(d.getHours()).padStart(2, "0")
    const minutes = String(d.getMinutes()).padStart(2, "0")
    return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` }
  } catch {
    return { date: "", time: "" }
  }
}

interface EditEventWizardProps {
  event: EventWithMeta
  communities?: { id: string; name: string; slug: string }[]
  canDelete?: boolean
  onDelete?: () => Promise<void>
  returnUrl?: string
}

export function EditEventWizard({
  event,
  communities = [],
  canDelete = false,
  onDelete,
  returnUrl,
}: EditEventWizardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  const [step, setStep] = useState(0)
  const [error, setError] = useState("")

  const parsedStart = splitDateTime(event.start_time)
  const parsedEnd = splitDateTime(event.end_time)

  const [formData, setFormData] = useState<EventFormData>({
    title: event.title,
    description: event.description ?? "",
    cover_image_url: event.cover_image_url ?? "",
    event_type: event.event_type,
    visibility: event.visibility,
    start_date: parsedStart.date,
    start_time: parsedStart.time,
    end_date: parsedEnd.date,
    end_time: parsedEnd.time,
    timezone: event.timezone,
    location_name: event.location_name ?? "",
    location_address: event.location_address ?? "",
    virtual_link: event.virtual_link ?? "",
    max_attendees: event.max_attendees ? String(event.max_attendees) : "",
    community_id: event.community_id ?? "",
    space_id: event.space_id ?? "",
    // Template & invitation fields
    template_id: event.template_id ?? "",
    card_size: "whatsapp",
    invitation_image_url: event.invitation_image_url ?? "",
    invitation_message: event.invitation_message ?? "",
    additional_info: event.additional_info ?? "",
    dress_code: event.dress_code ?? "",
    contact_info: event.contact_info ?? "",
    gallery_images: event.gallery_images ?? [],

  })

  const updateFormData = (updates: Partial<EventFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  const canProceed = () => {
    switch (step) {
      case 0:
        return formData.title.trim().length >= 3
      case 1:
        return !!(formData.start_date && formData.start_time)
      case 2:
        if (formData.event_type === "virtual") return formData.virtual_link.trim().length > 0
        if (formData.event_type === "in_person") return formData.location_name.trim().length > 0
        return formData.location_name.trim().length > 0 || formData.virtual_link.trim().length > 0
      default:
        return true
    }
  }

  const handleSave = () => {
    setError("")
    startTransition(async () => {
      try {
        if (!formData.start_date || !formData.start_time) {
          setError("Start date and time are required.")
          return
        }

        const startDateTime = `${formData.start_date}T${formData.start_time}:00`

        let endTime = formData.end_time
        if (!endTime) {
          const [h, m] = formData.start_time.split(":").map(Number)
          const endH = (h + 1) % 24
          endTime = `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`
        }
        const endDate = formData.end_date || formData.start_date
        const endDateTime = `${endDate}T${endTime}:00`

        if (new Date(endDateTime) <= new Date(startDateTime)) {
          setError("End time must be after start time.")
          return
        }

        await updateEvent(event.id, {
          title: formData.title,
          description: formData.description || null,
          cover_image_url: formData.cover_image_url || null,
          event_type: formData.event_type,
          visibility: formData.visibility,
          start_time: new Date(startDateTime).toISOString(),
          end_time: new Date(endDateTime).toISOString(),
          timezone: formData.timezone,
          location_name: formData.location_name || null,
          location_address: formData.location_address || null,
          virtual_link: formData.virtual_link || null,
          max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
          contact_info: formData.contact_info || null,
          template_id: formData.template_id || null,
          invitation_image_url: formData.invitation_image_url || null,
          invitation_message: formData.invitation_message || null,
          additional_info: formData.additional_info || null,
          dress_code: formData.dress_code || null,
          gallery_images: formData.gallery_images.length > 0 ? formData.gallery_images : null,

        })

        router.push(returnUrl || `/events/${event.slug}`)
      } catch (e) {
        console.error(e)
        setError("Failed to save event. Please try again.")
      }
    })
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setIsDeleting(true)
    try {
      await onDelete()
      router.push(returnUrl || "/events")
    } catch {
      setError("Failed to delete event.")
      setIsDeleting(false)
    }
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
        return (
          <StepSettings
            formData={formData}
            updateFormData={updateFormData}
            communities={communities}
            preSelectedCommunityId={event.community_id ?? undefined}
            preSelectedCommunityName={event.community_name ?? undefined}
            preSelectedSpaceId={event.space_id ?? undefined}
          />
        )
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
        {/* Left: Back or Delete */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || isPending || isDeleting}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {canDelete && onDelete && step === STEPS.length - 1 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isPending || isDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this event?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete &ldquo;{event.title}&rdquo; and all its data. This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Right: Next or Save */}
        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed() || isPending}
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={isPending || isDeleting} className="gap-2">
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </Button>
        )}
      </div>
    </div>
  )
}
