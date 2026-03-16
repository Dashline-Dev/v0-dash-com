"use client"

import { useState, useTransition, useEffect } from "react"
import { Share2, Copy, Check, Users, Link2, X } from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { shareEventToCommunities, unshareEventFromCommunity } from "@/lib/actions/event-actions"

interface EventShareDialogProps {
  eventId: string
  eventSlug: string
  /** IDs of communities this event is already shared to */
  sharedCommunityIds?: string[]
  /** All communities the current user is a member of */
  communities: { id: string; name: string; slug: string }[]
  children?: React.ReactNode
}

export function EventShareDialog({
  eventId,
  eventSlug,
  sharedCommunityIds = [],
  communities,
  children,
}: EventShareDialogProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set(sharedCommunityIds))

  // Reset selection when dialog opens
  useEffect(() => {
    if (open) {
      setSelected(new Set(sharedCommunityIds))
      setError("")
    }
  }, [open, sharedCommunityIds])

  const eventUrl =
    typeof window !== "undefined"
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

  const toggleCommunity = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSave = () => {
    setError("")
    const ids = Array.from(selected)

    startTransition(async () => {
      if (ids.length === 0) {
        // Remove from all
        const result = await unshareEventFromCommunity(eventId)
        if (result.ok) {
          setOpen(false)
          window.location.reload()
        } else {
          setError(result.error || "Failed to update sharing")
        }
        return
      }

      const result = await shareEventToCommunities(eventId, ids)
      if (result.ok) {
        setOpen(false)
        window.location.reload()
      } else {
        setError(result.error || "Failed to share event")
      }
    })
  }

  const hasChanges =
    selected.size !== sharedCommunityIds.length ||
    Array.from(selected).some((id) => !sharedCommunityIds.includes(id))

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
            Copy a link or share to one or more communities you are a member of.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Copy link */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Event Link
            </Label>
            <div className="flex gap-2">
              <div className="flex-1 rounded-md border bg-muted/50 px-3 py-2 text-sm truncate text-muted-foreground">
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
          </div>

          {/* Multi-community selection */}
          {communities.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Share to Communities
                </Label>
                {selected.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelected(new Set())}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {communities.map((community) => {
                  const isChecked = selected.has(community.id)
                  return (
                    <label
                      key={community.id}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                        isChecked
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40 hover:bg-accent/30"
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleCommunity(community.id)}
                        className="shrink-0"
                      />
                      <span className="text-sm font-medium">{community.name}</span>
                      {sharedCommunityIds.includes(community.id) && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          Shared
                        </Badge>
                      )}
                    </label>
                  )
                })}
              </div>

              {selected.size > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selected.size} {selected.size === 1 ? "community" : "communities"} selected
                </p>
              )}

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button
                onClick={handleSave}
                disabled={!hasChanges || isPending}
                className="w-full"
              >
                {isPending
                  ? "Saving..."
                  : selected.size === 0
                    ? "Remove from all communities"
                    : `Share to ${selected.size} ${selected.size === 1 ? "community" : "communities"}`}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
