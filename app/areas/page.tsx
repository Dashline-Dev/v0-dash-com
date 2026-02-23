import type { Metadata } from "next"
import { getAreas } from "@/lib/actions/area-actions"
import { AreaList } from "@/components/areas/area-list"

export const metadata: Metadata = {
  title: "Areas | Dash",
  description: "Discover communities and events in areas near you.",
}

export default async function AreasPage() {
  const { areas, total } = await getAreas({ type: "city", limit: 12 })

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Areas
        </h1>
        <p className="text-muted-foreground mt-1">
          Discover communities and events near you
        </p>
      </div>

      <AreaList initialAreas={areas} initialTotal={total} />
    </div>
  )
}
