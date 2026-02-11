import type { CommunityRule } from "@/types/community"

export function RulesList({ rules }: { rules: CommunityRule[] }) {
  if (rules.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No rules have been set for this community.
      </p>
    )
  }

  return (
    <ol className="space-y-4">
      {rules.map((rule, index) => (
        <li key={rule.id} className="flex gap-3">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0 mt-0.5">
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{rule.title}</p>
            {rule.description && (
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {rule.description}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
