"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Loader2 } from "lucide-react"
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
import { createArea, addAreaZipCodes } from "@/lib/actions/area-actions"

interface CreateAreaFormProps {
  existingAreas: { id: string; name: string; type: string; parentName: string | null }[]
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function CreateAreaForm({ existingAreas }: CreateAreaFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [type, setType] = useState<"city" | "neighborhood" | "region">("city")
  const [description, setDescription] = useState("")
  const [parentId, setParentId] = useState<string | null>(null)
  const [zipCodes, setZipCodes] = useState("")

  // Optional bounds
  const [boundsNeLat, setBoundsNeLat] = useState("")
  const [boundsNeLng, setBoundsNeLng] = useState("")
  const [boundsSwLat, setBoundsSwLat] = useState("")
  const [boundsSwLng, setBoundsSwLng] = useState("")

  function handleNameChange(value: string) {
    setName(value)
    setSlug(slugify(value))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError("Name is required")
      return
    }
    if (!slug.trim()) {
      setError("Slug is required")
      return
    }

    startTransition(async () => {
      try {
        const result = await createArea({
          name: name.trim(),
          slug: slug.trim(),
          type,
          description: description.trim() || undefined,
          parentId: parentId || undefined,
          boundsNeLat: boundsNeLat ? parseFloat(boundsNeLat) : undefined,
          boundsNeLng: boundsNeLng ? parseFloat(boundsNeLng) : undefined,
          boundsSwLat: boundsSwLat ? parseFloat(boundsSwLat) : undefined,
          boundsSwLng: boundsSwLng ? parseFloat(boundsSwLng) : undefined,
        })

        // Add zip codes if provided
        if (zipCodes.trim()) {
          const codes = zipCodes
            .split(/[,\s]+/)
            .map((z) => z.trim())
            .filter(Boolean)
          if (codes.length > 0) {
            await addAreaZipCodes(result.id, codes)
          }
        }

        router.push(`/areas/${result.slug}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create area")
      }
    })
  }

  // Filter parent options based on type (neighborhoods must have city parent)
  const parentOptions = existingAreas.filter((a) => {
    if (type === "neighborhood") return a.type === "city" || a.type === "region"
    if (type === "city") return a.type === "region"
    return false // regions have no parent
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Area Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Brooklyn, Williamsburg, New York Metro"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g., brooklyn"
              required
            />
            <p className="text-xs text-muted-foreground">
              This will be used in the URL: /areas/{slug || "..."}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Area Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="region">Region (multi-city area)</SelectItem>
                <SelectItem value="city">City</SelectItem>
                <SelectItem value="neighborhood">Neighborhood</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {parentOptions.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="parent">Parent Area (optional)</Label>
              <Select
                value={parentId || "none"}
                onValueChange={(v) => setParentId(v === "none" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent</SelectItem>
                  {parentOptions.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name} ({area.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this area..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zipCodes">Zip Codes (optional)</Label>
            <Input
              id="zipCodes"
              value={zipCodes}
              onChange={(e) => setZipCodes(e.target.value)}
              placeholder="e.g., 11211, 11222, 11249"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated list of zip codes in this area
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Geographic Bounds (optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="boundsNeLat">NE Latitude</Label>
              <Input
                id="boundsNeLat"
                type="number"
                step="any"
                value={boundsNeLat}
                onChange={(e) => setBoundsNeLat(e.target.value)}
                placeholder="40.7128"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="boundsNeLng">NE Longitude</Label>
              <Input
                id="boundsNeLng"
                type="number"
                step="any"
                value={boundsNeLng}
                onChange={(e) => setBoundsNeLng(e.target.value)}
                placeholder="-73.9060"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="boundsSwLat">SW Latitude</Label>
              <Input
                id="boundsSwLat"
                type="number"
                step="any"
                value={boundsSwLat}
                onChange={(e) => setBoundsSwLat(e.target.value)}
                placeholder="40.6892"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="boundsSwLng">SW Longitude</Label>
              <Input
                id="boundsSwLng"
                type="number"
                step="any"
                value={boundsSwLng}
                onChange={(e) => setBoundsSwLng(e.target.value)}
                placeholder="-74.0445"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Define the bounding box for map display. Leave empty to auto-detect.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Create Area
        </Button>
      </div>
    </form>
  )
}
