"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Megaphone, FileText, Settings, Bell, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
      } catch {
        setError("Failed to create announcement. Please try again.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Template selector */}
      {!loadingTemplates && templates.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => (
                <Button
                  key={t.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate(t.id)}
                >
                  {t.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-muted-foreground" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground pb-2 border-b border-border">
            <span>Posting to <span className="font-medium text-foreground">{communityName}</span></span>
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your announcement..."
              rows={6}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Priority & Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-muted-foreground" />
            Priority & Visibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                >
                  {ANNOUNCEMENT_PRIORITY_LABELS[p]}
                </Button>
              ))}
            </div>
          </div>

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
        </CardContent>
      </Card>

      {/* Publishing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Publishing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Publish mode</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={publishMode === "publish" ? "default" : "outline"}
                size="sm"
                onClick={() => setPublishMode("publish")}
              >
                Publish now
              </Button>
              <Button
                type="button"
                variant={publishMode === "schedule" ? "default" : "outline"}
                size="sm"
                onClick={() => setPublishMode("schedule")}
              >
                Schedule
              </Button>
              <Button
                type="button"
                variant={publishMode === "draft" ? "default" : "outline"}
                size="sm"
                onClick={() => setPublishMode("draft")}
              >
                Save as draft
              </Button>
            </div>
          </div>

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

          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">
              Announcements are automatically visible in areas linked to this community.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex items-center gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} className="gap-2">
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {publishMode === "publish"
            ? "Publish Announcement"
            : publishMode === "schedule"
            ? "Schedule Announcement"
            : "Save Draft"}
        </Button>
      </div>
    </form>
  )
}
