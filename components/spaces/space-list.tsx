"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"
import { SpaceCard } from "./space-card"
import { SpaceTypeFilter } from "./space-type-filter"
import { CommunitySearch } from "@/components/communities/community-search"
import { getSpaces } from "@/lib/actions/space-actions"
import type { SpaceWithMeta, SpaceType } from "@/types/space"
import { Button } from "@/components/ui/button"

interface SpaceListProps {
  initialData: SpaceWithMeta[]
  initialTotal: number
  communityId?: string
}

export function SpaceList({ initialData, initialTotal, communityId }: SpaceListProps) {
  const [spaces, setSpaces] = useState(initialData)
  const [total, setTotal] = useState(initialTotal)
  const [offset, setOffset] = useState(initialData.length)
  const [loading, setLoading] = useState(false)

  const [search, setSearch] = useState("")
  const [type, setType] = useState<SpaceType | null>(null)
  const [filtering, setFiltering] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const fetchSpaces = useCallback(
    async (searchVal: string, typeVal: SpaceType | null, offsetVal?: number) => {
      const isLoadMore = !!offsetVal && offsetVal > 0
      if (isLoadMore) setLoading(true)
      else setFiltering(true)

      try {
        const result = await getSpaces({
          community_id: communityId,
          search: searchVal || undefined,
          type: typeVal || undefined,
          limit: 20,
          offset: isLoadMore ? offsetVal : 0,
        })

        if (isLoadMore) {
          setSpaces((prev) => [...prev, ...result.spaces])
        } else {
          setSpaces(result.spaces)
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
      fetchSpaces(search, type)
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [search, type, fetchSpaces])

  const loadMore = () => {
    if (loading || offset >= total) return
    fetchSpaces(search, type, offset)
  }

  const hasMore = offset < total

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <CommunitySearch value={search} onChange={setSearch} placeholder="Search spaces..." />
        <SpaceTypeFilter selected={type} onSelect={setType} />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
