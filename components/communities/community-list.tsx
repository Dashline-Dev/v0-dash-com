"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"
import { CommunityCard } from "./community-card"
import { CommunitySearch } from "./community-search"
import { CategoryFilter } from "./category-filter"
import { getCommunities } from "@/lib/actions/community-actions"
import type { CommunityListItem, CommunityCategory } from "@/types/community"
import { Button } from "@/components/ui/button"

interface CommunityListProps {
  initialData: CommunityListItem[]
  initialCursor: string | null
  initialHasMore: boolean
}

export function CommunityList({
  initialData,
  initialCursor,
  initialHasMore,
}: CommunityListProps) {
  const [communities, setCommunities] = useState(initialData)
  const [cursor, setCursor] = useState(initialCursor)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)

  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<CommunityCategory | null>(null)
  const [filtering, setFiltering] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Fetch with current filters
  const fetchCommunities = useCallback(
    async (
      searchVal: string,
      categoryVal: CommunityCategory | null,
      cursorVal?: string | null
    ) => {
      const isLoadMore = !!cursorVal
      if (isLoadMore) setLoading(true)
      else setFiltering(true)

      try {
        const result = await getCommunities({
          search: searchVal || undefined,
          category: categoryVal || undefined,
          cursor: cursorVal || undefined,
          limit: 12,
        })

        if (isLoadMore) {
          setCommunities((prev) => [...prev, ...result.data])
        } else {
          setCommunities(result.data)
        }
        setCursor(result.nextCursor)
        setHasMore(result.hasMore)
      } catch (err) {
        console.error("Failed to fetch communities:", err)
      } finally {
        setLoading(false)
        setFiltering(false)
      }
    },
    []
  )

  // Debounced search
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchCommunities(search, category)
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [search, category, fetchCommunities])

  const loadMore = () => {
    if (loading || !hasMore) return
    fetchCommunities(search, category, cursor)
  }

  return (
    <div className="space-y-4">
      {/* Search + filters */}
      <div className="space-y-3">
        <CommunitySearch value={search} onChange={setSearch} />
        <CategoryFilter selected={category} onSelect={setCategory} />
      </div>

      {/* Loading state for filter changes */}
      {filtering && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {/* Community grid */}
      {!filtering && (
        <>
          {communities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-lg font-medium text-foreground">
                No communities found
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
              {communities.map((community) => (
                <CommunityCard key={community.id} community={community} />
              ))}
            </div>
          )}

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loading}
                className="min-w-[140px]"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Load more"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
