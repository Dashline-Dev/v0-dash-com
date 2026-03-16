"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import {
  Search,
  Trash2,
  Loader2,
  MoreHorizontal,
  ExternalLink,
  CalendarDays,
  Video,
  MapPin,
  Users,
  Pencil,
  Plus,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  getAllEvents,
  adminDeleteEvent,
  type AdminEvent,
} from "@/lib/actions/admin-actions"

interface AdminEventsProps {
  initialEvents: AdminEvent[]
  initialTotal: number
}

export function AdminEvents({ initialEvents, initialTotal }: AdminEventsProps) {
  const [events, setEvents] = useState(initialEvents)
  const [total, setTotal] = useState(initialTotal)
  const [search, setSearch] = useState("")
  const [searching, setSearching] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminEvent | null>(null)
  const [offset, setOffset] = useState(0)
  const limit = 50

  const doSearch = useCallback(
    async (query: string, newOffset = 0) => {
      setSearching(true)
      try {
        const result = await getAllEvents({
          search: query,
          limit,
          offset: newOffset,
        })
        setEvents(result.events)
        setTotal(result.total)
        setOffset(newOffset)
      } catch {
        // silently fail
      } finally {
        setSearching(false)
      }
    },
    [limit]
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    doSearch(search, 0)
  }

  const handleDeleteEvent = async () => {
    if (!deleteTarget) return
    setActionLoading(deleteTarget.id)
    const result = await adminDeleteEvent(deleteTarget.id)
    if (result.ok) {
      setEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id))
      setTotal((prev) => prev - 1)
    }
    setDeleteTarget(null)
    setActionLoading(null)
  }

  
  const typeIcon: Record<string, typeof CalendarDays> = {
    in_person: MapPin,
    virtual: Video,
    hybrid: Users,
  }

  const statusColor: Record<string, string> = {
    published: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    draft: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" disabled={searching}>
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
          </Button>
        </form>
        <Button size="sm" asChild>
          <Link href="/events/create">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Event
          </Link>
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {total} event{total !== 1 ? "s" : ""} total
      </p>

      <div className="space-y-1">
        {events.map((event) => {
          const TypeIcon = typeIcon[event.event_type] || CalendarDays
          const isPast = new Date(event.end_time) < new Date()

          return (
            <div
              key={event.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <TypeIcon className="w-4 h-4 text-muted-foreground" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/events/${event.slug}`}
                    className="text-sm font-medium text-foreground truncate hover:underline"
                  >
                    {event.title}
                  </Link>
                  <Badge
                    className={`text-[10px] ${statusColor[event.status] || "bg-muted text-muted-foreground"}`}
                  >
                    {event.status}
                  </Badge>
                  {isPast && (
                    <Badge
                      variant="outline"
                      className="text-[10px] text-muted-foreground"
                    >
                      Past
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {event.community_name ? (
                    <Link
                      href={`/communities/${event.community_slug}`}
                      className="hover:underline"
                    >
                      {event.community_name}
                    </Link>
                  ) : (
                    "No community"
                  )}
                  {" "}&middot; {event.rsvp_count} RSVPs
                </p>
              </div>

              <div className="hidden sm:block text-xs text-muted-foreground text-right shrink-0">
                <p>
                  {new Date(event.start_time).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p>
                  {new Date(event.start_time).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground shrink-0"
                    disabled={actionLoading === event.id}
                  >
                    {actionLoading === event.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MoreHorizontal className="w-4 h-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/events/${event.slug}/edit`}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit Event
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/events/${event.slug}`}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Event
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteTarget(event)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Event
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        })}

        {events.length === 0 && (
          <div className="text-center py-12">
            <CalendarDays className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No events found.</p>
          </div>
        )}
      </div>

      {total > offset + limit && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => doSearch(search, offset + limit)}
            disabled={searching}
          >
            {searching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Show more"
            )}
          </Button>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.title}</strong>{" "}
              and all its RSVPs. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
