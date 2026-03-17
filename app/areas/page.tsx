import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/mock-user"
import {
  getAreas,
  getAreaEvents,
  getAreaCommunities,
  getAreaSpaces,
} from "@/lib/actions/area-actions"
import { AreasView } from "@/components/areas/areas-view"
import type { AreaWithMeta, AreaEvent, AreaCommunity, AreaSpace } from "@/types/area"


export const metadata: Metadata = {
  title: "Areas | Dash",
  description: "Discover communities, events, and spaces in areas near you.",
}

export interface AreaSectionData {
  area: AreaWithMeta
  events: AreaEvent[]
  eventTotal: number
  communities: AreaCommunity[]
  spaces: AreaSpace[]
}

export default async function AreasPage() {
  const user = await getAuthenticatedUser()
  if (!user) redirect("/signin")

  const { areas } = await getAreas({ limit: 20 })

  // Fetch events, communities, and spaces for each area in parallel
  const areaData: AreaSectionData[] = await Promise.all(
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

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-5 md:py-8 pb-24 md:pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Areas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Discover communities, events, and spaces near you
        </p>
      </div>

      <AreasView initialAreas={areas} initialAreaData={areaData} />
    </div>
  )
}
