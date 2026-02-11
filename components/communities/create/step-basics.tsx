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
import { COMMUNITY_CATEGORIES } from "@/types/community"
import type { CreateCommunityInput } from "@/types/community"

interface StepBasicsProps {
  data: CreateCommunityInput
  onChange: (data: Partial<CreateCommunityInput>) => void
}

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
}

export function StepBasics({ data, onChange }: StepBasicsProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Community name</Label>
        <Input
          id="name"
          placeholder="e.g. Downtown Art Collective"
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
            /communities/
          </span>
          <Input
            id="slug"
            placeholder="downtown-art-collective"
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
          placeholder="Tell people what this community is about..."
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={4}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground text-right">
          {data.description.length}/500
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Category</Label>
        <Select
          value={data.category}
          onValueChange={(val) =>
            onChange({ category: val as CreateCommunityInput["category"] })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {COMMUNITY_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select
            value={data.type}
            onValueChange={(val) =>
              onChange({ type: val as CreateCommunityInput["type"] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="restricted">Restricted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Visibility</Label>
          <Select
            value={data.visibility}
            onValueChange={(val) =>
              onChange({ visibility: val as CreateCommunityInput["visibility"] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="visible-with-approval">Visible + Approval</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Join policy</Label>
          <Select
            value={data.join_policy}
            onValueChange={(val) =>
              onChange({ join_policy: val as CreateCommunityInput["join_policy"] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="approval">Needs Approval</SelectItem>
              <SelectItem value="invite_only">Invite Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
