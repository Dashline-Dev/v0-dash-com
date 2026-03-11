"use client"

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
import { SPACE_TYPES, type CreateSpaceInput, type SpaceType } from "@/types/space"

interface StepBasicsProps {
  data: CreateSpaceInput
  onChange: (data: Partial<CreateSpaceInput>) => void
  communitySlug?: string
}

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
}

export function StepBasics({ data, onChange, communitySlug }: StepBasicsProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Space name</Label>
        <Input
          id="name"
          placeholder="e.g. General Discussion"
          value={data.name}
          onChange={(e) => {
            const name = e.target.value
            onChange({
              name,
              slug: data.slug === toSlug(data.name) ? toSlug(name) : data.slug,
            })
          }}
          maxLength={80}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="slug">URL slug</Label>
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {communitySlug ? `/communities/${communitySlug}/spaces/` : "/spaces/"}
          </span>
          <Input
            id="slug"
            placeholder="general-discussion"
            value={data.slug}
            onChange={(e) => onChange({ slug: toSlug(e.target.value) })}
            maxLength={60}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Tell people what this space is for..."
          value={data.description || ""}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={4}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground text-right">
          {(data.description || "").length}/500
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Type</Label>
        <Select
          value={data.type}
          onValueChange={(val) => onChange({ type: val as SpaceType })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a type" />
          </SelectTrigger>
          <SelectContent>
            {SPACE_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                <div className="flex flex-col items-start">
                  <span>{t.label}</span>
                  <span className="text-xs text-muted-foreground">{t.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
