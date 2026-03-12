"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Loader2, Settings, Globe, Trash2, Image as ImageIcon } from "lucide-react"
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
import { ImageUpload } from "@/components/ui/image-upload"
import { PlacesAutocomplete } from "@/components/ui/places-autocomplete"
import { GoogleMapsProvider } from "@/components/maps/google-maps-provider"
import { updateCommunity, deleteCommunity } from "@/lib/actions/community-actions"

interface EditCommunityFormProps {
  community: {
    id: string
    name: string
    slug: string
    description?: string | null
    category?: string | null
    visibility: string
    join_policy?: string | null
    posting_policy?: string | null
    cover_image_url?: string | null
    avatar_url?: string | null
    location_name?: string | null
    latitude?: number | null
    longitude?: number | null
    contact_email?: string | null
    timezone?: string | null
  }
}

const CATEGORIES = [
  "Technology",
  "Business",
  "Arts & Culture",
  "Sports & Fitness",
  "Education",
  "Social",
  "Gaming",
  "Music",
  "Food & Drink",
  "Health & Wellness",
  "Other",
]

function EditCommunityFormInner({ community }: EditCommunityFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [name, setName] = useState(community.name)
  const [slug, setSlug] = useState(community.slug)
  const [description, setDescription] = useState(community.description || "")
  const [category, setCategory] = useState(community.category || "Other")
  const [visibility, setVisibility] = useState(community.visibility)
  const [joinPolicy, setJoinPolicy] = useState(community.join_policy || "open")
  const [postingPolicy, setPostingPolicy] = useState(community.posting_policy || "members")
  const [coverImageUrl, setCoverImageUrl] = useState(community.cover_image_url || "")
  const [avatarUrl, setAvatarUrl] = useState(community.avatar_url || "")
  const [locationName, setLocationName] = useState(community.location_name || "")
  const [latitude, setLatitude] = useState<number | null>(community.latitude || null)
  const [longitude, setLongitude] = useState<number | null>(community.longitude || null)
  const [contactEmail, setContactEmail] = useState(community.contact_email || "")
  const [timezone, setTimezone] = useState(community.timezone || "America/New_York")

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
        const result = await updateCommunity(community.id, {
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          category,
          visibility,
          join_policy: joinPolicy,
          posting_policy: postingPolicy,
          cover_image_url: coverImageUrl || null,
          avatar_url: avatarUrl || null,
          location_name: locationName || null,
          latitude,
          longitude,
          contact_email: contactEmail || null,
          timezone,
        })

        if (!result.success) {
          setError(result.error || "Failed to update community")
          return
        }

        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        
        // If slug changed, redirect to new URL
        if (slug !== community.slug) {
          router.push(`/communities/${slug}/edit`)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update community")
      }
    })
  }

  async function handleDelete() {
    startTransition(async () => {
      try {
        await deleteCommunity(community.id)
        router.push("/communities")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete community")
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
          Community updated successfully!
        </div>
      )}

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary" />
            Branding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <ImageUpload
              value={coverImageUrl}
              onChange={setCoverImageUrl}
              folder="communities"
              aspectRatio="wide"
            />
          </div>
          <div className="space-y-2">
            <Label>Avatar</Label>
            <ImageUpload
              value={avatarUrl}
              onChange={setAvatarUrl}
              folder="communities"
              aspectRatio="square"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Community Name</Label>
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
              URL: /communities/{slug || "..."}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Location</Label>
            <PlacesAutocomplete
              value={locationName}
              onChange={setLocationName}
              onPlaceSelect={(place) => {
                if (place.lat && place.lng) {
                  setLatitude(place.lat)
                  setLongitude(place.lng)
                }
              }}
              placeholder="Search for a location..."
            />
            {latitude && longitude && (
              <p className="text-xs text-muted-foreground">
                Coordinates: {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input
              id="contactEmail"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="contact@community.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                <SelectItem value="America/Chicago">Central Time</SelectItem>
                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                <SelectItem value="America/Anchorage">Alaska Time</SelectItem>
                <SelectItem value="Pacific/Honolulu">Hawaii Time</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="unlisted">Unlisted</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Join Policy</Label>
              <Select value={joinPolicy} onValueChange={setJoinPolicy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="approval">Approval Required</SelectItem>
                  <SelectItem value="invite_only">Invite Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Posting Policy</Label>
              <Select value={postingPolicy} onValueChange={setPostingPolicy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anyone">Anyone</SelectItem>
                  <SelectItem value="members">Members Only</SelectItem>
                  <SelectItem value="admins">Admins Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive" disabled={isPending}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Community
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this community?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete <strong>{community.name}</strong> and all
                its members, spaces, events, and data. This action cannot be undone.
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

export function EditCommunityForm({ community }: EditCommunityFormProps) {
  return (
    <GoogleMapsProvider>
      <EditCommunityFormInner community={community} />
    </GoogleMapsProvider>
  )
}
