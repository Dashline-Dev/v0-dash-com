import { TopNav } from "./top-nav"
import { BottomNav } from "./bottom-nav"
import { getCurrentUser } from "@/lib/mock-user"

export async function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser()
  const isAuthenticated = user.id !== "guest"
  console.log("[v0] AppShell: userId=", user.id, "authenticated=", isAuthenticated)

  return (
    <div className="min-h-dvh flex flex-col">
      <TopNav user={isAuthenticated ? user : null} />
      <main className="flex-1 pb-16 md:pb-0">
        {children}
      </main>
      <BottomNav user={isAuthenticated ? user : null} />
    </div>
  )
}
