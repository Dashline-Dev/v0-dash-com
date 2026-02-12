import { notFound } from "next/navigation"
import { getSpaceBySlug, getSpaceMembers } from "@/lib/actions/space-actions"
import { SpaceHeader } from "@/components/spaces/space-header"
import { SpaceDetail } from "@/components/spaces/space-detail"

interface SpacePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: SpacePageProps) {
  const { slug } = await params
  const space = await getSpaceBySlug(slug)
  if (!space) return { title: "Space Not Found" }
  return {
    title: `${space.name} | Dash`,
    description: space.description || `Explore the ${space.name} space.`,
  }
}

export default async function StandaloneSpacePage({ params }: SpacePageProps) {
  const { slug } = await params
  const space = await getSpaceBySlug(slug)
  if (!space) notFound()

  const members = await getSpaceMembers(space.id)

  return (
    <div className="pb-24 md:pb-6">
      <SpaceHeader space={space} />
      <SpaceDetail space={space} members={members} />
    </div>
  )
}
