"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EditSpaceForm } from "@/components/spaces/edit-space-form"
import { getSpaceBySlug } from "@/lib/actions/space-actions"

export default function EditSpacePage() {
  const params = useParams()
  const communitySlug = params.slug as string
  const spaceSlug = params.spaceSlug as string
  const [space, setSpace] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadSpace() {
      try {
        const data = await getSpaceBySlug(spaceSlug, communitySlug)
        if (!data) {
          setError("Space not found")
        } else {
          setSpace(data)
        }
      } catch (err) {
        setError("Failed to load space")
      } finally {
        setLoading(false)
      }
    }
    loadSpace()
  }, [spaceSlug, communitySlug])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !space) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground mb-2">
            {error || "Space not found"}
          </h1>
          <Button variant="outline" asChild>
            <Link href={`/communities/${communitySlug}`}>Back to Community</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={`/communities/${communitySlug}/spaces/${spaceSlug}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Space
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Edit Space</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Update the settings for {space.name}
        </p>
      </div>

      <EditSpaceForm space={space} communitySlug={communitySlug} />
    </div>
  )
}
