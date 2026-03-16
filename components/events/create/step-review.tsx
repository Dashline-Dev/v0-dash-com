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
  Calendar, Clock, MapPin, Video, Globe, Lock, Link2, Users, Pencil, Check, X,
} from "lucide-react"
import type { EventFormData } from "./create-wizard"
import { EVENT_TYPE_LABELS, EVENT_VISIBILITY_LABELS } from "@/types/event"
import { getTemplateById } from "@/lib/event-templates"
import { InvitationCard } from "@/components/events/invitation-card"
import { HebrewDatePicker } from "@/components/ui/hebrew-date-picker"
import { toHebrewDate } from "@/lib/hebrew-date"

interface StepReviewProps {
  formData: EventFormData
  updateFormData: (updates: Partial<EventFormData>) => void
  communities?: { id: string; name: string; slug: string }[]
}

// ── Mini inline-edit helpers ──────────────────────────────────

interface EditableFieldProps {
  label: string
  value: string
  multiline?: boolean
  onSave: (val: string) => void
}

function EditableField({ label, value, multiline, onSave }: EditableFieldProps) {
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
        <Label className="text-xs text-muted-foreground">{label}</Label>
        {multiline ? (
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            className="text-sm resize-none"
            autoFocus
          />
        ) : (
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="text-sm h-8"
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel() }}
          />
        )}
        <div className="flex gap-1.5">
          <Button type="button" size="sm" className="h-7 text-xs px-2.5" onClick={commit}>
            <Check className="w-3 h-3 mr-1" />Save
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={cancel}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex items-start gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm text-foreground whitespace-pre-line break-words">
          {value || <span className="text-muted-foreground italic">Not set</span>}
        </p>
      </div>
      <button
        type="button"
        onClick={() => { setDraft(value); setEditing(true) }}
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent"
        aria-label={`Edit ${label}`}
      >
        <Pencil className="w-3 h-3 text-muted-foreground" />
      </button>
    </div>
  )
}

// ── Formatting helpers ────────────────────────────────────────

function formatDateDisplay(date: string): string {
  if (!date) return ""
  const d = new Date(date + "T12:00:00")
  const greg = d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
  const heb = toHebrewDate(d).short
  return `${greg} · ${heb}`
}

function formatTimeDisplay(time: string): string {
  if (!time) return ""
  const [h, m] = time.split(":").map(Number)
  const ampm = h >= 12 ? "PM" : "AM"
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`
}

// ── Section wrapper ───────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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

  const visibilityIcon = { public: Globe, unlisted: Link2, private: Lock }[formData.visibility]
  const VisIcon = visibilityIcon

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
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Review &amp; Finalize</h2>
        <p className="text-sm text-muted-foreground">
          Everything looks editable — hover any field to make a quick change.
        </p>
      </div>

      {/* ── Invitation preview ── */}
      {(template || formData.invitation_image_url) && (
        <Section title="Invitation">
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

      {/* ── Basics ── */}
      <Section title="Basics">
        <EditableField
          label="Title"
          value={formData.title}
          onSave={(v) => updateFormData({ title: v })}
        />
        <EditableField
          label="Description"
          value={formData.description}
          multiline
          onSave={(v) => updateFormData({ description: v })}
        />

        {/* Type & Visibility badges + inline select */}
        <div className="space-y-2">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Type &amp; Visibility</p>
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={formData.event_type} onValueChange={(v) => updateFormData({ event_type: v as EventFormData["event_type"] })}>
              <SelectTrigger className="h-7 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EVENT_TYPE_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k} className="text-xs">{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={formData.visibility} onValueChange={(v) => updateFormData({ visibility: v as EventFormData["visibility"] })}>
              <SelectTrigger className="h-7 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EVENT_VISIBILITY_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k} className="text-xs">{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {community && (
              <Badge variant="outline" className="text-xs">{community.name}</Badge>
            )}
          </div>
        </div>
      </Section>

      {/* ── Date & Time ── */}
      <Section title="Date &amp; Time">
        <div className="space-y-2">
          <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Start</Label>
          <HebrewDatePicker
            date={formData.start_date}
            time={formData.start_time}
            showTimePicker
            onDateChange={(d) => updateFormData({ start_date: d })}
            onTimeChange={(t) => updateFormData({ start_time: t })}
          />
        </div>
        {formData.end_date && (
          <div className="space-y-2">
            <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">End</Label>
            <HebrewDatePicker
              date={formData.end_date}
              time={formData.end_time}
              minDate={formData.start_date}
              showTimePicker
              onDateChange={(d) => updateFormData({ end_date: d })}
              onTimeChange={(t) => updateFormData({ end_time: t })}
            />
          </div>
        )}
        {formData.timezone && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Globe className="w-3 h-3" />{formData.timezone}
          </p>
        )}
      </Section>

      {/* ── Location ── */}
      {(formData.location_name || formData.virtual_link || formData.event_type === "virtual") && (
        <Section title="Location">
          {formData.location_name && (
            <EditableField
              label="Venue"
              value={formData.location_name}
              onSave={(v) => updateFormData({ location_name: v })}
            />
          )}
          {formData.location_address && (
            <EditableField
              label="Address"
              value={formData.location_address}
              onSave={(v) => updateFormData({ location_address: v })}
            />
          )}
          {formData.virtual_link && (
            <EditableField
              label="Virtual Link"
              value={formData.virtual_link}
              onSave={(v) => updateFormData({ virtual_link: v })}
            />
          )}
        </Section>
      )}

      {/* ── Additional details ── */}
      {(formData.invitation_message || formData.dress_code || formData.contact_info || formData.additional_info) && (
        <Section title="Additional Details">
          {formData.invitation_message && (
            <EditableField
              label="Invitation Message"
              value={formData.invitation_message}
              multiline
              onSave={(v) => updateFormData({ invitation_message: v })}
            />
          )}
          {formData.dress_code && (
            <EditableField
              label="Dress Code"
              value={formData.dress_code}
              onSave={(v) => updateFormData({ dress_code: v })}
            />
          )}
          {formData.contact_info && (
            <EditableField
              label="Contact Info"
              value={formData.contact_info}
              onSave={(v) => updateFormData({ contact_info: v })}
            />
          )}
          {formData.additional_info && (
            <EditableField
              label="Additional Info"
              value={formData.additional_info}
              multiline
              onSave={(v) => updateFormData({ additional_info: v })}
            />
          )}
        </Section>
      )}

      {/* ── Settings ── */}
      {formData.max_attendees && (
        <Section title="Settings">
          <EditableField
            label="Max Attendees"
            value={formData.max_attendees}
            onSave={(v) => updateFormData({ max_attendees: v })}
          />
        </Section>
      )}
    </div>
  )
}
