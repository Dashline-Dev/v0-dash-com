"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { 
  EVENT_TEMPLATES, 
  TEMPLATE_CATEGORIES,
  getAllCategories,
  getCategoryLabel,
  getSubcategories,
  getTemplatesByCategory,
} from "@/lib/event-templates"
import { InvitationCard } from "@/components/events/invitation-card"
import { Check, ChevronRight, Sparkles, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface StepTemplateProps {
  data: {
    template_id?: string
    title?: string
    start_time?: string
    end_time?: string
    location_name?: string
    location_address?: string
    dress_code?: string
    invitation_message?: string
  }
  onChange: (updates: Partial<StepTemplateProps["data"]>) => void
}

export function StepTemplate({ data, onChange }: StepTemplateProps) {
  const categories = getAllCategories()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null)

  const subcategories = selectedCategory ? getSubcategories(selectedCategory) : []
  
  const filteredTemplates = selectedCategory
    ? selectedSubcategory
      ? EVENT_TEMPLATES.filter((t) => t.category === selectedCategory && t.subcategory === selectedSubcategory)
      : getTemplatesByCategory(selectedCategory)
    : EVENT_TEMPLATES

  const selectedTemplate = EVENT_TEMPLATES.find((t) => t.id === data.template_id)
  const previewTemplateData = previewTemplate 
    ? EVENT_TEMPLATES.find((t) => t.id === previewTemplate) 
    : null

  // Sample event data for preview
  const sampleEvent = {
    title: data.title || "Your Event Title",
    start_time: data.start_time || new Date().toISOString(),
    end_time: data.end_time || new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    location_name: data.location_name || "Venue Name",
    location_address: data.location_address || "123 Main Street",
    dress_code: data.dress_code,
    invitation_message: data.invitation_message,
  }

  function selectTemplate(templateId: string) {
    const template = EVENT_TEMPLATES.find((t) => t.id === templateId)
    if (template) {
      onChange({
        template_id: templateId,
        // Apply template's host line as invitation message if not set
        invitation_message: data.invitation_message || template.fields.hostLineTemplate,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">Choose an Invitation Design</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Select a template that matches your event style. Your details will be beautifully displayed in the design.
        </p>
      </div>

      {/* Category filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory(null)
              setSelectedSubcategory(null)
            }}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full border transition-colors",
              !selectedCategory
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:border-primary/50"
            )}
          >
            All Templates
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat)
                setSelectedSubcategory(null)
              }}
              className={cn(
                "px-3 py-1.5 text-sm rounded-full border transition-colors flex items-center gap-1",
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:border-primary/50"
              )}
            >
              {getCategoryLabel(cat)}
              {selectedCategory !== cat && <ChevronRight className="w-3 h-3" />}
            </button>
          ))}
        </div>

        {/* Subcategory filters */}
        {selectedCategory && subcategories.length > 0 && (
          <div className="flex flex-wrap gap-2 pl-4 border-l-2 border-primary/20">
            {subcategories.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => setSelectedSubcategory(selectedSubcategory === sub ? null : sub)}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-full border transition-colors",
                  selectedSubcategory === sub
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-background border-border hover:border-primary/30"
                )}
              >
                {sub}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Template grid with visual previews */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => {
          const isSelected = data.template_id === template.id
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => selectTemplate(template.id)}
              onDoubleClick={() => setPreviewTemplate(template.id)}
              className={cn(
                "relative rounded-xl border-2 text-left transition-all overflow-hidden",
                "hover:border-primary/50 hover:shadow-md",
                isSelected
                  ? "border-primary ring-2 ring-primary/20 shadow-md"
                  : "border-border"
              )}
            >
              {/* Mini preview of the template */}
              <div className="aspect-[3/4] overflow-hidden">
                <div className="transform scale-[0.25] origin-top-left w-[400%] h-[400%]">
                  <InvitationCard
                    event={sampleEvent}
                    template={template}
                    className="w-full h-full"
                  />
                </div>
              </div>

              {/* Template info overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                <h4 className="font-medium text-sm text-white">{template.name}</h4>
                <p className="text-xs text-white/70 mt-0.5">{template.subcategory}</p>
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}

              {/* Preview hint */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/50 text-white text-[10px] opacity-0 hover:opacity-100 transition-opacity">
                Double-click to preview
              </div>
            </button>
          )
        })}
      </div>

      {/* No template option */}
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
          No template - I&apos;ll upload my own invitation image
        </button>
      </div>

      {/* Selected template preview */}
      {selectedTemplate && (
        <div className="mt-6 p-4 rounded-xl border border-primary/20 bg-primary/5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-medium">Selected: {selectedTemplate.name}</h4>
              <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewTemplate(selectedTemplate.id)}
            >
              Preview Full Size
            </Button>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Features: {selectedTemplate.fields.showHebrewDate && "Hebrew date, "}{selectedTemplate.fields.showDressCode && "Dress code, "}Event details</p>
            <p>Style: {selectedTemplate.style.fontFamily} fonts, {selectedTemplate.style.frameStyle} frame</p>
          </div>
        </div>
      )}

      {/* Full preview dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{previewTemplateData?.name} Preview</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewTemplate(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {previewTemplateData && (
            <div className="flex flex-col items-center">
              <div className="w-full max-w-md">
                <InvitationCard
                  event={sampleEvent}
                  template={previewTemplateData}
                  className="w-full shadow-xl"
                />
              </div>
              <div className="mt-4 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setPreviewTemplate(null)}
                >
                  Keep Browsing
                </Button>
                <Button
                  onClick={() => {
                    selectTemplate(previewTemplateData.id)
                    setPreviewTemplate(null)
                  }}
                >
                  Use This Template
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
