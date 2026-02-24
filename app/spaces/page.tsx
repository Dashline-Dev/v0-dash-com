import Link from "next/link"
import { redirect } from "next/navigation"
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
  if (!user) redirect("/signin")

  const { spaces, total } = await getSpaces({ limit: 20 })

  return (
    <div className="px-4 md:px-6 lg:px-10 py-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground text-balance">
            Spaces
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
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
