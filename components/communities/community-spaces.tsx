import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SpaceCard } from "@/components/spaces/space-card"
import type { SpaceWithMeta } from "@/types/space"

interface CommunitySpacesProps {
  communitySlug: string
  spaces: SpaceWithMeta[]
}

export function CommunitySpaces({ communitySlug, spaces }: CommunitySpacesProps) {
  if (spaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium text-foreground">No spaces yet</p>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Create the first space for this community
        </p>
        <Button size="sm" asChild>
          <Link href={`/communities/${communitySlug}/spaces/create`} className="gap-1.5">
            <Plus className="w-4 h-4" />
            Create Space
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {spaces.length} space{spaces.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" variant="outline" asChild>
          <Link href={`/communities/${communitySlug}/spaces/create`} className="gap-1.5">
            <Plus className="w-4 h-4" />
            New Space
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {spaces.map((space) => (
          <SpaceCard key={space.id} space={space} />
        ))}
      </div>
    </div>
  )
}
