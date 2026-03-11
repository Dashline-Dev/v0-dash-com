import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  getAreaBySlug,
  getAreaNeighborhoods,
  getAreaCommunities,
  getAreaEvents,
} from "@/lib/actions/area-actions"
import { AreaDetail } from "@/components/areas/area-detail"

interface AreaPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: AreaPageProps): Promise<Metadata> {
  const { slug } = await params
  const area = await getAreaBySlug(slug)
  if (!area) return { title: "Area Not Found" }
  return {
    title: `${area.name} | Areas | Dash`,
    description: area.description || `Explore communities and events in ${area.name}.`,
  }
}

export default async function AreaPage({ params }: AreaPageProps) {
  const { slug } = await params
  const area = await getAreaBySlug(slug)

  if (!area) notFound()

  const [neighborhoods, communities, eventsResult] = await Promise.all([
    getAreaNeighborhoods(area.id),
    getAreaCommunities(area.id),
    getAreaEvents(area.id, { upcoming: true, limit: 20 }),
  ])

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 pb-24 md:pb-8">
      <AreaDetail
        area={area}
        neighborhoods={neighborhoods}
        communities={communities}
        events={eventsResult.events}
        eventsTotal={eventsResult.total}
      />
    </div>
  )
}
