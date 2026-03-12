"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EditCommunityForm } from "@/components/communities/edit-community-form"
import { getCommunityBySlug } from "@/lib/actions/community-actions"

export default function EditCommunityPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const [community, setCommunity] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadCommunity() {
      try {
        const data = await getCommunityBySlug(slug)
        if (!data) {
          setError("Community not found")
        } else {
          setCommunity(data)
        }
      } catch (err) {
        setError("Failed to load community")
      } finally {
        setLoading(false)
      }
    }
    loadCommunity()
  }, [slug])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !community) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground mb-2">
            {error || "Community not found"}
          </h1>
          <Button variant="outline" asChild>
            <Link href="/communities">Back to Communities</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={`/communities/${slug}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Community
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Edit Community</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Update the settings for {community.name}
        </p>
      </div>

      <EditCommunityForm community={community} />
    </div>
  )
}
