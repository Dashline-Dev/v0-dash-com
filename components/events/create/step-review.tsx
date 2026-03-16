"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Globe, Lock, Link2, Pencil, Check, X, Plus,
} from "lucide-react"
import type { EventFormData } from "./create-wizard"
import { EVENT_TYPE_LABELS, EVENT_VISIBILITY_LABELS } from "@/types/event"
import { getTemplateById } from "@/lib/event-templates"
import { InvitationCard } from "@/components/events/invitation-card"
import { HebrewDatePicker } from "@/components/ui/hebrew-date-picker"
import { toHebrewDate } from "@/lib/hebrew-date"
import { cn } from "@/lib/utils"

interface StepReviewProps {
  formData: EventFormData
  updateFormData: (updates: Partial<EventFormData>) => void
  communities?: { id: string; name: string; slug: string }[]
}

// ── Inline editable field ──────────────────────────────────────

interface EditableFieldProps {
  label: string
  value: string
  placeholder?: string
  multiline?: boolean
  onSave: (val: string) => void
}

function EditableField({ label, value, placeholder, multiline, onSave }: EditableFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function commit() {
    onSave(draft)
    setEditing(false)
  }

  function cancel() {
    setDraft(value)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="space-y-1.5">
        <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </Label>
        {multiline ? (
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="text-sm resize-none"
            autoFocus
          />
        ) : (
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            className="text-sm h-8"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") commit()
              if (e.key === "Escape") cancel()
            }}
          />
        )}
        <div className="flex gap-1.5">
          <Button type="button" size="sm" className="h-7 text-xs px-2.5" onClick={commit}>
            <Check className="w-3 h-3 mr-1" />
            Save
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={cancel}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    )
  }

  const isEmpty = !value

  return (
    <div className="group flex items-start gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <p
          className={cn(
            "text-sm whitespace-pre-line break-words",
            isEmpty ? "text-muted-foreground/50 italic" : "text-foreground"
          )}
        >
          {value || placeholder || "Not set"}
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          setDraft(value)
          setEditing(true)
        }}
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent"
        aria-label={`Edit ${label}`}
      >
        {isEmpty ? (
          <Plus className="w-3 h-3 text-muted-foreground" />
        ) : (
          <Pencil className="w-3 h-3 text-muted-foreground" />
        )}
      </button>
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </h3>
      {children}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

export function StepReview({ formData, updateFormData, communities = [] }: StepReviewProps) {
  const community = communities.find((c) => c.id === formData.community_id)
  const template = formData.template_id ? getTemplateById(formData.template_id) : null

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
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Review &amp; Confirm</h2>
        <p className="text-sm text-muted-foreground">
          Review all event details before publishing. Hover any field to edit it.
        </p>
      </div>

      {/* Invitation preview */}
      {(template || formData.invitation_image_url) && (
        <Section title="Invitation Preview">
          {template && (
            <div className="flex justify-center">
              <div className="w-full max-w-xs">
                <InvitationCard event={previewEvent} template={template} className="w-full shadow-md" />
              </div>
            </div>
          )}
          {formData.invitation_image_url && !template && (
            <div className="rounded-lg overflow-hidden border border-border max-w-xs mx-auto">
              <img src={formData.invitation_image_url} alt="Invitation" className="w-full object-contain" />
            </div>
          )}
        </Section>
      )}

      {/* Basics */}
      <Section title="Basics">
        <EditableField
          label="Title"
          value={formData.title}
          placeholder="e.g., Annual Community Dinner"
          onSave={(v) => updateFormData({ title: v })}
        />
        <EditableField
          label="Description"
          value={formData.description}
          placeholder="Describe your event..."
          multiline
          onSave={(v) => updateFormData({ description: v })}
        />

        {/* Type & Visibility */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Type &amp; Visibility
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            <Select
              value={formData.event_type}
              onValueChange={(v) => updateFormData({ event_type: v as EventFormData["event_type"] })}
            >
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EVENT_TYPE_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k} className="text-xs">{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={formData.visibility}
              onValueChange={(v) => updateFormData({ visibility: v as EventFormData["visibility"] })}
            >
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EVENT_VISIBILITY_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k} className="text-xs">{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {community && (
              <Badge variant="outline" className="text-xs h-8 px-3">{community.name}</Badge>
            )}
          </div>
        </div>
      </Section>

      {/* Date & Time */}
      <Section title="Date &amp; Time">
        <div className="space-y-2">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Start
          </Label>
          <HebrewDatePicker
            date={formData.start_date}
            time={formData.start_time}
            showTimePicker
            onDateChange={(d) => updateFormData({ start_date: d })}
            onTimeChange={(t) => updateFormData({ start_time: t })}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            End
          </Label>
          <HebrewDatePicker
            date={formData.end_date}
            time={formData.end_time}
            minDate={formData.start_date}
            showTimePicker
            onDateChange={(d) => updateFormData({ end_date: d })}
            onTimeChange={(t) => updateFormData({ end_time: t })}
          />
        </div>
        {formData.timezone && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Globe className="w-3 h-3" />
            {formData.timezone}
          </p>
        )}
      </Section>

      {/* Location */}
      <Section title="Location">
        <EditableField
          label="Venue Name"
          value={formData.location_name || ""}
          placeholder="e.g., The Royal Palace"
          onSave={(v) => updateFormData({ location_name: v })}
        />
        <EditableField
          label="Address"
          value={formData.location_address || ""}
          placeholder="e.g., 123 Main St, Brooklyn, NY 11201"
          onSave={(v) => updateFormData({ location_address: v })}
        />
        <EditableField
          label="Virtual / Livestream Link"
          value={formData.virtual_link || ""}
          placeholder="e.g., https://zoom.us/j/..."
          onSave={(v) => updateFormData({ virtual_link: v })}
        />
      </Section>

      {/* Invitation & Messaging */}
      <Section title="Invitation &amp; Messaging">
        <EditableField
          label="Invitation Message"
          value={formData.invitation_message || ""}
          placeholder="e.g., Please join us to celebrate..."
          multiline
          onSave={(v) => updateFormData({ invitation_message: v })}
        />
        <EditableField
          label="Dress Code"
          value={formData.dress_code || ""}
          placeholder="e.g., Formal, Business Casual, Black Tie"
          onSave={(v) => updateFormData({ dress_code: v })}
        />
        <EditableField
          label="Additional Information"
          value={formData.additional_info || ""}
          placeholder="Any extra details for guests..."
          multiline
          onSave={(v) => updateFormData({ additional_info: v })}
        />
        <EditableField
          label="Contact Information"
          value={formData.contact_info || ""}
          placeholder="e.g., Questions? Call 555-1234"
          onSave={(v) => updateFormData({ contact_info: v })}
        />
      </Section>

      {/* Capacity & Settings */}
      <Section title="Capacity &amp; Settings">
        <EditableField
          label="Max Attendees"
          value={formData.max_attendees || ""}
          placeholder="Leave blank for unlimited"
          onSave={(v) => updateFormData({ max_attendees: v })}
        />
      </Section>
    </div>
  )
}
