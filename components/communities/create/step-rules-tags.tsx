"use client"

import { Plus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { TagInput } from "@/components/ui/tag-input"
import type { CreateCommunityInput } from "@/types/community"

interface StepRulesTagsProps {
  data: CreateCommunityInput
  onChange: (data: Partial<CreateCommunityInput>) => void
}

export function StepRulesTags({ data, onChange }: StepRulesTagsProps) {
  const rules = data.rules || []

  const addRule = () => {
    onChange({ rules: [...rules, { title: "", description: "" }] })
  }

  const updateRule = (
    index: number,
    field: "title" | "description",
    value: string
  ) => {
    const updated = [...rules]
    updated[index] = { ...updated[index], [field]: value }
    onChange({ rules: updated })
  }

  const removeRule = (index: number) => {
    onChange({ rules: rules.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-6">
      {/* Tags */}
      <div className="space-y-1.5">
        <Label>Tags</Label>
        <p className="text-xs text-muted-foreground mb-1.5">
          Help people discover your community. Press Enter or comma to add.
        </p>
        <TagInput
          value={data.tags || []}
          onChange={(tags) => onChange({ tags })}
          placeholder="e.g. react, web-dev, meetups"
          maxTags={10}
        />
      </div>

      {/* Rules */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label>Community rules</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Set expectations for members
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRule}
            disabled={rules.length >= 10}
            className="gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add rule
          </Button>
        </div>

        {rules.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg">
            No rules yet. Click &quot;Add rule&quot; to get started.
          </p>
        )}

        <div className="space-y-3">
          {rules.map((rule, index) => (
            <div
              key={index}
              className="relative p-4 rounded-lg border border-border bg-secondary/30"
            >
              <button
                type="button"
                onClick={() => removeRule(index)}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
                aria-label="Remove rule"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="space-y-2 pr-6">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                    {index + 1}
                  </span>
                  <Input
                    placeholder="Rule title"
                    value={rule.title}
                    onChange={(e) => updateRule(index, "title", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <Textarea
                  placeholder="Description (optional)"
                  value={rule.description}
                  onChange={(e) =>
                    updateRule(index, "description", e.target.value)
                  }
                  rows={2}
                  className="text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
