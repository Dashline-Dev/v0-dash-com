"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Layers, Settings, Type } from "lucide-react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SpaceIcon } from "./space-icon"
import { createSpace } from "@/lib/actions/space-actions"
import {
  SPACE_TYPE_LABELS,
  SPACE_VISIBILITY_LABELS,
  SPACE_ICON_OPTIONS,
  type SpaceType,
  type SpaceVisibility,
} from "@/types/space"

interface CreateSpaceFormProps {
  communityId?: string
  communitySlug?: string
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function CreateSpaceForm({ communityId, communitySlug }: CreateSpaceFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<SpaceType>("discussion")
  const [icon, setIcon] = useState("MessageCircle")
  const [visibility, setVisibility] = useState<SpaceVisibility>("public")

  const handleNameChange = (val: string) => {
    setName(val)
    setSlug(slugify(val))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) return

    setSubmitting(true)
    setError(null)
    try {
      const result = await createSpace({
        community_id: communityId,
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        type,
        icon,
        visibility,
      })

      if (result.community_slug) {
        router.push(`/communities/${result.community_slug}/spaces/${result.slug}`)
      } else {
        router.push(`/spaces/${result.slug}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create space")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Type className="w-4 h-4 text-muted-foreground" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="space-name">Name</Label>
            <Input
              id="space-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. General Discussion"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="space-slug">URL Slug</Label>
            <Input
              id="space-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="general-discussion"
              required
            />
            <p className="text-xs text-muted-foreground">
              {communitySlug
                ? `/communities/${communitySlug}/spaces/${slug || "..."}`
                : `/spaces/${slug || "..."}`}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="space-description">Description</Label>
            <Textarea
              id="space-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this space about?"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Type & Icon */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="w-4 h-4 text-muted-foreground" />
            Type & Icon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as SpaceType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SPACE_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-10 gap-1.5">
              {SPACE_ICON_OPTIONS.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setIcon(iconName)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                    icon === iconName
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                  aria-label={iconName}
                >
                  <SpaceIcon name={iconName} className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="w-4 h-4 text-muted-foreground" />
            Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select value={visibility} onValueChange={(v) => setVisibility(v as SpaceVisibility)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SPACE_VISIBILITY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex items-center gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting || !name.trim()} className="gap-2">
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Layers className="w-4 h-4" />
          )}
          Create Space
        </Button>
      </div>
    </form>
  )
}
