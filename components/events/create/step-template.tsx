"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { 
  EVENT_TEMPLATES, 
  getAllCategories,
  getCategoryLabel,
  getSubcategories,
  getTemplatesByCategory,
} from "@/lib/event-templates"
import { InvitationCard, CARD_SIZES, type CardSize } from "@/components/events/invitation-card"
import { Check, ChevronRight, Sparkles, X, Smartphone, Square, RectangleHorizontal, FileText } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface StepTemplateProps {
  data: {
    template_id?: string
    card_size?: CardSize
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

const SIZE_ICONS: Record<string, React.ElementType> = {
  whatsapp: Smartphone,
  instagram_story: Smartphone,
  instagram_square: Square,
  instagram_portrait: Smartphone,
  facebook: RectangleHorizontal,
  twitter: RectangleHorizontal,
  a4_portrait: FileText,
  letter: FileText,
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

  const cardSize = data.card_size || "whatsapp"

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

      {/* Size selector */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-muted/50 border border-border">
        <div className="flex-1">
          <Label className="text-sm font-medium">Card Size</Label>
          <p className="text-xs text-muted-foreground mt-0.5 mb-2">
            Choose a size optimized for sharing
          </p>
          <Select
            value={cardSize}
            onValueChange={(value) => onChange({ card_size: value as CardSize })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="whatsapp">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  <span>WhatsApp Status (9:16)</span>
                </div>
              </SelectItem>
              <SelectItem value="instagram_story">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  <span>Instagram Story (9:16)</span>
                </div>
              </SelectItem>
              <SelectItem value="instagram_square">
                <div className="flex items-center gap-2">
                  <Square className="w-4 h-4" />
                  <span>Instagram Square (1:1)</span>
                </div>
              </SelectItem>
              <SelectItem value="instagram_portrait">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  <span>Instagram Portrait (4:5)</span>
                </div>
              </SelectItem>
              <SelectItem value="facebook">
                <div className="flex items-center gap-2">
                  <RectangleHorizontal className="w-4 h-4" />
                  <span>Facebook Post (1.91:1)</span>
                </div>
              </SelectItem>
              <SelectItem value="twitter">
                <div className="flex items-center gap-2">
                  <RectangleHorizontal className="w-4 h-4" />
                  <span>Twitter/X (16:9)</span>
                </div>
              </SelectItem>
              <SelectItem value="a4_portrait">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>A4 Portrait (Print)</span>
                </div>
              </SelectItem>
              <SelectItem value="letter">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Letter Size (Print)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-center sm:text-right">
          <p className="text-xs text-muted-foreground">Dimensions</p>
          <p className="text-sm font-mono">
            {CARD_SIZES[cardSize].width} x {CARD_SIZES[cardSize].height}px
          </p>
          <p className="text-xs text-muted-foreground">{CARD_SIZES[cardSize].ratio}</p>
        </div>
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTemplates.map((template) => {
          const isSelected = data.template_id === template.id
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => selectTemplate(template.id)}
              onDoubleClick={() => setPreviewTemplate(template.id)}
              className={cn(
                "relative rounded-xl border-2 text-left transition-all overflow-hidden group",
                "hover:border-primary/50 hover:shadow-md",
                isSelected
                  ? "border-primary ring-2 ring-primary/20 shadow-md"
                  : "border-border"
              )}
            >
              {/* Mini preview of the template */}
              <div className="aspect-[9/16] overflow-hidden bg-muted">
                <div className="w-full h-full flex items-center justify-center p-2">
                  <InvitationCard
                    event={sampleEvent}
                    template={template}
                    size={cardSize}
                    className="w-full max-h-full shadow-sm"
                  />
                </div>
              </div>

              {/* Template info overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-3 pt-10">
                <h4 className="font-medium text-sm text-white truncate">{template.name}</h4>
                <p className="text-xs text-white/70 mt-0.5">{template.subcategory}</p>
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}

              {/* Preview hint on hover */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                Double-click to preview
              </div>
            </button>
          )
        })}
      </div>

      {/* Empty state if no templates */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No templates found for this category</p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory(null)
              setSelectedSubcategory(null)
            }}
            className="text-primary hover:underline mt-2"
          >
            View all templates
          </button>
        </div>
      )}

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

      {/* Selected template summary */}
      {selectedTemplate && (
        <div className="mt-6 p-4 rounded-xl border border-primary/20 bg-primary/5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">Selected: {selectedTemplate.name}</h4>
              <p className="text-sm text-muted-foreground mt-1">{selectedTemplate.description}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedTemplate.fields.showHebrewDate && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">Hebrew Date</span>
                )}
                {selectedTemplate.fields.showDressCode && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">Dress Code</span>
                )}
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{selectedTemplate.style.fontFamily}</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewTemplate(selectedTemplate.id)}
            >
              Preview
            </Button>
          </div>
        </div>
      )}

      {/* Full preview dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{previewTemplateData?.name}</span>
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
            <div className="flex flex-col items-center gap-6">
              <div className="w-full max-w-sm mx-auto">
                <InvitationCard
                  event={sampleEvent}
                  template={previewTemplateData}
                  size={cardSize}
                  className="w-full shadow-2xl rounded-lg"
                />
              </div>
              <div className="text-center text-sm text-muted-foreground">
                <p>Size: {CARD_SIZES[cardSize].label} ({CARD_SIZES[cardSize].width}x{CARD_SIZES[cardSize].height}px)</p>
              </div>
              <div className="flex gap-3">
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
