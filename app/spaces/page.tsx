import Link from "next/link"
import { AuthRequiredModal } from "@/components/auth/auth-required-modal"
import { Plus } from "lucide-react"
import { getAuthenticatedUser } from "@/lib/mock-user"
import { Button } from "@/components/ui/button"
import { SpaceList } from "@/components/spaces/space-list"
import { getSpaces } from "@/lib/actions/space-actions"

export const metadata = {
  title: "Spaces | Dash",
  description: "Browse and discover spaces across all communities.",
}

export default async function SpacesPage() {
  const user = await getAuthenticatedUser()
  if (!user) return <AuthRequiredModal />

  const { spaces, total } = await getSpaces({ limit: 20 })

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-5 md:py-6 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Spaces</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Discover spaces across all communities
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/spaces/create" className="gap-1.5">
            <Plus className="w-4 h-4" />
            New Space
          </Link>
        </Button>
      </div>

      <SpaceList initialData={spaces} initialTotal={total} />
    </div>
  )
}
