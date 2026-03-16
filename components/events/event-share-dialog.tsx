"use client"

import { useState, useTransition } from "react"
import { Share2, Copy, Check, Users, Link2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { shareEventToCommunity, unshareEventFromCommunity } from "@/lib/actions/event-actions"

interface EventShareDialogProps {
  eventId: string
  eventSlug: string
  currentCommunityId: string | null
  communities: { id: string; name: string; slug: string }[]
  children?: React.ReactNode
}

export function EventShareDialog({
  eventId,
  eventSlug,
  currentCommunityId,
  communities,
  children,
}: EventShareDialogProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [selectedCommunity, setSelectedCommunity] = useState(currentCommunityId || "")

  const eventUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/events/${eventSlug}`
    : `/events/${eventSlug}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard not available
    }
  }

  const handleShareToCommunity = () => {
    if (!selectedCommunity) return
    setError("")

    startTransition(async () => {
      const result = await shareEventToCommunity(eventId, selectedCommunity)
      if (result.ok) {
        setOpen(false)
        // Refresh page to show updated community
        window.location.reload()
      } else {
        setError(result.error || "Failed to share event")
      }
    })
  }

  const handleRemoveFromCommunity = () => {
    setError("")

    startTransition(async () => {
      const result = await unshareEventFromCommunity(eventId)
      if (result.ok) {
        setOpen(false)
        window.location.reload()
      } else {
        setError(result.error || "Failed to remove event from community")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Share2 className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Event</DialogTitle>
          <DialogDescription>
            Share this event via link or post it to a community you are a member of.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Copy link section */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Event Link
            </Label>
            <div className="flex gap-2">
              <div className="flex-1 rounded-md border bg-muted/50 px-3 py-2 text-sm truncate">
                {eventUrl}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can view your event (based on visibility settings)
            </p>
          </div>

          {/* Share to community section */}
          {communities.length > 0 && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Share to Community
              </Label>

              {currentCommunityId ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    This event is currently shared with{" "}
                    <span className="font-medium text-foreground">
                      {communities.find((c) => c.id === currentCommunityId)?.name}
                    </span>
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveFromCommunity}
                    disabled={isPending}
                  >
                    Remove from Community
                  </Button>
                </div>
              ) : (
                <>
                  <Select
                    value={selectedCommunity}
                    onValueChange={setSelectedCommunity}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a community" />
                    </SelectTrigger>
                    <SelectContent>
                      {communities.map((community) => (
                        <SelectItem key={community.id} value={community.id}>
                          {community.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleShareToCommunity}
                    disabled={!selectedCommunity || isPending}
                    className="w-full"
                  >
                    {isPending ? "Sharing..." : "Share to Community"}
                  </Button>
                </>
              )}

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
