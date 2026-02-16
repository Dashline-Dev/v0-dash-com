import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { CommunityMember } from "@/types/community"
import { MEMBER_ROLE_LABELS } from "@/types/community"

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-primary/10 text-primary",
  admin: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  moderator: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  member: "",
}

export function MemberCard({ member }: { member: CommunityMember }) {
  const name = member.display_name || `User ${member.user_id.slice(-6)}`
  const initials = name.slice(0, 2).toUpperCase()

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
      <Avatar className="w-9 h-9">
        {member.avatar_url && <AvatarImage src={member.avatar_url} alt={name} />}
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {name}
        </p>
        <p className="text-xs text-muted-foreground">
          Joined{" "}
          {new Date(member.joined_at).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>
      {member.role !== "member" && (
        <Badge
          variant="secondary"
          className={`text-[10px] shrink-0 ${ROLE_COLORS[member.role] || ""}`}
        >
          {MEMBER_ROLE_LABELS[member.role]}
        </Badge>
      )}
    </div>
  )
}
