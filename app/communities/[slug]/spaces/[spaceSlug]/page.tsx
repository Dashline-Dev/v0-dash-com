import { notFound } from "next/navigation"
import { neon } from "@neondatabase/serverless"
import { getSpaceBySlug, getSpaceMembers } from "@/lib/actions/space-actions"
import { SpaceHeader } from "@/components/spaces/space-header"
import { SpaceDetail } from "@/components/spaces/space-detail"

const sql = neon(process.env.DATABASE_URL!)

interface CommunitySpacePageProps {
  params: Promise<{ slug: string; spaceSlug: string }>
}

export async function generateMetadata({ params }: CommunitySpacePageProps) {
  const { slug, spaceSlug } = await params

  const community = await sql(`SELECT id, name FROM communities WHERE slug = $1`, [slug])
  if (!community[0]) return { title: "Not Found" }

  const space = await getSpaceBySlug(spaceSlug, community[0].id)
  if (!space) return { title: "Space Not Found" }

  return {
    title: `${space.name} - ${community[0].name} | Dash`,
    description: space.description || `Explore the ${space.name} space.`,
  }
}

export default async function CommunitySpacePage({ params }: CommunitySpacePageProps) {
  const { slug, spaceSlug } = await params

  const community = await sql(`SELECT id FROM communities WHERE slug = $1`, [slug])
  if (!community[0]) notFound()

  const space = await getSpaceBySlug(spaceSlug, community[0].id)
  if (!space) notFound()

  const members = await getSpaceMembers(space.id)

  return (
    <div className="pb-24 md:pb-6">
      <SpaceHeader space={space} />
      <SpaceDetail space={space} members={members} />
    </div>
  )
}
