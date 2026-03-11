import type { Metadata } from "next"
import { getAuthenticatedUser } from "@/lib/mock-user"
import { AuthRequiredModal } from "@/components/auth/auth-required-modal"
import { getAreas } from "@/lib/actions/area-actions"
import { AreaList } from "@/components/areas/area-list"

export const metadata: Metadata = {
  title: "Areas | Dash",
  description: "Discover communities and events in areas near you.",
}

export default async function AreasPage() {
  const [user, { areas, total }] = await Promise.all([
    getAuthenticatedUser(),
    getAreas({ limit: 20 }),
  ])

  const content = (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-5 md:py-6 pb-24 md:pb-8">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground">Areas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Discover communities and events near you
        </p>
      </div>

      <AreaList initialAreas={areas} initialTotal={total} />
    </div>
  )

  if (!user) {
    return <AuthRequiredModal>{content}</AuthRequiredModal>
  }

  return content
}
