import { notFound } from "next/navigation"
import Link from "next/link"
import { getAuthenticatedUser } from "@/lib/mock-user"
import { AuthRequiredModal } from "@/components/auth/auth-required-modal"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  if (!user) return <AuthRequiredModal />

  const { slug } = await params
  const community = await sql(`SELECT id, name, slug FROM communities WHERE slug = $1`, [slug])
  if (!community[0]) notFound()

  return (
    <div className="px-4 py-5 md:px-6 lg:px-10 md:py-8">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" size="sm" className="mb-4 gap-1.5" asChild>
          <Link href={`/communities/${slug}`}>
            <ArrowLeft className="w-4 h-4" />
            Back to {community[0].name}
          </Link>
        </Button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Create a Space
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Add a new space to {community[0].name}
          </p>
        </div>

        <CreateSpaceForm communityId={community[0].id} communitySlug={community[0].slug} />
      </div>
    </div>
  )
}
