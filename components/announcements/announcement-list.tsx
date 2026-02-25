"use client"

import { useState, useTransition, useMemo } from "react"
import { Loader2, Megaphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CommunitySearch } from "@/components/communities/community-search"
import { FacetFilter, type FacetOption } from "@/components/ui/facet-filter"
import { AnnouncementCard } from "./announcement-card"
import { getAnnouncements } from "@/lib/actions/announcement-actions"
import type { AnnouncementWithMeta } from "@/types/announcement"
import { ANNOUNCEMENT_PRIORITY_LABELS } from "@/types/announcement"

interface AnnouncementListProps {
  initialAnnouncements: AnnouncementWithMeta[]
  initialCursor: string | null
  initialHasMore: boolean
  communityId?: string
  spaceId?: string
}

export function AnnouncementList({
  initialAnnouncements,
  initialCursor,
  initialHasMore,
  communityId,
  spaceId,
}: AnnouncementListProps) {
  const [allAnnouncements, setAllAnnouncements] = useState(initialAnnouncements)
  const [announcements, setAnnouncements] = useState(initialAnnouncements)
  const [cursor, setCursor] = useState(initialCursor)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [search, setSearch] = useState("")
  const [priority, setPriority] = useState<string | null>(null)
  const [communityFilter, setCommunityFilter] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Priority facets
  const priorityFacets: FacetOption[] = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const a of allAnnouncements) {
      counts[a.priority] = (counts[a.priority] || 0) + 1
    }
    return Object.entries(ANNOUNCEMENT_PRIORITY_LABELS).map(([value, label]) => ({
      value,
      label,
      count: counts[value] || 0,
    }))
  }, [allAnnouncements])

  // Community facets (when not scoped)
  const communityFacets: FacetOption[] = useMemo(() => {
    if (communityId) return []
    const counts: Record<string, { name: string; count: number }> = {}
    for (const a of allAnnouncements) {
      if (!counts[a.community_slug]) {
        counts[a.community_slug] = { name: a.community_name, count: 0 }
      }
      counts[a.community_slug].count++
    }
    return Object.entries(counts).map(([slug, { name, count }]) => ({
      value: slug,
      label: name,
      count,
    }))
  }, [allAnnouncements, communityId])

  function applyClientFilters(all: AnnouncementWithMeta[], p: string | null, cf: string | null) {
    let filtered = all
    if (p) filtered = filtered.filter((a) => a.priority === p)
    if (cf) filtered = filtered.filter((a) => a.community_slug === cf)
    setAnnouncements(filtered)
  }

  function fetchAnnouncements(searchVal: string) {
    startTransition(async () => {
      const result = await getAnnouncements({
        communityId,
        spaceId,
        search: searchVal || undefined,
        limit: 20,
      })
      setAllAnnouncements(result.announcements)
      applyClientFilters(result.announcements, priority, communityFilter)
      setCursor(result.cursor)
      setHasMore(result.hasMore)
    })
  }

  function handleSearch(value: string) {
    setSearch(value)
    fetchAnnouncements(value)
  }

  function handlePriority(value: string | null) {
    setPriority(value)
    applyClientFilters(allAnnouncements, value, communityFilter)
  }

  function handleCommunityFilter(value: string | null) {
    setCommunityFilter(value)
    applyClientFilters(allAnnouncements, priority, value)
  }

  function handleLoadMore() {
    if (!cursor) return
    startTransition(async () => {
      const result = await getAnnouncements({
        communityId,
        spaceId,
        search: search || undefined,
        cursor,
        limit: 20,
      })
      const newAll = [...allAnnouncements, ...result.announcements]
      setAllAnnouncements(newAll)
      applyClientFilters(newAll, priority, communityFilter)
      setCursor(result.cursor)
      setHasMore(result.hasMore)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <CommunitySearch
        value={search}
        onChange={handleSearch}
        placeholder="Search announcements..."
      />

      {/* Faceted filters */}
      <div className="flex flex-col gap-1.5">
        <FacetFilter
          label="Priority"
          options={priorityFacets}
          selected={priority}
          onSelect={handlePriority}
        />
        {communityFacets.length > 1 && (
          <FacetFilter
            label="Community"
            options={communityFacets}
            selected={communityFilter}
            onSelect={handleCommunityFilter}
          />
        )}
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

          {hasMore && !priority && !communityFilter && (
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
