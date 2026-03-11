"use client"

import { useState, useTransition, useCallback } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Loader2, Search, CheckCircle } from "lucide-react"
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
import { useApiIsLoaded } from "@vis.gl/react-google-maps"
import { GoogleMapsProvider } from "@/components/maps/google-maps-provider"

interface CreateAreaFormProps {
  existingAreas: { id: string; name: string; type: string; parentName: string | null }[]
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

interface GeoResult {
  placeId: string
  latitude: number
  longitude: number
  boundsNeLat?: number
  boundsNeLng?: number
  boundsSwLat?: number
  boundsSwLng?: number
}

function CreateAreaFormInner({ existingAreas }: CreateAreaFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const isLoaded = useApiIsLoaded()

  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [type, setType] = useState<"city" | "neighborhood" | "region">("city")
  const [description, setDescription] = useState("")
  const [parentId, setParentId] = useState<string | null>(null)
  const [zipCodes, setZipCodes] = useState("")

  // Geocoding state
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([])
  const [geoResult, setGeoResult] = useState<GeoResult | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [sessionToken, setSessionToken] = useState<google.maps.places.AutocompleteSessionToken | null>(null)

  function handleNameChange(value: string) {
    setName(value)
    setSlug(slugify(value))
    // Auto-populate search if not already set
    if (!searchQuery) setSearchQuery(value)
  }

  const fetchSuggestions = useCallback(async (input: string) => {
    if (!isLoaded || input.length < 2) {
      setSuggestions([])
      return
    }
    setSearchLoading(true)
    try {
      let token = sessionToken
      if (!token) {
        token = new google.maps.places.AutocompleteSessionToken()
        setSessionToken(token)
      }
      const { suggestions: results } =
        await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          sessionToken: token,
          includedPrimaryTypes: ["locality", "sublocality", "neighborhood", "administrative_area_level_1"],
        })
      setSuggestions(results)
    } catch (err) {
      console.error("Autocomplete error:", err)
      setSuggestions([])
    } finally {
      setSearchLoading(false)
    }
  }, [isLoaded, sessionToken])

  async function handleSelectSuggestion(suggestion: google.maps.places.AutocompleteSuggestion) {
    const placePrediction = suggestion.placePrediction
    if (!placePrediction) return

    setSuggestions([])
    setSearchQuery(placePrediction.text.toString())

    try {
      const place = placePrediction.toPlace()
      await place.fetchFields({ fields: ["location", "viewport", "id", "displayName"] })

      const loc = place.location
      const vp = place.viewport

      if (!loc) {
        setError("Could not get coordinates for this location. Please try another.")
        return
      }

      setGeoResult({
        placeId: place.id ?? placePrediction.placeId,
        latitude: loc.lat(),
        longitude: loc.lng(),
        boundsNeLat: vp?.getNorthEast().lat(),
        boundsNeLng: vp?.getNorthEast().lng(),
        boundsSwLat: vp?.getSouthWest().lat(),
        boundsSwLng: vp?.getSouthWest().lng(),
      })

      // Auto-fill name if empty
      if (!name && place.displayName) {
        const displayName = place.displayName
        setName(displayName)
        setSlug(slugify(displayName))
      }

      // Reset session token after selection
      setSessionToken(new google.maps.places.AutocompleteSessionToken())
    } catch (err) {
      console.error("Place fetch error:", err)
      setError("Failed to fetch place details. Please try again.")
    }
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
    if (!geoResult) {
      setError("Please search and select a location to get coordinates")
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
          placeId: geoResult.placeId,
          latitude: geoResult.latitude,
          longitude: geoResult.longitude,
          boundsNeLat: geoResult.boundsNeLat ?? null,
          boundsNeLng: geoResult.boundsNeLng ?? null,
          boundsSwLat: geoResult.boundsSwLat ?? null,
          boundsSwLng: geoResult.boundsSwLng ?? null,
        })

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

  const parentOptions = existingAreas.filter((a) => {
    if (type === "neighborhood") return a.type === "city" || a.type === "region"
    if (type === "city") return a.type === "region"
    return false
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
            <Search className="w-4 h-4 text-primary" />
            Location Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="location-search">
              Search for location <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="location-search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setGeoResult(null)
                  fetchSuggestions(e.target.value)
                }}
                placeholder="Search for a city, neighborhood, or region..."
                className={geoResult ? "border-green-500" : ""}
                autoComplete="off"
              />
              {searchLoading && (
                <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-muted-foreground" />
              )}
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                  {suggestions.map((s, i) => {
                    const pred = s.placePrediction
                    if (!pred) return null
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectSuggestion(s)}
                        className="w-full flex items-start gap-2 px-3 py-2.5 hover:bg-muted text-left text-sm transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <span>{pred.text.toString()}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            {geoResult ? (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Location set: {geoResult.latitude.toFixed(4)}, {geoResult.longitude.toFixed(4)}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Search and select a location to automatically set coordinates
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Area Information
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

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !geoResult}>
          {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Create Area
        </Button>
      </div>
    </form>
  )
}

export function CreateAreaForm({ existingAreas }: CreateAreaFormProps) {
  return (
    <GoogleMapsProvider>
      <CreateAreaFormInner existingAreas={existingAreas} />
    </GoogleMapsProvider>
  )
}
