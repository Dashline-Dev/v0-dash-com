import type { Metadata } from "next"
import { CreateWizard } from "@/components/communities/create/create-wizard"

export const metadata: Metadata = {
  title: "Create a Community - Community Circle",
  description: "Start a new community and bring people together.",
}

export default function CreateCommunityPage() {
  return (
    <div className="px-4 py-5 md:px-6 lg:px-10 md:py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Create a Community
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Set up your community in a few simple steps
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 md:p-6">
          <CreateWizard />
        </div>
      </div>
    </div>
  )
}
