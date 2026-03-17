"use client"

import { useState, useRef } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { 
  EVENT_TEMPLATES, 
  getAllCategories,
  getCategoryLabel,
  getSubcategories,
  getTemplatesByCategory,
} from "@/lib/event-templates"
import { InvitationCard, CARD_SIZES, type CardSize } from "@/components/events/invitation-card"
import { Check, Sparkles, Eye, Palette, Settings2, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import type { EventFormData } from "./create-wizard"

interface StepDesignPreviewProps {
  formData: EventFormData
  updateFormData: (updates: Partial<EventFormData>) => void
}

export function StepDesignPreview({ formData, updateFormData }: StepDesignPreviewProps) {
  const categories = getAllCategories()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"templates" | "customize">("templates")
  const [isCapturing, setIsCapturing] = useState(false)
  const [captured, setCaptured] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  async function captureAndSave() {
    if (!previewRef.current || !formData.template_id) return
    setIsCapturing(true)

    try {
      const { toJpeg } = await import("html-to-image")
      const el = previewRef.current

      // html-to-image serializes CSS by reading computed style values.
      // Tailwind v4 uses lab()/oklch() in its @theme which html-to-image
      // can't parse. Fix: walk every element in the capture target, read
      // its computed color properties via the live DOM (browser resolves
      // lab()->rgb() natively), then set them as explicit inline styles
      // so the cloned DOM has plain rgb() values.
      const colorProps = [
        "color", "background-color", "border-color",
        "border-top-color", "border-bottom-color",
        "border-left-color", "border-right-color",
        "outline-color", "text-decoration-color",
      ]
      const allEls = [el, ...Array.from(el.querySelectorAll<HTMLElement>("*"))]
      const savedStyles: Array<{ el: HTMLElement; saved: string }> = []

      for (const node of allEls) {
        if (!(node instanceof HTMLElement)) continue
        const cs = window.getComputedStyle(node)
        const patch: Record<string, string> = {}
        for (const cp of colorProps) {
          const val = cs.getPropertyValue(cp)
          if (val && /\b(ok)?l(ab|ch)\(/.test(val)) {
            patch[cp] = val
          }
        }
        if (Object.keys(patch).length > 0) {
          savedStyles.push({ el: node, saved: node.getAttribute("style") ?? "" })
          for (const [cp, val] of Object.entries(patch)) {
            node.style.setProperty(cp, val)
          }
        }
      }

      const dataUrl = await toJpeg(el, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      })

      // Restore original inline styles
      for (const { el: node, saved } of savedStyles) {
        if (saved) {
          node.setAttribute("style", saved)
        } else {
          node.removeAttribute("style")
        }
      }

      // Convert data URL to blob
      const res2 = await fetch(dataUrl)
      const blob = await res2.blob()

      const fd = new FormData()
      fd.append("file", blob, "invitation.jpg")
      fd.append("folder", "invitation-images")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const json = await res.json()
      if (json.url) {
        updateFormData({ invitation_image_url: json.url })
        setCaptured(true)
      }
    } catch (err) {
      console.error("Failed to capture invitation image", err)
    } finally {
      setIsCapturing(false)
    }
  }

  const subcategories = selectedCategory ? getSubcategories(selectedCategory) : []
  
  const filteredTemplates = selectedCategory
    ? selectedSubcategory
      ? EVENT_TEMPLATES.filter((t) => t.category === selectedCategory && t.subcategory === selectedSubcategory)
      : getTemplatesByCategory(selectedCategory)
    : EVENT_TEMPLATES

  const selectedTemplate = EVENT_TEMPLATES.find((t) => t.id === formData.template_id)
  const cardSize = (formData as EventFormData & { card_size?: CardSize }).card_size || "whatsapp"

  // Build the event object for the live preview
  const previewEvent = {
    title: formData.title || "Event Title",
    start_time: formData.start_date && formData.start_time 
      ? `${formData.start_date}T${formData.start_time}:00` 
      : new Date().toISOString(),
    end_time: formData.end_date && formData.end_time 
      ? `${formData.end_date}T${formData.end_time}:00` 
      : new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    location_name: formData.location_name || undefined,
    location_address: formData.location_address || undefined,
    dress_code: formData.dress_code || undefined,
    invitation_message: formData.invitation_message || selectedTemplate?.fields.hostLineTemplate,
    additional_info: formData.additional_info || undefined,
    contact_info: formData.contact_info || undefined,
  }

  function selectTemplate(templateId: string) {
    const template = EVENT_TEMPLATES.find((t) => t.id === templateId)
    if (template) {
      updateFormData({
        template_id: templateId,
        invitation_image_url: "",
        invitation_message: formData.invitation_message || template.fields.hostLineTemplate,
      })
      setCaptured(false)
    }
  }

  const updateCardSize = (size: CardSize) => {
    updateFormData({ card_size: size } as Partial<EventFormData>)
  }

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">Design Your Invitation</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Choose a template and customize your invitation. See your changes in real-time.
        </p>
      </div>

      {/* Main layout: Side by side on desktop */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Controls Panel - on left for desktop, top for mobile */}
        <div className="flex-1 lg:max-w-[50%] space-y-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "templates" | "customize")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="templates" className="gap-2">
                <Palette className="w-4 h-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="customize" className="gap-2">
                <Settings2 className="w-4 h-4" />
                Customize
              </TabsTrigger>
            </TabsList>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-4 mt-4">
              {/* Category filters */}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory(null)
                      setSelectedSubcategory(null)
                    }}
                    className={cn(
                      "px-2.5 py-1 text-xs rounded-full border transition-colors",
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
                      onClick={() => {
                        setSelectedCategory(cat)
                        setSelectedSubcategory(null)
                      }}
                      className={cn(
                        "px-2.5 py-1 text-xs rounded-full border transition-colors",
                        selectedCategory === cat
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:border-primary/50"
                      )}
                    >
                      {getCategoryLabel(cat)}
                    </button>
                  ))}
                </div>

                {/* Subcategory filters */}
                {selectedCategory && subcategories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pl-3 border-l-2 border-primary/20">
                    {subcategories.map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setSelectedSubcategory(selectedSubcategory === sub ? null : sub)}
                        className={cn(
                          "px-2 py-0.5 text-[11px] rounded-full border transition-colors",
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

              {/* Template grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto pr-1">
                {filteredTemplates.map((template) => {
                  const isSelected = formData.template_id === template.id
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => selectTemplate(template.id)}
                      className={cn(
                        "relative rounded-lg border-2 text-left transition-all overflow-hidden",
                        "hover:border-primary/50 hover:shadow-sm",
                        isSelected
                          ? "border-primary ring-1 ring-primary/20"
                          : "border-border"
                      )}
                    >
                      {/* Mini preview */}
                      <div className="aspect-[9/16] overflow-hidden bg-muted p-1">
                        <InvitationCard
                          event={previewEvent}
                          template={template}
                          size={cardSize}
                          className="w-full h-full"
                        />
                      </div>

                      {/* Info overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                        <h4 className="font-medium text-[11px] text-white truncate">{template.name}</h4>
                      </div>

                      {/* Selected indicator */}
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* No template option */}
              <button
                type="button"
                onClick={() => updateFormData({ template_id: "" })}
                className={cn(
                  "flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full p-3 rounded-lg border border-dashed",
                  !formData.template_id && "border-primary bg-primary/5 text-foreground"
                )}
              >
                <Sparkles className="w-4 h-4" />
                Skip template - Upload custom image instead
              </button>
            </TabsContent>

            {/* Customize Tab */}
            <TabsContent value="customize" className="space-y-4 mt-4">
              {!formData.template_id ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Palette className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Select a template first to customize</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => setActiveTab("templates")}
                  >
                    Choose Template
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Invitation Message */}
                  <div className="space-y-2">
                    <Label htmlFor="invitation_message">Invitation Message</Label>
                    <Textarea
                      id="invitation_message"
                      value={formData.invitation_message}
                      onChange={(e) => updateFormData({ invitation_message: e.target.value })}
                      placeholder={selectedTemplate?.fields.hostLineTemplate || "Enter your invitation message..."}
                      rows={3}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      This appears above the event title on the invitation
                    </p>
                  </div>

                  {/* Dress Code */}
                  {selectedTemplate?.fields.showDressCode && (
                    <div className="space-y-2">
                      <Label htmlFor="dress_code">Dress Code</Label>
                      <Input
                        id="dress_code"
                        value={formData.dress_code}
                        onChange={(e) => updateFormData({ dress_code: e.target.value })}
                        placeholder="e.g., Formal, Business Casual, Black Tie"
                      />
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="space-y-2">
                    <Label htmlFor="additional_info">Additional Information</Label>
                    <Textarea
                      id="additional_info"
                      value={formData.additional_info}
                      onChange={(e) => updateFormData({ additional_info: e.target.value })}
                      placeholder="Any extra details for guests..."
                      rows={2}
                      className="resize-none"
                    />
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2">
                    <Label htmlFor="contact_info">Contact Information</Label>
                    <Input
                      id="contact_info"
                      value={formData.contact_info}
                      onChange={(e) => updateFormData({ contact_info: e.target.value })}
                      placeholder="e.g., Questions? Call 555-1234"
                    />
                  </div>


                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview Panel - on right for desktop, bottom for mobile */}
        <div className="flex-1 lg:max-w-[50%]">
          <div className="lg:sticky lg:top-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Live Preview
              </h3>
              <Select
                value={cardSize}
                onValueChange={(v) => updateCardSize(v as CardSize)}
              >
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp (9:16)</SelectItem>
                  <SelectItem value="instagram_story">Story (9:16)</SelectItem>
                  <SelectItem value="instagram_square">Square (1:1)</SelectItem>
                  <SelectItem value="instagram_portrait">Portrait (4:5)</SelectItem>
                  <SelectItem value="facebook">Facebook (1.91:1)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-muted/30 rounded-xl p-4 border border-border flex items-center justify-center min-h-[450px]">
              {formData.template_id ? (
                <div ref={previewRef} className="w-full max-w-[280px]">
                  <InvitationCard
                    event={previewEvent}
                    templateId={formData.template_id}
                    size={cardSize}
                    className="w-full shadow-xl rounded-lg"
                  />
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  <Palette className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No template selected</p>
                  <p className="text-sm mt-1">Choose a design to see your invitation</p>
                </div>
              )}
            </div>

            {formData.template_id && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-center text-muted-foreground">
                  {CARD_SIZES[cardSize].width} x {CARD_SIZES[cardSize].height}px
                </p>
                <Button
                  type="button"
                  variant={captured ? "outline" : "default"}
                  className="w-full gap-2"
                  onClick={captureAndSave}
                  disabled={isCapturing}
                >
                  {isCapturing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving design...
                    </>
                  ) : captured ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Design saved — click to re-capture
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Use this design as invitation image
                    </>
                  )}
                </Button>
                {captured && (
                  <p className="text-xs text-center text-muted-foreground">
                    This image will be shown on the event page and used for sharing previews.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected template info */}
      {selectedTemplate && (
        <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 flex items-center justify-between">
          <div>
            <span className="font-medium text-sm">Using: {selectedTemplate.name}</span>
            <span className="text-xs text-muted-foreground ml-2">({selectedTemplate.subcategory})</span>
          </div>
          <div className="flex gap-1">
            {selectedTemplate.fields.showHebrewDate && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">Hebrew Date</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
