"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowLeft, ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StepIndicator } from "@/components/ui/step-indicator"
import { StepBasics } from "./step-basics"
import { StepAppearance } from "./step-appearance"
import { StepLocation } from "./step-location"
import { StepRulesTags } from "./step-rules-tags"
import { StepReview } from "./step-review"
import { createCommunity } from "@/lib/actions/community-actions"
import { linkCommunityToArea } from "@/lib/actions/area-actions"
import type { CreateCommunityInput } from "@/types/community"

interface CreateWizardProps {
  availableAreas?: { id: string; name: string; type: string; parentName: string | null }[]
}

const STEPS = [
  { label: "Basics" },
  { label: "Appearance" },
  { label: "Location" },
  { label: "Rules & Tags" },
  { label: "Review" },
]

const DEFAULT_DATA: CreateCommunityInput = {
  name: "",
  slug: "",
  description: "",
  category: "general",
  type: "public",
  visibility: "public",
  posting_policy: "everyone",
  join_policy: "open",
  cover_image_url: null,
  avatar_url: null,
  location_name: null,
  contact_email: null,
  timezone: "UTC",
  tags: [],
  rules: [],
  areaIds: [],
}

export function CreateWizard({ availableAreas = [] }: CreateWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<CreateCommunityInput>(DEFAULT_DATA)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateData = (partial: Partial<CreateCommunityInput>) => {
    setData((prev) => ({ ...prev, ...partial }))
  }

  const canGoNext = () => {
    if (step === 0) {
      return data.name.trim().length >= 2 && data.slug.trim().length >= 2
    }
    return true
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const result = await createCommunity(data)
      if (result.success && result.slug && result.id) {
        // Link community to selected areas
        if (data.areaIds && data.areaIds.length > 0) {
          await Promise.all(
            data.areaIds.map((areaId) => linkCommunityToArea(result.id!, areaId))
          )
        }
        router.push(`/communities/${result.slug}`)
      } else {
        setError(result.error || "Failed to create community.")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const isLastStep = step === STEPS.length - 1

  return (
    <div className="space-y-6">
      <StepIndicator steps={STEPS} currentStep={step} />

      {/* Step content */}
      <div className="min-h-[320px]">
        {step === 0 && <StepBasics data={data} onChange={updateData} />}
        {step === 1 && <StepAppearance data={data} onChange={updateData} />}
        {step === 2 && <StepLocation data={data} onChange={updateData} availableAreas={availableAreas} />}
        {step === 3 && <StepRulesTags data={data} onChange={updateData} />}
        {step === 4 && <StepReview data={data} />}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
          {error}
        </p>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        {isLastStep ? (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="gap-1.5 min-w-[140px]"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                Create Community
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canGoNext()}
            className="gap-1.5"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
