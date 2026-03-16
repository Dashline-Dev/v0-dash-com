"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EditAreaForm } from "@/components/areas/edit-area-form"
import { getAreaBySlug } from "@/lib/actions/area-actions"

export default function EditAreaPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const [area, setArea] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadArea() {
      try {
        const data = await getAreaBySlug(slug)
        if (!data) {
          setError("Area not found")
        } else {
          setArea(data)
        }
      } catch (err) {
        setError("Failed to load area")
      } finally {
        setLoading(false)
      }
    }
    loadArea()
  }, [slug])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !area) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground mb-2">
            {error || "Area not found"}
          </h1>
          <Button variant="outline" asChild>
            <Link href="/areas">Back to Areas</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={`/areas/${slug}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Area
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Edit Area</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Update the settings for {area.name}
        </p>
      </div>

      <EditAreaForm area={area} />
    </div>
  )
}
