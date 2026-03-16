"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, ArrowLeft, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { AreaSelector, type AreaOption } from "@/components/areas/area-selector"
import { linkSpaceToArea } from "@/lib/actions/area-actions"

interface SpaceCreateFormProps {
  communityId: string
  communitySlug: string
  communityName: string
  availableAreas?: AreaOption[]
}

export function SpaceCreateForm({
  communityId,
  communitySlug,
  communityName,
  availableAreas = [],
}: SpaceCreateFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    type: "general" as string,
    visibility: "public" as string,
    join_policy: "open" as string,
    areaIds: [] as string[],
  })

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
    setForm((f) => ({ ...f, name, slug }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.name.trim()) {
      setError("Name is required")
      return
    }
    if (!form.slug.trim()) {
      setError("Slug is required")
      return
    }

    setLoading(true)
    setError("")

    try {
      const result = await createSpace({
        community_id: communityId,
        name: form.name,
        slug: form.slug,
        description: form.description || undefined,
        type: form.type as "general" | "discussion" | "events" | "announcements" | "resources" | "projects",
        visibility: form.visibility as "public" | "unlisted" | "private",
        join_policy: form.join_policy as "open" | "approval" | "invite_only",
      })

      // Link space to selected areas
      if (result.id && form.areaIds.length > 0) {
        await Promise.all(
          form.areaIds.map((areaId) => linkSpaceToArea(result.id!, areaId))
        )
      }

      if (result.slug) {
        router.push(`/communities/${communitySlug}/spaces/${result.slug}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create space")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" className="mb-4 gap-1.5" asChild>
          <Link href={`/communities/${communitySlug}`}>
            <ArrowLeft className="w-4 h-4" />
            Back to {communityName}
          </Link>
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Create Space</h1>
            <p className="text-sm text-muted-foreground">
              Add a new space to {communityName}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 md:p-6 space-y-5">
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
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              /communities/{communitySlug}/spaces/
            </span>
            <Input
              id="space-slug"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="general-discussion"
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="space-description">Description (optional)</Label>
          <Textarea
            id="space-description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="What is this space about?"
            rows={3}
          />
        </div>

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

        <div className="grid grid-cols-2 gap-4">
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

        {availableAreas.length > 0 && (
          <AreaSelector
            availableAreas={availableAreas}
            selectedAreaIds={form.areaIds}
            onChange={(areaIds) => setForm((f) => ({ ...f, areaIds }))}
            label="Areas (optional)"
            description="Link this space to geographic areas so local users can discover it."
          />
        )}

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" asChild>
            <Link href={`/communities/${communitySlug}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Create Space
          </Button>
        </div>
      </form>
    </div>
  )
}
