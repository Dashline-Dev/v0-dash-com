"use client"

import { useState, useTransition, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Loader2, Search, CheckCircle, Trash2 } from "lucide-react"
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
import { updateArea, deleteArea, addAreaZipCodes, getAreaZipCodes, removeAreaZipCode } from "@/lib/actions/area-actions"
import { useApiIsLoaded } from "@vis.gl/react-google-maps"
import { GoogleMapsProvider } from "@/components/maps/google-maps-provider"

interface EditAreaFormProps {
  area: {
    id: string
    name: string
    slug: string
    type: string
    description?: string | null
    parent_id?: string | null
    status: string
    latitude?: number | null
    longitude?: number | null
    place_id?: string | null
    bounds_ne_lat?: number | null
    bounds_ne_lng?: number | null
    bounds_sw_lat?: number | null
    bounds_sw_lng?: number | null
  }
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

function EditAreaFormInner({ area }: EditAreaFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const isLoaded = useApiIsLoaded()

  const [name, setName] = useState(area.name)
  const [slug, setSlug] = useState(area.slug)
  const [type, setType] = useState<"city" | "neighborhood" | "region">(area.type as any)
  const [description, setDescription] = useState(area.description || "")
  const [status, setStatus] = useState(area.status)
  const [zipCodes, setZipCodes] = useState<string[]>([])
  const [newZipCodes, setNewZipCodes] = useState("")

  // Geocoding state
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([])
  const [geoResult, setGeoResult] = useState<GeoResult | null>(
    area.latitude && area.longitude
      ? {
          placeId: area.place_id || "",
          latitude: area.latitude,
          longitude: area.longitude,
          boundsNeLat: area.bounds_ne_lat ?? undefined,
          boundsNeLng: area.bounds_ne_lng ?? undefined,
          boundsSwLat: area.bounds_sw_lat ?? undefined,
          boundsSwLng: area.bounds_sw_lng ?? undefined,
        }
      : null
  )
  const [searchLoading, setSearchLoading] = useState(false)
  const [sessionToken, setSessionToken] = useState<google.maps.places.AutocompleteSessionToken | null>(null)

  // Load existing zip codes
  useEffect(() => {
    async function loadZipCodes() {
      try {
        const codes = await getAreaZipCodes(area.id)
        setZipCodes(codes)
      } catch {
        // ignore
      }
    }
    loadZipCodes()
  }, [area.id])

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

      setSessionToken(new google.maps.places.AutocompleteSessionToken())
    } catch (err) {
      console.error("Place fetch error:", err)
      setError("Failed to fetch place details. Please try again.")
    }
  }

  async function handleRemoveZipCode(zipCode: string) {
    try {
      await removeAreaZipCode(area.id, zipCode)
      setZipCodes((prev) => prev.filter((z) => z !== zipCode))
    } catch {
      setError("Failed to remove zip code")
    }
  }

  async function handleAddZipCodes() {
    const codes = newZipCodes
      .split(/[,\s]+/)
      .map((z) => z.trim())
      .filter(Boolean)
    if (codes.length === 0) return

    try {
      await addAreaZipCodes(area.id, codes)
      setZipCodes((prev) => [...new Set([...prev, ...codes])])
      setNewZipCodes("")
    } catch {
      setError("Failed to add zip codes")
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

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
        await updateArea(area.id, {
          name: name.trim(),
          slug: slug.trim(),
          type,
          description: description.trim() || null,
          status,
          latitude: geoResult?.latitude,
          longitude: geoResult?.longitude,
          place_id: geoResult?.placeId,
          bounds_ne_lat: geoResult?.boundsNeLat ?? null,
          bounds_ne_lng: geoResult?.boundsNeLng ?? null,
          bounds_sw_lat: geoResult?.boundsSwLat ?? null,
          bounds_sw_lng: geoResult?.boundsSwLng ?? null,
        })

        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update area")
      }
    })
  }

  async function handleDelete() {
    startTransition(async () => {
      try {
        await deleteArea(area.id)
        router.push("/areas")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete area")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg">
          Area updated successfully!
        </div>
      )}

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" />
            Location (Optional Update)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="location-search">Search for new location</Label>
            <div className="relative">
              <Input
                id="location-search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  fetchSuggestions(e.target.value)
                }}
                placeholder="Search to update location..."
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
                Location: {geoResult.latitude.toFixed(4)}, {geoResult.longitude.toFixed(4)}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                No coordinates set. Search to add location.
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
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              URL: /areas/{slug || "..."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Area Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="region">Region</SelectItem>
                  <SelectItem value="city">City</SelectItem>
                  <SelectItem value="neighborhood">Neighborhood</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Zip Codes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {zipCodes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {zipCodes.map((zip) => (
                <div
                  key={zip}
                  className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm"
                >
                  {zip}
                  <button
                    type="button"
                    onClick={() => handleRemoveZipCode(zip)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={newZipCodes}
              onChange={(e) => setNewZipCodes(e.target.value)}
              placeholder="Add zip codes (comma-separated)"
              className="flex-1"
            />
            <Button type="button" variant="secondary" onClick={handleAddZipCodes}>
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive" disabled={isPending}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Area
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this area?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete <strong>{area.name}</strong> and unlink
                it from all communities. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="flex gap-3">
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
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  )
}

export function EditAreaForm({ area }: EditAreaFormProps) {
  return (
    <GoogleMapsProvider>
      <EditAreaFormInner area={area} />
    </GoogleMapsProvider>
  )
}
