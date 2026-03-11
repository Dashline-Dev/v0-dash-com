"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowLeft, ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StepIndicator } from "@/components/ui/step-indicator"
import { StepBasics } from "./step-basics"
import { StepAppearance } from "./step-appearance"
import { StepSettings } from "./step-settings"
import { StepReview } from "./step-review"
import { createSpace } from "@/lib/actions/space-actions"
import type { CreateSpaceInput, SpaceType, SpaceVisibility, SpaceJoinPolicy } from "@/types/space"

interface CreateWizardProps {
  communityId?: string
  communitySlug?: string
  communityName?: string
}

const STEPS = [
  { label: "Basics" },
  { label: "Appearance" },
  { label: "Settings" },
  { label: "Review" },
]

const DEFAULT_DATA: CreateSpaceInput = {
  name: "",
  slug: "",
  description: "",
  type: "general" as SpaceType,
  icon: "Layers",
  visibility: "public" as SpaceVisibility,
  join_policy: "open" as SpaceJoinPolicy,
  cover_image_url: "",
}

export function CreateWizard({ communityId, communitySlug, communityName }: CreateWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<CreateSpaceInput>({
    ...DEFAULT_DATA,
    community_id: communityId,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateData = (partial: Partial<CreateSpaceInput>) => {
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
      const result = await createSpace(data)
      if (result.community_slug) {
        router.push(`/communities/${result.community_slug}/spaces/${result.slug}`)
      } else {
        router.push(`/spaces/${result.slug}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create space.")
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
        {step === 0 && <StepBasics data={data} onChange={updateData} communitySlug={communitySlug} />}
        {step === 1 && <StepAppearance data={data} onChange={updateData} />}
        {step === 2 && <StepSettings data={data} onChange={updateData} />}
        {step === 3 && <StepReview data={data} communityName={communityName} />}
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
                Create Space
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
