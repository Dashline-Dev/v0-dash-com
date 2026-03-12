"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Layers, Settings, Type, Trash2 } from "lucide-react"
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
import { SpaceIcon } from "./space-icon"
import { updateSpace, deleteSpace } from "@/lib/actions/space-actions"
import {
  SPACE_TYPE_LABELS,
  SPACE_VISIBILITY_LABELS,
  SPACE_ICON_OPTIONS,
  type SpaceType,
  type SpaceVisibility,
} from "@/types/space"

interface EditSpaceFormProps {
  space: {
    id: string
    name: string
    slug: string
    description?: string | null
    type: string
    icon?: string | null
    visibility: string
    community_id?: string | null
  }
  communitySlug?: string
}

export function EditSpaceForm({ space, communitySlug }: EditSpaceFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [name, setName] = useState(space.name)
  const [slug, setSlug] = useState(space.slug)
  const [description, setDescription] = useState(space.description || "")
  const [type, setType] = useState<SpaceType>(space.type as SpaceType)
  const [icon, setIcon] = useState(space.icon || "MessageCircle")
  const [visibility, setVisibility] = useState<SpaceVisibility>(space.visibility as SpaceVisibility)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) return

    setSubmitting(true)
    setError(null)
    setSuccess(false)
    
    try {
      await updateSpace(space.id, {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        type,
        icon,
        visibility,
      })

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      
      // If slug changed, redirect to new URL
      if (slug !== space.slug && communitySlug) {
        router.push(`/communities/${communitySlug}/spaces/${slug}/edit`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update space")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setSubmitting(true)
    try {
      await deleteSpace(space.id)
      if (communitySlug) {
        router.push(`/communities/${communitySlug}`)
      } else {
        router.push("/spaces")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete space")
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
      {success && (
        <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg">
          Space updated successfully!
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
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="space-slug">URL Slug</Label>
            <Input
              id="space-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
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

      {/* Actions */}
      <div className="flex items-center justify-between">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive" disabled={submitting}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Space
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this space?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete <strong>{space.name}</strong> and all
                its content. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || !name.trim()}>
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  )
}
