"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step {
  label: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export function StepIndicator({
  steps,
  currentStep,
  className,
}: StepIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {steps.map((step, index) => {
        const isComplete = index < currentStep
        const isCurrent = index === currentStep

        return (
          <div key={step.label} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold shrink-0 transition-colors",
                  isComplete
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background"
                      : "bg-secondary text-muted-foreground"
                )}
              >
                {isComplete ? (
                  <Check className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={cn(
                  "text-sm font-medium hidden sm:block whitespace-nowrap",
                  isCurrent
                    ? "text-foreground"
                    : isComplete
                      ? "text-primary"
                      : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-px mx-1",
                  isComplete ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
