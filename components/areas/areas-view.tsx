"use client"

import { useState, useCallback } from "react"
import { Search, MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  getAreas,
  getAreasByZipCode,
  getAreaEvents,
  getAreaCommunities,
  getAreaSpaces,
} from "@/lib/actions/area-actions"
import { AreaSection } from "./area-section"
import type { AreaWithMeta } from "@/types/area"
import type { AreaSectionData } from "@/app/areas/page"

interface AreasViewProps {
  initialAreas: AreaWithMeta[]
  initialAreaData: AreaSectionData[]
}

export function AreasView({ initialAreas, initialAreaData }: AreasViewProps) {
  const [areaData, setAreaData] = useState<AreaSectionData[]>(initialAreaData)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)

  const fetchAreaData = useCallback(async (areas: AreaWithMeta[]): Promise<AreaSectionData[]> => {
    return Promise.all(
      areas.map(async (area) => {
        const [eventsResult, communities, spaces] = await Promise.all([
          getAreaEvents(area.id, { upcoming: true, limit: 8 }),
          getAreaCommunities(area.id, { limit: 8 }),
          getAreaSpaces(area.id, { limit: 8 }),
        ])
        return {
          area,
          events: eventsResult.events,
          eventTotal: eventsResult.total,
          communities,
          spaces,
        }
      })
    )
  }, [])

  const handleSearch = useCallback(
    async (query: string) => {
      setSearch(query)
      if (!query) {
        setAreaData(initialAreaData)
        return
      }
      setLoading(true)
      try {
        const isZip = /^\d{5}$/.test(query.trim())
        const areas = isZip
          ? await getAreasByZipCode(query.trim())
          : (await getAreas({ search: query, limit: 12 })).areas
        const data = await fetchAreaData(areas)
        setAreaData(data)
      } finally {
        setLoading(false)
      }
    },
    [initialAreaData, fetchAreaData]
  )

  // Filter to areas with content
  const populated = areaData.filter(
    (d) => d.events.length > 0 || d.communities.length > 0 || d.spaces.length > 0
  )

  return (
    <div>
      {/* Search */}
      <div className="relative mb-8">
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

      {loading ? (
        <div className="space-y-12">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="space-y-1.5">
                  <div className="h-5 w-32 bg-muted rounded" />
                  <div className="h-3 w-48 bg-muted rounded" />
                </div>
              </div>
              <div className="flex gap-3 overflow-hidden">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex-shrink-0 w-56 h-36 bg-muted rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : populated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <MapPin className="w-12 h-12 text-muted-foreground/20 mb-3" />
          <p className="text-lg font-medium text-foreground">No areas found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {search
              ? "Try a different search term or zip code."
              : "Areas will appear here once communities and events are linked."}
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {populated.map(({ area, events, eventTotal, communities, spaces }) => (
            <AreaSection
              key={area.id}
              area={area}
              events={events}
              eventTotal={eventTotal}
              communities={communities}
              spaces={spaces}
            />
          ))}
        </div>
      )}
    </div>
  )
}
