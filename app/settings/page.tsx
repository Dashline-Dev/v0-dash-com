import { getAuthenticatedUser } from "@/lib/mock-user"
import { getAccountInfo } from "@/lib/auth-session"
import { SettingsView } from "@/components/settings/settings-view"
import { AuthRequiredModal } from "@/components/auth/auth-required-modal"

export const metadata = {
  title: "Account Settings | Community Circle",
  description: "Manage your account, password, email, and preferences.",
}

export default async function SettingsPage() {
  const user = await getAuthenticatedUser()
  if (!user) return <AuthRequiredModal />

  const accountInfo = await getAccountInfo()
  if (!accountInfo) return <AuthRequiredModal />

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-8 pb-24 md:pb-8">
      <SettingsView
        user={user}
        email={accountInfo.email}
        displayName={accountInfo.display_name}
        memberSince={accountInfo.created_at}
      />
    </div>
  )
}
