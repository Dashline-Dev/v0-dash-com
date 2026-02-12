"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {error && (
        <div className="rounded-lg bg-destructive/10 text-destructive text-sm p-3">
          {error}
        </div>
      )}

      {/* Name */}
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

      {/* Slug */}
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

      {/* Description */}
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

      {/* Type */}
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

      {/* Icon */}
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

      {/* Visibility */}
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

      <Button type="submit" disabled={submitting || !name.trim()} className="w-full">
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Creating...
          </>
        ) : (
          "Create Space"
        )}
      </Button>
    </form>
  )
}
