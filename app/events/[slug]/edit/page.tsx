import { notFound, redirect } from "next/navigation"
import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getAuthenticatedUser } from "@/lib/mock-user"
import { getEventBySlug, deleteEvent } from "@/lib/actions/event-actions"
import { EditEventForm } from "@/components/events/edit-event-form"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const event = await getEventBySlug(slug)
  
  return {
    title: event ? `Edit: ${event.title} | Kesher` : "Edit Event | Kesher",
  }
}

export default async function EditEventPage({ params }: Props) {
  const { slug } = await params
  const user = await getAuthenticatedUser()
  
  if (!user) {
    redirect(`/login?redirect=/events/${slug}/edit`)
  }

  const event = await getEventBySlug(slug)
  
  if (!event) {
    notFound()
  }

  // Check if user can edit this event (creator or admin)
  const isCreator = event.created_by === user.id
  const isAdmin = user.role === "admin"
  
  if (!isCreator && !isAdmin) {
    redirect(`/events/${slug}`)
  }

  // Server action for deletion
  async function handleDelete() {
    "use server"
    await deleteEvent(event!.id)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-8 pb-24 md:pb-8">
      {/* Back link */}
      <Link
        href={`/events/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to event
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-6">Edit Event</h1>

      <EditEventForm
        event={event}
        canDelete={isCreator || isAdmin}
        onDelete={handleDelete}
        returnUrl={`/events/${slug}`}
      />
    </div>
  )
}
