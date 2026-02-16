"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Megaphone, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createAnnouncement, getTemplates } from "@/lib/actions/announcement-actions"
import type { AnnouncementPriority, AnnouncementTemplate, RecurrenceRule } from "@/types/announcement"
import { ANNOUNCEMENT_PRIORITY_LABELS, RECURRENCE_LABELS } from "@/types/announcement"

interface CreateAnnouncementFormProps {
  communityId: string
  communityName: string
  spaces?: { id: string; name: string }[]
  redirectPath?: string
}

export function CreateAnnouncementForm({
  communityId,
  communityName,
  spaces = [],
  redirectPath,
}: CreateAnnouncementFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [templates, setTemplates] = useState<AnnouncementTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)

  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [priority, setPriority] = useState<AnnouncementPriority>("normal")
  const [spaceId, setSpaceId] = useState<string>("")
  const [publishMode, setPublishMode] = useState<"publish" | "draft" | "schedule">("publish")
  const [publishTime, setPublishTime] = useState("")
  const [recurrence, setRecurrence] = useState<RecurrenceRule>("none")
  const [error, setError] = useState("")

  useEffect(() => {
    getTemplates(communityId).then((t) => {
      setTemplates(t)
      setLoadingTemplates(false)
    })
  }, [communityId])

  function applyTemplate(templateId: string) {
    const template = templates.find((t) => t.id === templateId)
    if (!template) return
    setTitle(template.title_template)
    setBody(template.body_template)
    setPriority(template.priority)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!title.trim()) {
      setError("Title is required")
      return
    }
    if (!body.trim()) {
      setError("Body is required")
      return
    }
    if (publishMode === "schedule" && !publishTime) {
      setError("Publish time is required for scheduled announcements")
      return
    }

    startTransition(async () => {
      try {
        const status = publishMode === "schedule" ? "scheduled" : publishMode === "draft" ? "draft" : "published"
        await createAnnouncement({
          community_id: communityId,
          space_id: spaceId || undefined,
          title: title.trim(),
          body: body.trim(),
          priority,
          status,
          publish_time: publishMode === "schedule" ? new Date(publishTime).toISOString() : undefined,
          recurrence_rule: recurrence,
        })
        router.push(redirectPath ?? "/announcements")
      } catch (err) {
        setError("Failed to create announcement. Please try again.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {/* Template selector */}
      {!loadingTemplates && templates.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Use a template</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => (
              <Button
                key={t.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyTemplate(t.id)}
                className="text-xs"
              >
                {t.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Community context */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Megaphone className="w-4 h-4" />
        <span>Posting to <span className="font-medium text-foreground">{communityName}</span></span>
      </div>

      {/* Space selector */}
      {spaces.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="space">Space (optional)</Label>
          <Select value={spaceId} onValueChange={setSpaceId}>
            <SelectTrigger id="space">
              <SelectValue placeholder="All community members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All community members</SelectItem>
              {spaces.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Announcement title"
          required
        />
      </div>

      {/* Body */}
      <div className="space-y-2">
        <Label htmlFor="body">Body</Label>
        <textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your announcement..."
          rows={6}
          required
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <Label>Priority</Label>
        <div className="flex gap-2">
          {(Object.keys(ANNOUNCEMENT_PRIORITY_LABELS) as AnnouncementPriority[]).map((p) => (
            <Button
              key={p}
              type="button"
              variant={priority === p ? "default" : "outline"}
              size="sm"
              onClick={() => setPriority(p)}
              className="text-xs"
            >
              {ANNOUNCEMENT_PRIORITY_LABELS[p]}
            </Button>
          ))}
        </div>
      </div>

      {/* Publish mode */}
      <div className="space-y-2">
        <Label>Publish mode</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={publishMode === "publish" ? "default" : "outline"}
            size="sm"
            onClick={() => setPublishMode("publish")}
            className="text-xs"
          >
            Publish now
          </Button>
          <Button
            type="button"
            variant={publishMode === "schedule" ? "default" : "outline"}
            size="sm"
            onClick={() => setPublishMode("schedule")}
            className="text-xs"
          >
            Schedule
          </Button>
          <Button
            type="button"
            variant={publishMode === "draft" ? "default" : "outline"}
            size="sm"
            onClick={() => setPublishMode("draft")}
            className="text-xs"
          >
            Save as draft
          </Button>
        </div>
      </div>

      {/* Schedule time */}
      {publishMode === "schedule" && (
        <div className="space-y-2">
          <Label htmlFor="publishTime">Publish date & time</Label>
          <Input
            id="publishTime"
            type="datetime-local"
            value={publishTime}
            onChange={(e) => setPublishTime(e.target.value)}
            required
          />
        </div>
      )}

      {/* Recurrence */}
      <div className="space-y-2">
        <Label htmlFor="recurrence">Recurrence</Label>
        <Select value={recurrence} onValueChange={(v) => setRecurrence(v as RecurrenceRule)}>
          <SelectTrigger id="recurrence">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(RECURRENCE_LABELS) as RecurrenceRule[]).map((r) => (
              <SelectItem key={r} value={r}>{RECURRENCE_LABELS[r]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Area stub */}
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3">
        <p className="text-xs text-muted-foreground">
          Area-based targeting will be available when the Areas module is built.
        </p>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Submit */}
      <div className="flex gap-3">
        <Button type="submit" disabled={isPending} className="gap-2">
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {publishMode === "publish"
            ? "Publish Announcement"
            : publishMode === "schedule"
            ? "Schedule Announcement"
            : "Save Draft"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
