"use client"

import { Label } from "@/components/ui/label"
import { ImageUpload } from "@/components/ui/image-upload"
import { SpaceIcon } from "../space-icon"
import { SPACE_ICON_OPTIONS, type CreateSpaceInput } from "@/types/space"

interface StepAppearanceProps {
  data: CreateSpaceInput
  onChange: (data: Partial<CreateSpaceInput>) => void
}

export function StepAppearance({ data, onChange }: StepAppearanceProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Icon</Label>
        <div className="grid grid-cols-10 gap-1.5">
          {SPACE_ICON_OPTIONS.map((iconName) => (
            <button
              key={iconName}
              type="button"
              onClick={() => onChange({ icon: iconName })}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                data.icon === iconName
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              }`}
              aria-label={iconName}
            >
              <SpaceIcon name={iconName} className="w-4 h-4" />
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Choose an icon that represents this space
        </p>
      </div>

      <ImageUpload
        value={data.cover_image_url || null}
        onChange={(url) => onChange({ cover_image_url: url || undefined })}
        aspectRatio="wide"
        label="Cover image (optional)"
      />
    </div>
  )
}
