"use client"

import { useState, useTransition, useEffect } from "react"
import { Share2, Copy, Check, Users, Link2, X, Calendar, MapPin, Clock } from "lucide-react"
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
import { formatEventDate, formatEventTime } from "@/types/event"
import type { EventWithMeta } from "@/types/event"

interface EventShareDialogProps {
  eventId: string
  eventSlug: string
  /** Full event object for rich preview and share text */
  event?: EventWithMeta
  /** Name of the person sharing — prepended to share text */
  sharerName?: string
  /** IDs of communities this event is already shared to */
  sharedCommunityIds?: string[]
  /** All communities the current user is a member of */
  communities: { id: string; name: string; slug: string }[]
  children?: React.ReactNode
}

export function EventShareDialog({
  eventId,
  eventSlug,
  event,
  sharerName,
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

  // Build rich share text with event details
  const shareText = (() => {
    if (!event) return eventUrl
    const lines: string[] = []
    // Invitation opener
    if (sharerName) lines.push(`${sharerName} is inviting you to ${event.title}`)
    else lines.push(event.title)
    const host = event.community_name || event.space_name || event.organizer_name
    if (host) lines.push(`Hosted by ${host}`)
    if (event.start_time) {
      const dateStr = formatEventDate(event.start_time, event.timezone)
      const timeStr = formatEventTime(event.start_time, event.timezone)
      const endStr = event.end_time ? ` – ${formatEventTime(event.end_time, event.timezone)}` : ""
      lines.push(`${dateStr} at ${timeStr}${endStr}`)
    }
    if (event.location_name) lines.push(event.location_name)
    lines.push("")
    lines.push(eventUrl)
    return lines.join("\n")
  })()

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
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
      <DialogContent className="flex flex-col max-h-[90dvh] overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Share Event</DialogTitle>
          <DialogDescription>
            Copy a link or share to one or more communities you are a member of.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-1 overflow-y-auto min-h-0 flex-1">

          {/* Event preview card */}
          {event && (
            <div className="shrink-0 rounded-xl border border-border bg-muted/30 px-4 py-3 flex flex-col gap-1.5">
              {sharerName && (
                <p className="text-xs text-muted-foreground">
                  {sharerName} is inviting you to
                </p>
              )}
              <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{event.title}</p>
              {(event.community_name || event.space_name || event.organizer_name) && (
                <p className="text-xs text-muted-foreground">
                  Hosted by {event.community_name || event.space_name || event.organizer_name}
                </p>
              )}
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
                {event.start_time && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {formatEventDate(event.start_time, event.timezone)}
                  </span>
                )}
                {event.start_time && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatEventTime(event.start_time, event.timezone)}
                    {event.end_time && ` – ${formatEventTime(event.end_time, event.timezone)}`}
                  </span>
                )}
                {event.location_name && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {event.location_name}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Quick share targets */}
          <div className="grid grid-cols-3 gap-2 shrink-0">
            {/* Copy link */}
            <button
              onClick={handleCopyLink}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/40 hover:bg-muted/80 transition-colors px-3 py-3"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-background border border-border">
                {copied ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5 text-foreground" />
                )}
              </span>
              <span className="text-xs font-medium text-foreground">
                {copied ? "Copied!" : "Copy"}
              </span>
            </button>

            {/* WhatsApp */}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/40 hover:bg-muted/80 transition-colors px-3 py-3"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[#25D366]/10 border border-[#25D366]/20">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.553 4.103 1.523 5.824L0 24l6.344-1.501A11.936 11.936 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.794 9.794 0 01-5.001-1.37l-.36-.213-3.767.891.946-3.668-.234-.376A9.794 9.794 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                </svg>
              </span>
              <span className="text-xs font-medium text-foreground">WhatsApp</span>
            </a>

            {/* Native share / More */}
            <button
              onClick={async () => {
                if (typeof navigator !== "undefined" && "share" in navigator) {
                  try {
                    await navigator.share({
                      title: event?.title ?? "Check out this event",
                      text: shareText,
                      url: eventUrl,
                    })
                  } catch { /* user cancelled */ }
                } else {
                  handleCopyLink()
                }
              }}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/40 hover:bg-muted/80 transition-colors px-3 py-3"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-background border border-border">
                <Share2 className="w-5 h-5 text-foreground" />
              </span>
              <span className="text-xs font-medium text-foreground">More</span>
            </button>
          </div>

          {/* URL row */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 shrink-0">
            <Link2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="flex-1 text-xs text-muted-foreground truncate">{eventUrl}</span>
            <button onClick={handleCopyLink} className="shrink-0 text-xs font-medium text-primary hover:underline">
              {copied ? "Copied!" : "Copy with details"}
            </button>
          </div>

          {/* Multi-community selection */}
          {communities.length > 0 && (
            <div className="flex flex-col gap-3 shrink-0">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm">
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

              <div className="space-y-2 max-h-40 overflow-y-auto">
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

              {error && <p className="text-sm text-destructive">{error}</p>}

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
