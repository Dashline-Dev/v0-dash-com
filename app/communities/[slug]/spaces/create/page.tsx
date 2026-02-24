import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { getAuthenticatedUser } from "@/lib/mock-user"
import { ArrowLeft } from "lucide-react"
import { neon } from "@neondatabase/serverless"
import { CreateSpaceForm } from "@/components/spaces/create-space-form"

const sql = neon(process.env.DATABASE_URL!)

interface CreateCommunitySpacePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: CreateCommunitySpacePageProps) {
  const { slug } = await params
  const community = await sql(`SELECT name FROM communities WHERE slug = $1`, [slug])
  if (!community[0]) return { title: "Not Found" }
  return {
    title: `Create Space - ${community[0].name} | Dash`,
  }
}

export default async function CreateCommunitySpacePage({ params }: CreateCommunitySpacePageProps) {
  const user = await getAuthenticatedUser()
  if (!user) redirect("/signin")

  const { slug } = await params
  const community = await sql(`SELECT id, name, slug FROM communities WHERE slug = $1`, [slug])
  if (!community[0]) notFound()

  return (
    <div className="px-4 md:px-6 lg:px-10 py-6 pb-24 md:pb-6">
      <Link
        href={`/communities/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {community[0].name}
      </Link>

      <h1 className="text-xl md:text-2xl font-bold text-foreground mb-6">
        Create a Space in {community[0].name}
      </h1>

      <CreateSpaceForm communityId={community[0].id} communitySlug={community[0].slug} />
    </div>
  )
}
