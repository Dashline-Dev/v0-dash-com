import { AuthForm } from "@/components/auth/auth-form"
import { getSession } from "@/lib/auth-session"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Sign Up | Community Circle",
  description: "Create your Community Circle account.",
}

export default async function SignUpPage() {
  const session = await getSession()
  if (session) redirect("/")

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <AuthForm mode="signup" />
    </main>
  )
}
