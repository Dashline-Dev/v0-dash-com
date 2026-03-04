import { getAuthenticatedUser } from "@/lib/mock-user"
import { getUserProfile, getUserCommunities, getUserStats } from "@/lib/actions/user-actions"
import { ProfileView } from "@/components/profile/profile-view"
import { AuthRequiredModal } from "@/components/auth/auth-required-modal"

export const metadata = {
  title: "Your Profile | Community Circle",
  description: "View and manage your profile, communities, and settings.",
}

export default async function ProfilePage() {
  const user = await getAuthenticatedUser()
  if (!user) return <AuthRequiredModal />

  const [profile, communities, stats] = await Promise.all([
    getUserProfile(user.id),
    getUserCommunities(user.id),
    getUserStats(user.id),
  ])

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8 pb-24 md:pb-8">
      <ProfileView
        user={user}
        profile={profile}
        communities={communities}
        stats={stats}
      />
    </div>
  )
}
