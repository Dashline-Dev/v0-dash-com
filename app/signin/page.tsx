import { Suspense } from "react"
import { AuthForm } from "@/components/auth/auth-form"
import { getSession } from "@/lib/auth-session"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Sign In | Community Circle",
  description: "Sign in to Community Circle.",
}

export default async function SignInPage() {
  const session = await getSession()
  if (session) redirect("/")

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Suspense>
        <AuthForm mode="signin" />
      </Suspense>
    </main>
  )
}
