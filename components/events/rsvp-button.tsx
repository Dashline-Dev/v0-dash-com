"use client"

import { useState, useTransition } from "react"
import {
  Check,
  Star,
  X,
  ChevronDown,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { rsvpToEvent, cancelRsvp } from "@/lib/actions/event-actions"
import type { RsvpStatus } from "@/types/event"

interface RsvpButtonProps {
  eventId: string
  currentStatus: RsvpStatus | null
  isFull: boolean
  isPast: boolean
}

export function RsvpButton({
  eventId,
  currentStatus,
  isFull,
  isPast,
}: RsvpButtonProps) {
  const [status, setStatus] = useState(currentStatus)
  const [isPending, startTransition] = useTransition()

  function handleRsvp(newStatus: RsvpStatus) {
    startTransition(async () => {
      await rsvpToEvent(eventId, newStatus)
      setStatus(newStatus)
    })
  }

  function handleCancel() {
    startTransition(async () => {
      await cancelRsvp(eventId)
      setStatus(null)
    })
  }

  if (isPast) {
    return (
      <Button variant="secondary" size="sm" disabled>
        Event ended
      </Button>
    )
  }

  if (!status) {
    return (
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => handleRsvp("going")}
          disabled={isPending || isFull}
          className="gap-1.5"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          {isFull ? "Full" : "Going"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleRsvp("interested")}
          disabled={isPending}
          className="gap-1.5"
        >
          <Star className="w-4 h-4" />
          Interested
        </Button>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={status === "going" ? "default" : "outline"}
          size="sm"
          disabled={isPending}
          className="gap-1.5"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : status === "going" ? (
            <Check className="w-4 h-4" />
          ) : (
            <Star className="w-4 h-4" />
          )}
          {status === "going" ? "Going" : "Interested"}
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {status !== "going" && (
          <DropdownMenuItem onClick={() => handleRsvp("going")} disabled={isFull}>
            <Check className="w-4 h-4 mr-2" />
            Going
          </DropdownMenuItem>
        )}
        {status !== "interested" && (
          <DropdownMenuItem onClick={() => handleRsvp("interested")}>
            <Star className="w-4 h-4 mr-2" />
            Interested
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={handleCancel}
          className="text-destructive focus:text-destructive"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel RSVP
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
