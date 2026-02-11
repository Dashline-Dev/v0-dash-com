import { TopNav } from "./top-nav"
import { BottomNav } from "./bottom-nav"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <TopNav />
      <main className="flex-1 pb-16 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
