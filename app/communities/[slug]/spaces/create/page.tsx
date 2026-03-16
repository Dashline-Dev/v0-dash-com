import { notFound, redirect } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/mock-user"
import { AuthRequiredModal } from "@/components/auth/auth-required-modal"
import { neon } from "@neondatabase/serverless"
import { SpaceCreateForm } from "@/components/spaces/space-create-form"

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

  // Only members with admin/moderator role can create spaces
  const membership = await sql(
    `SELECT role FROM community_members
     WHERE community_id = $1 AND user_id = $2 AND status = 'active'`,
    [community[0].id, user.id]
  )

  const role = membership[0]?.role as string | undefined
  const canCreate = role && ["admin", "moderator", "owner"].includes(role)

  if (!canCreate) {
    return (
      <div className="px-4 py-10 md:px-6 lg:px-10 text-center">
        <h1 className="text-xl font-bold text-foreground mb-2">Access Denied</h1>
        <p className="text-muted-foreground text-sm">
          You must be an admin or moderator of &ldquo;{community[0].name}&rdquo; to create a space.
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 py-5 md:px-6 lg:px-10 md:py-8">
      <div className="max-w-lg mx-auto">
        <SpaceCreateForm
          communityId={community[0].id}
          communitySlug={community[0].slug}
          communityName={community[0].name}
        />
      </div>
    </div>
  )
}
