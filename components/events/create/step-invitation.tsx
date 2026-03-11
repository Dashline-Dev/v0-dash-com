"use client"

import { useState, useRef } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Upload, X, Image as ImageIcon, FileText, Plus, Loader2 } from "lucide-react"

interface StepInvitationProps {
  data: {
    invitation_image_url?: string
    invitation_message?: string
    additional_info?: string
    dress_code?: string
    contact_info?: string
    gallery_images?: string[]
  }
  onChange: (updates: Partial<StepInvitationProps["data"]>) => void
}

export function StepInvitation({ data, onChange }: StepInvitationProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "events/invitations")

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Upload failed")
      }

      const { url } = await res.json()
      onChange({ invitation_image_url: url })
    } catch (err) {
      console.error("Upload error:", err)
      alert(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingGallery(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("folder", "events/gallery")

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!res.ok) throw new Error("Upload failed")
        const { url } = await res.json()
        return url
      })

      const urls = await Promise.all(uploadPromises)
      onChange({ gallery_images: [...(data.gallery_images || []), ...urls] })
    } catch (err) {
      console.error("Gallery upload error:", err)
      alert("Some images failed to upload")
    } finally {
      setUploadingGallery(false)
    }
  }

  function removeGalleryImage(index: number) {
    const newGallery = [...(data.gallery_images || [])]
    newGallery.splice(index, 1)
    onChange({ gallery_images: newGallery })
  }

  return (
    <div className="space-y-6">
      {/* Main invitation image */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Invitation Image</Label>
        <p className="text-sm text-muted-foreground">
          Upload a custom invitation image or flyer. This will be displayed prominently on your event page.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleImageUpload}
          className="hidden"
        />

        {data.invitation_image_url ? (
          <div className="relative">
            <img
              src={data.invitation_image_url}
              alt="Invitation"
              className="w-full max-w-md rounded-xl border border-border object-cover"
            />
            <button
              type="button"
              onClick={() => onChange({ invitation_image_url: undefined })}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur border border-border hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "w-full max-w-md h-48 rounded-xl border-2 border-dashed border-border",
              "flex flex-col items-center justify-center gap-3 text-muted-foreground",
              "hover:border-primary/50 hover:bg-muted/30 transition-colors",
              uploading && "opacity-50 cursor-not-allowed"
            )}
          >
            {uploading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <>
                <Upload className="w-8 h-8" />
                <div className="text-sm text-center">
                  <span className="font-medium text-foreground">Click to upload</span>
                  <br />
                  <span>PNG, JPG, GIF, or PDF up to 10MB</span>
                </div>
              </>
            )}
          </button>
        )}
      </div>

      {/* Invitation message */}
      <div className="space-y-2">
        <Label htmlFor="invitation_message">Invitation Message</Label>
        <Textarea
          id="invitation_message"
          value={data.invitation_message || ""}
          onChange={(e) => onChange({ invitation_message: e.target.value })}
          placeholder="Together with their families, we joyfully invite you to celebrate..."
          rows={3}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          This message appears above the event details
        </p>
      </div>

      {/* Additional details */}
      <div className="space-y-2">
        <Label htmlFor="additional_info">Additional Information</Label>
        <Textarea
          id="additional_info"
          value={data.additional_info || ""}
          onChange={(e) => onChange({ additional_info: e.target.value })}
          placeholder="Dinner and dancing to follow the ceremony..."
          rows={2}
          className="resize-none"
        />
      </div>

      {/* Dress code */}
      <div className="space-y-2">
        <Label htmlFor="dress_code">Dress Code</Label>
        <Input
          id="dress_code"
          value={data.dress_code || ""}
          onChange={(e) => onChange({ dress_code: e.target.value })}
          placeholder="e.g., Formal / Black Tie Optional"
        />
      </div>

      {/* Contact info */}
      <div className="space-y-2">
        <Label htmlFor="contact_info">Contact Information</Label>
        <Input
          id="contact_info"
          value={data.contact_info || ""}
          onChange={(e) => onChange({ contact_info: e.target.value })}
          placeholder="e.g., For questions, contact: email@example.com"
        />
      </div>

      {/* Gallery images */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Photo Gallery (Optional)</Label>
        <p className="text-sm text-muted-foreground">
          Add additional photos to showcase on your event page
        </p>

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleGalleryUpload}
          className="hidden"
        />

        <div className="flex flex-wrap gap-3">
          {(data.gallery_images || []).map((url, idx) => (
            <div key={idx} className="relative group">
              <img
                src={url}
                alt={`Gallery ${idx + 1}`}
                className="w-24 h-24 rounded-lg object-cover border border-border"
              />
              <button
                type="button"
                onClick={() => removeGalleryImage(idx)}
                className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={uploadingGallery}
            className={cn(
              "w-24 h-24 rounded-lg border-2 border-dashed border-border",
              "flex flex-col items-center justify-center gap-1 text-muted-foreground",
              "hover:border-primary/50 hover:bg-muted/30 transition-colors",
              uploadingGallery && "opacity-50"
            )}
          >
            {uploadingGallery ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span className="text-xs">Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
