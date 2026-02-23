"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ImageUpload } from "@/components/ui/image-upload"
import { TagInput } from "@/components/ui/tag-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import {
  updateCommunity,
  deleteCommunity,
  updateCommunityTags,
} from "@/lib/actions/community-actions"
import { COMMUNITY_CATEGORIES, type CommunityWithMeta } from "@/types/community"

export function SettingsForm({ community }: { community: CommunityWithMeta }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [name, setName] = useState(community.name)
  const [description, setDescription] = useState(community.description || "")
  const [category, setCategory] = useState(community.category)
  const [type, setType] = useState(community.type)
  const [visibility, setVisibility] = useState(community.visibility)
  const [joinPolicy, setJoinPolicy] = useState(community.join_policy)
  const [postingPolicy, setPostingPolicy] = useState(community.posting_policy)
  const [coverImage, setCoverImage] = useState(community.cover_image_url)
  const [avatarUrl, setAvatarUrl] = useState(community.avatar_url)
  const [locationName, setLocationName] = useState(community.location_name || "")
  const [contactEmail, setContactEmail] = useState(community.contact_email || "")
  const [tags, setTags] = useState(community.tags)

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const [updateResult, tagsResult] = await Promise.all([
        updateCommunity(community.id, {
          name,
          description,
          category,
          type,
          visibility,
          join_policy: joinPolicy,
          posting_policy: postingPolicy,
          cover_image_url: coverImage,
          avatar_url: avatarUrl,
          location_name: locationName || null,
          contact_email: contactEmail || null,
        }),
        updateCommunityTags(community.id, tags),
      ])

      if (updateResult.success && tagsResult.success) {
        setMessage({ type: "success", text: "Settings saved." })
        router.refresh()
      } else {
        setMessage({ type: "error", text: updateResult.error || tagsResult.error || "Failed to save." })
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong." })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    const result = await deleteCommunity(community.id)
    if (result.success) {
      router.push("/")
    } else {
      setMessage({ type: "error", text: result.error || "Failed to delete." })
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`text-sm p-3 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label htmlFor="admin-name">Name</Label>
          <Input id="admin-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {COMMUNITY_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="admin-desc">Description</Label>
        <Textarea
          id="admin-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={500}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="restricted">Restricted</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Visibility</Label>
          <Select value={visibility} onValueChange={(v) => setVisibility(v as typeof visibility)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="visible-with-approval">Visible + Approval</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Join policy</Label>
          <Select value={joinPolicy} onValueChange={(v) => setJoinPolicy(v as typeof joinPolicy)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="approval">Needs Approval</SelectItem>
              <SelectItem value="invite_only">Invite Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Posting policy</Label>
        <Select value={postingPolicy} onValueChange={(v) => setPostingPolicy(v as typeof postingPolicy)}>
          <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="everyone">Everyone</SelectItem>
            <SelectItem value="admins_only">Admins Only</SelectItem>
            <SelectItem value="selected_users">Selected Users</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label>Location</Label>
          <Input value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="City, State" />
        </div>
        <div className="space-y-1.5">
          <Label>Contact email</Label>
          <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="community@example.com" />
        </div>
      </div>

      <ImageUpload value={coverImage} onChange={setCoverImage} label="Cover image" aspectRatio="wide" />
      <ImageUpload value={avatarUrl} onChange={setAvatarUrl} label="Avatar" aspectRatio="square" />

      <div className="space-y-1.5">
        <Label>Tags</Label>
        <TagInput value={tags} onChange={setTags} maxTags={10} />
      </div>

      {/* Save + Delete */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="gap-1.5" disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete Community
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this community?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. All members, posts, and data will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button onClick={handleSave} disabled={saving} className="gap-1.5 min-w-[120px]">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>
    </div>
  )
}
