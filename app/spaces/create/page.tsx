import { AuthRequiredModal } from "@/components/auth/auth-required-modal"
import { getAuthenticatedUser } from "@/lib/mock-user"
import { CreateWizard } from "@/components/spaces/create/create-wizard"

export const metadata = {
  title: "Create Space | Dash",
  description: "Create a new standalone space.",
}

export default async function CreateSpacePage() {
  const user = await getAuthenticatedUser()
  if (!user) return <AuthRequiredModal />

  return (
    <div className="px-4 py-5 md:px-6 lg:px-10 md:py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Create a Space
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Set up a new space in a few simple steps
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 md:p-6">
          <CreateWizard />
        </div>
      </div>
    </div>
  )
}
