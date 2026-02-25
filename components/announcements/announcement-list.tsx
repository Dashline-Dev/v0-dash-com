"use client"

import { useState, useTransition } from "react"
import { Loader2, Megaphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CommunitySearch } from "@/components/communities/community-search"
import { AnnouncementCard } from "./announcement-card"
import { getAnnouncements } from "@/lib/actions/announcement-actions"
import type { AnnouncementWithMeta, AnnouncementPriority } from "@/types/announcement"

interface AnnouncementListProps {
  initialAnnouncements: AnnouncementWithMeta[]
  initialCursor: string | null
  initialHasMore: boolean
  communityId?: string
  spaceId?: string
}

const PRIORITY_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
]

export function AnnouncementList({
  initialAnnouncements,
  initialCursor,
  initialHasMore,
  communityId,
  spaceId,
}: AnnouncementListProps) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements)
  const [cursor, setCursor] = useState(initialCursor)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [search, setSearch] = useState("")
  const [priority, setPriority] = useState("all")
  const [isPending, startTransition] = useTransition()

  function applyFilters(newSearch: string, newPriority: string) {
    startTransition(async () => {
      const result = await getAnnouncements({
        communityId,
        spaceId,
        search: newSearch || undefined,
        priority: newPriority,
        limit: 20,
      })
      setAnnouncements(result.announcements)
      setCursor(result.cursor)
      setHasMore(result.hasMore)
    })
  }

  function handleSearch(value: string) {
    setSearch(value)
    applyFilters(value, priority)
  }

  function handlePriority(value: string) {
    setPriority(value)
    applyFilters(search, value)
  }

  function handleLoadMore() {
    if (!cursor) return
    startTransition(async () => {
      const result = await getAnnouncements({
        communityId,
        spaceId,
        search: search || undefined,
        priority,
        cursor,
        limit: 20,
      })
      setAnnouncements((prev) => [...prev, ...result.announcements])
      setCursor(result.cursor)
      setHasMore(result.hasMore)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CommunitySearch
          value={search}
          onChange={handleSearch}
          placeholder="Search announcements..."
        />
      </div>

      {/* Priority filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {PRIORITY_FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={priority === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => handlePriority(f.value)}
            className="text-xs shrink-0"
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Results */}
      {isPending && announcements.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Megaphone className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-foreground">No announcements found</p>
          <p className="text-xs text-muted-foreground mt-1">
            {search ? "Try a different search term" : "Check back later for updates"}
          </p>
        </div>
      ) : (
        <>
          <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
            {announcements.map((a) => (
              <AnnouncementCard key={a.id} announcement={a} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
