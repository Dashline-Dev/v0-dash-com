"use client"

import { useState, useCallback } from "react"
import { Search, MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AreaCard } from "./area-card"
import { getAreas, getAreasByZipCode } from "@/lib/actions/area-actions"
import type { AreaWithMeta } from "@/types/area"

interface AreaListProps {
  initialAreas: AreaWithMeta[]
  initialTotal: number
}

export function AreaList({ initialAreas, initialTotal }: AreaListProps) {
  const [areas, setAreas] = useState(initialAreas)
  const [total, setTotal] = useState(initialTotal)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [offset, setOffset] = useState(initialAreas.length)

  const handleSearch = useCallback(async (query: string) => {
    setSearch(query)
    setLoading(true)
    try {
      // Check if it looks like a zip code
      const isZip = /^\d{5}$/.test(query.trim())
      if (isZip) {
        const results = await getAreasByZipCode(query.trim())
        setAreas(results)
        setTotal(results.length)
        setOffset(results.length)
      } else {
        const result = await getAreas({ search: query || undefined, limit: 12 })
        setAreas(result.areas)
        setTotal(result.total)
        setOffset(result.areas.length)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMore = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getAreas({ search: search || undefined, limit: 12, offset })
      setAreas((prev) => [...prev, ...result.areas])
      setOffset((prev) => prev + result.areas.length)
    } finally {
      setLoading(false)
    }
  }, [search, offset])

  return (
    <div>
      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search areas by name or zip code..."
          value={search}
          onChange={(e) => {
            const val = e.target.value
            setSearch(val)
            if (val.length === 0 || val.length >= 2) {
              handleSearch(val)
            }
          }}
          className="pl-9"
        />
      </div>

      {/* Results */}
      {areas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MapPin className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-lg font-medium text-foreground">No areas found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {search ? "Try a different search term or zip code." : "Areas will appear here once they are created."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {areas.map((area) => (
              <AreaCard key={area.id} area={area} />
            ))}
          </div>

          {offset < total && (
            <div className="flex justify-center mt-6">
              <Button variant="outline" onClick={loadMore} disabled={loading}>
                {loading ? "Loading..." : `Load more (${total - offset} remaining)`}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
