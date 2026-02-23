"use client"

import { ImageUpload } from "@/components/ui/image-upload"
import type { CreateCommunityInput } from "@/types/community"

interface StepAppearanceProps {
  data: CreateCommunityInput
  onChange: (data: Partial<CreateCommunityInput>) => void
}

export function StepAppearance({ data, onChange }: StepAppearanceProps) {
  return (
    <div className="space-y-6">
      <ImageUpload
        value={data.cover_image_url || null}
        onChange={(url) => onChange({ cover_image_url: url })}
        aspectRatio="wide"
        label="Cover image"
      />

      <ImageUpload
        value={data.avatar_url || null}
        onChange={(url) => onChange({ avatar_url: url })}
        aspectRatio="square"
        label="Avatar / Logo"
      />
    </div>
  )
}
