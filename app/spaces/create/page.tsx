import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getAuthenticatedUser } from "@/lib/mock-user"
import { CreateSpaceForm } from "@/components/spaces/create-space-form"

export const metadata = {
  title: "Create Space | Dash",
  description: "Create a new standalone space.",
}

export default async function CreateSpacePage() {
  const user = await getAuthenticatedUser()
  if (!user) redirect("/signin")

  return (
    <div className="px-4 md:px-6 lg:px-10 py-6 pb-24 md:pb-6">
      <Link
        href="/spaces"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Spaces
      </Link>

      <h1 className="text-xl md:text-2xl font-bold text-foreground mb-6">
        Create a Space
      </h1>

      <CreateSpaceForm />
    </div>
  )
}
