"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { EVENT_TEMPLATES, getTemplateCategories } from "@/lib/event-templates"
import { Check, Sparkles } from "lucide-react"

interface StepTemplateProps {
  data: {
    template_id?: string
    invitation_message?: string
    dress_code?: string
    additional_info?: string
  }
  onChange: (updates: Partial<StepTemplateProps["data"]>) => void
}

export function StepTemplate({ data, onChange }: StepTemplateProps) {
  const categories = getTemplateCategories()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredTemplates = selectedCategory
    ? EVENT_TEMPLATES.filter((t) => t.category === selectedCategory)
    : EVENT_TEMPLATES

  const selectedTemplate = EVENT_TEMPLATES.find((t) => t.id === data.template_id)

  function selectTemplate(templateId: string) {
    const template = EVENT_TEMPLATES.find((t) => t.id === templateId)
    if (template) {
      onChange({
        template_id: templateId,
        invitation_message: template.defaults.invitation_message || data.invitation_message,
        dress_code: template.defaults.dress_code || data.dress_code,
        additional_info: template.defaults.additional_info || data.additional_info,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">Choose a Template</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Select a template to get started with a beautiful invitation design
        </p>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedCategory(null)}
          className={cn(
            "px-3 py-1.5 text-sm rounded-full border transition-colors",
            !selectedCategory
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border hover:border-primary/50"
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full border transition-colors",
              selectedCategory === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:border-primary/50"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {filteredTemplates.map((template) => {
          const isSelected = data.template_id === template.id
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => selectTemplate(template.id)}
              className={cn(
                "relative p-4 rounded-xl border-2 text-left transition-all",
                "hover:border-primary/50 hover:shadow-sm",
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card"
              )}
            >
              {/* Color preview */}
              <div
                className="w-full h-16 rounded-lg mb-3 flex items-center justify-center"
                style={{ backgroundColor: template.style.accentColor + "15" }}
              >
                <div
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: template.style.accentColor }}
                />
              </div>

              <h4 className="font-medium text-sm">{template.name}</h4>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {template.description}
              </p>

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Skip option */}
      <div className="pt-4 border-t border-border">
        <button
          type="button"
          onClick={() => onChange({ template_id: undefined })}
          className={cn(
            "flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors",
            !data.template_id && "text-foreground font-medium"
          )}
        >
          <Sparkles className="w-4 h-4" />
          Skip template - I&apos;ll design my own
        </button>
      </div>

      {/* Preview of selected template */}
      {selectedTemplate && (
        <div className="mt-6 p-4 rounded-xl border border-border bg-muted/30">
          <h4 className="font-medium text-sm mb-2">Template Includes:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            {selectedTemplate.defaults.invitation_message && (
              <li>• Opening message</li>
            )}
            {selectedTemplate.defaults.dress_code && (
              <li>• Dress code suggestion: {selectedTemplate.defaults.dress_code}</li>
            )}
            {selectedTemplate.defaults.additional_info && (
              <li>• Additional details</li>
            )}
            <li>• {selectedTemplate.style.headerStyle} styling with {selectedTemplate.style.fontFamily} fonts</li>
          </ul>
        </div>
      )}
    </div>
  )
}
