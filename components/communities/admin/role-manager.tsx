"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X } from "lucide-react"
import {
  ROLES,
  ROLE_LABELS,
  ROLE_COLORS,
  PERMISSION_GROUPS,
  hasPermission,
  type Role,
  type Permission,
} from "@/lib/permissions"

const VISIBLE_ROLES: Role[] = ["owner", "admin", "moderator", "member"]

export function RoleManager() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-foreground">
          Role Permissions Matrix
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          View which permissions are granted to each role. Higher roles inherit
          all permissions from lower roles.
        </p>
      </div>

      {/* Role hierarchy overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Role Hierarchy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap">
            {VISIBLE_ROLES.map((role, i) => (
              <div key={role} className="flex items-center gap-2">
                <Badge variant="secondary" className={ROLE_COLORS[role]}>
                  {ROLE_LABELS[role]}
                </Badge>
                {i < VISIBLE_ROLES.length - 1 && (
                  <span className="text-xs text-muted-foreground">{">"}</span>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Each role inherits all permissions of roles below it. Owners have
            full control. Super Admins (platform-level) override all.
          </p>
        </CardContent>
      </Card>

      {/* Permission matrix */}
      {PERMISSION_GROUPS.map((group) => (
        <Card key={group.label}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{group.label}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground w-[40%]">
                      Permission
                    </th>
                    {VISIBLE_ROLES.map((role) => (
                      <th
                        key={role}
                        className="text-center px-3 py-2.5 text-xs font-medium text-muted-foreground"
                      >
                        {ROLE_LABELS[role]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.permissions.map((perm) => (
                    <tr
                      key={perm.key}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="px-4 py-2.5 text-foreground">
                        {perm.label}
                      </td>
                      {VISIBLE_ROLES.map((role) => {
                        const granted = hasPermission(
                          role,
                          perm.key as Permission
                        )
                        return (
                          <td key={role} className="text-center px-3 py-2.5">
                            {granted ? (
                              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                            ) : (
                              <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
