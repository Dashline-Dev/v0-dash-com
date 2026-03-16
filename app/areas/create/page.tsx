import { redirect } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/mock-user"
import { getAllAreasForSelect } from "@/lib/actions/area-actions"
import { CreateAreaForm } from "@/components/areas/create-area-form"

export const metadata = {
  title: "Create Area | Dash",
  description: "Create a new geographic area for organizing communities and events.",
}

export default async function CreateAreaPage() {
  const user = await getAuthenticatedUser()

  // Only superadmins can create areas
  if (!user?.isSuperAdmin) {
    redirect("/areas")
  }

  const existingAreas = await getAllAreasForSelect()

  return (
    <div className="px-4 py-5 md:px-6 lg:px-10 md:py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Create Area</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Define a geographic area to organize communities and events
          </p>
        </div>

        <CreateAreaForm existingAreas={existingAreas} />
      </div>
    </div>
  )
}
