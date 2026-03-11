"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createSpace } from "@/lib/actions/space-actions"
import {
  SPACE_TYPE_OPTIONS,
  SPACE_VISIBILITY_OPTIONS,
  SPACE_JOIN_POLICY_OPTIONS,
} from "@/types/space"

interface SpaceCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  communityId?: string
  communitySlug?: string
  communities?: { id: string; name: string; slug: string }[]
  onSuccess?: (space: { id: string; slug: string }) => void
}

export function SpaceCreateDialog({
  open,
  onOpenChange,
  communityId,
  communitySlug,
  communities = [],
  onSuccess,
}: SpaceCreateDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    communityId: communityId || "",
    type: "general" as string,
    visibility: "public" as string,
    join_policy: "open" as string,
  })

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setForm({
        name: "",
        slug: "",
        description: "",
        communityId: communityId || "",
        type: "general",
        visibility: "public",
        join_policy: "open",
      })
      setError("")
    }
  }, [open, communityId])

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
    setForm((f) => ({ ...f, name, slug }))
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("Name is required")
      return
    }
    if (!form.slug.trim()) {
      setError("Slug is required")
      return
    }
    if (!form.communityId && communities.length > 0) {
      setError("Please select a community")
      return
    }

    setLoading(true)
    setError("")

    try {
      const result = await createSpace({
        community_id: form.communityId || communityId!,
        name: form.name,
        slug: form.slug,
        description: form.description || undefined,
        type: form.type as "general" | "discussion" | "events" | "announcements" | "resources" | "projects",
        visibility: form.visibility as "public" | "unlisted" | "private",
        join_policy: form.join_policy as "open" | "approval" | "invite_only",
      })

      if (result.slug) {
        onOpenChange(false)
        if (onSuccess) {
          onSuccess({ id: result.slug, slug: result.slug })
        } else {
          // Navigate to the new space
          const targetCommunitySlug = communitySlug || communities.find(c => c.id === form.communityId)?.slug
          if (targetCommunitySlug) {
            router.push(`/communities/${targetCommunitySlug}/spaces/${result.slug}`)
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create space")
    } finally {
      setLoading(false)
    }
  }

  const showCommunitySelect = !communityId && communities.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Space</DialogTitle>
          <DialogDescription>
            Add a new space for discussions, events, or resources
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="space-name">Name</Label>
            <Input
              id="space-name"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="General Discussion"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="space-slug">URL Slug</Label>
            <Input
              id="space-slug"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="general-discussion"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="space-description">Description (optional)</Label>
            <Textarea
              id="space-description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What is this space about?"
              rows={2}
            />
          </div>

          {showCommunitySelect && (
            <div className="space-y-2">
              <Label>Community</Label>
              <Select
                value={form.communityId}
                onValueChange={(val) => setForm((f) => ({ ...f, communityId: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a community" />
                </SelectTrigger>
                <SelectContent>
                  {communities.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={form.type}
              onValueChange={(val) => setForm((f) => ({ ...f, type: val }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPACE_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select
                value={form.visibility}
                onValueChange={(val) => setForm((f) => ({ ...f, visibility: val }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPACE_VISIBILITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Join Policy</Label>
              <Select
                value={form.join_policy}
                onValueChange={(val) => setForm((f) => ({ ...f, join_policy: val }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPACE_JOIN_POLICY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Create Space
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
