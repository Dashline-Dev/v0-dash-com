"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { Loader2 } from "lucide-react"
import { SpaceCard } from "./space-card"
import { CommunitySearch } from "@/components/communities/community-search"
import { FacetFilter, type FacetOption } from "@/components/ui/facet-filter"
import { getSpaces } from "@/lib/actions/space-actions"
import type { SpaceWithMeta, SpaceType } from "@/types/space"
import { SPACE_TYPE_LABELS, SPACE_VISIBILITY_LABELS } from "@/types/space"
import { Button } from "@/components/ui/button"

interface SpaceListProps {
  initialData: SpaceWithMeta[]
  initialTotal: number
  communityId?: string
}

export function SpaceList({ initialData, initialTotal, communityId }: SpaceListProps) {
  const [allSpaces, setAllSpaces] = useState(initialData)
  const [spaces, setSpaces] = useState(initialData)
  const [total, setTotal] = useState(initialTotal)
  const [offset, setOffset] = useState(initialData.length)
  const [loading, setLoading] = useState(false)

  const [search, setSearch] = useState("")
  const [type, setType] = useState<string | null>(null)
  const [visibility, setVisibility] = useState<string | null>(null)
  const [filtering, setFiltering] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Compute type facets from all loaded spaces
  const typeFacets: FacetOption[] = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of allSpaces) {
      counts[s.type] = (counts[s.type] || 0) + 1
    }
    return Object.entries(SPACE_TYPE_LABELS).map(([value, label]) => ({
      value,
      label,
      count: counts[value] || 0,
    }))
  }, [allSpaces])

  // Compute visibility facets
  const visFacets: FacetOption[] = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of allSpaces) {
      counts[s.visibility] = (counts[s.visibility] || 0) + 1
    }
    return Object.entries(SPACE_VISIBILITY_LABELS).map(([value, label]) => ({
      value,
      label,
      count: counts[value] || 0,
    }))
  }, [allSpaces])

  const fetchSpaces = useCallback(
    async (searchVal: string, offsetVal?: number) => {
      const isLoadMore = !!offsetVal && offsetVal > 0
      if (isLoadMore) setLoading(true)
      else setFiltering(true)

      try {
        const result = await getSpaces({
          community_id: communityId,
          search: searchVal || undefined,
          limit: 20,
          offset: isLoadMore ? offsetVal : 0,
        })

        if (isLoadMore) {
          setAllSpaces((prev) => [...prev, ...result.spaces])
        } else {
          setAllSpaces(result.spaces)
        }
        setTotal(result.total)
        setOffset(isLoadMore ? offsetVal + result.spaces.length : result.spaces.length)
      } catch (err) {
        console.error("Failed to fetch spaces:", err)
      } finally {
        setLoading(false)
        setFiltering(false)
      }
    },
    [communityId]
  )

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchSpaces(search)
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [search, fetchSpaces])

  // Client-side facet filtering
  useEffect(() => {
    let filtered = allSpaces
    if (type) filtered = filtered.filter((s) => s.type === type)
    if (visibility) filtered = filtered.filter((s) => s.visibility === visibility)
    setSpaces(filtered)
  }, [type, visibility, allSpaces])

  const loadMore = () => {
    if (loading || offset >= total) return
    fetchSpaces(search, offset)
  }

  const hasMore = offset < total && !type && !visibility

  return (
    <div className="space-y-3">
      <CommunitySearch value={search} onChange={setSearch} placeholder="Search spaces..." />

      {/* Faceted filters */}
      <div className="flex flex-col gap-1.5">
        <FacetFilter
          label="Type"
          options={typeFacets}
          selected={type}
          onSelect={setType}
        />
        <FacetFilter
          label="Visibility"
          options={visFacets}
          selected={visibility}
          onSelect={setVisibility}
        />
      </div>

      {filtering && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {!filtering && (
        <>
          {spaces.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-lg font-medium text-foreground">No spaces found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
              {spaces.map((space) => (
                <SpaceCard key={space.id} space={space} />
              ))}
            </div>
          )}

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={loadMore} disabled={loading} className="min-w-[140px]">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
