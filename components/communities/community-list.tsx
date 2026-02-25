"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { Loader2 } from "lucide-react"
import { CommunityCard } from "./community-card"
import { CommunitySearch } from "./community-search"
import { FacetFilter, type FacetOption } from "@/components/ui/facet-filter"
import { getCommunities } from "@/lib/actions/community-actions"
import type { CommunityListItem, CommunityCategory } from "@/types/community"
import { COMMUNITY_CATEGORIES } from "@/types/community"
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
  // Keep track of the unfiltered set for facet counts
  const [allCommunities, setAllCommunities] = useState(initialData)
  const [cursor, setCursor] = useState(initialCursor)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)

  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<CommunityCategory | null>(null)
  const [filtering, setFiltering] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Compute facet options from all loaded communities (pre-category-filter)
  const categoryFacets: FacetOption[] = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of allCommunities) {
      counts[c.category] = (counts[c.category] || 0) + 1
    }
    return COMMUNITY_CATEGORIES.map((cat) => ({
      value: cat.value,
      label: cat.label,
      count: counts[cat.value] || 0,
    }))
  }, [allCommunities])

  // Compute join_policy facets
  const joinPolicyFacets: FacetOption[] = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of allCommunities) {
      counts[c.join_policy] = (counts[c.join_policy] || 0) + 1
    }
    const labels: Record<string, string> = { open: "Open", approval: "Approval", invite_only: "Invite Only" }
    return Object.entries(counts).map(([value, count]) => ({
      value,
      label: labels[value] || value,
      count,
    }))
  }, [allCommunities])

  const [joinPolicy, setJoinPolicy] = useState<string | null>(null)

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
          limit: 20,
        })

        if (isLoadMore) {
          setAllCommunities((prev) => [...prev, ...result.data])
          setCommunities((prev) => [...prev, ...result.data])
        } else {
          setAllCommunities(result.data)
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
      fetchCommunities(search, null)
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [search, fetchCommunities])

  // Client-side filter by category + join policy
  useEffect(() => {
    let filtered = allCommunities
    if (category) filtered = filtered.filter((c) => c.category === category)
    if (joinPolicy) filtered = filtered.filter((c) => c.join_policy === joinPolicy)
    setCommunities(filtered)
  }, [category, joinPolicy, allCommunities])

  const loadMore = () => {
    if (loading || !hasMore) return
    fetchCommunities(search, null, cursor)
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <CommunitySearch value={search} onChange={setSearch} />

      {/* Faceted filters */}
      <div className="flex flex-col gap-1.5">
        <FacetFilter
          label="Category"
          options={categoryFacets}
          selected={category}
          onSelect={(v) => setCategory(v as CommunityCategory | null)}
        />
        <FacetFilter
          label="Join"
          options={joinPolicyFacets}
          selected={joinPolicy}
          onSelect={setJoinPolicy}
        />
      </div>

      {/* Loading state for filter changes */}
      {filtering && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {/* Community list */}
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
          {hasMore && !category && !joinPolicy && (
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
