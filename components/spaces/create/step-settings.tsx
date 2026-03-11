"use client"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  SPACE_VISIBILITIES,
  SPACE_JOIN_POLICIES,
  type CreateSpaceInput,
  type SpaceVisibility,
  type SpaceJoinPolicy,
} from "@/types/space"

interface StepSettingsProps {
  data: CreateSpaceInput
  onChange: (data: Partial<CreateSpaceInput>) => void
}

export function StepSettings({ data, onChange }: StepSettingsProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-foreground mb-1">Access Settings</h3>
          <p className="text-sm text-muted-foreground">
            Control who can see and join this space
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Visibility</Label>
            <Select
              value={data.visibility}
              onValueChange={(val) => onChange({ visibility: val as SpaceVisibility })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPACE_VISIBILITIES.map((v) => (
                  <SelectItem key={v.value} value={v.value}>
                    <div className="flex flex-col items-start">
                      <span>{v.label}</span>
                      <span className="text-xs text-muted-foreground">{v.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Join Policy</Label>
            <Select
              value={data.join_policy}
              onValueChange={(val) => onChange({ join_policy: val as SpaceJoinPolicy })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPACE_JOIN_POLICIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    <div className="flex flex-col items-start">
                      <span>{p.label}</span>
                      <span className="text-xs text-muted-foreground">{p.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-muted/50 border border-border p-4 space-y-2">
        <h4 className="font-medium text-sm">How these settings work together</h4>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
          <li><strong>Public + Open:</strong> Anyone can find and join instantly</li>
          <li><strong>Public + Approval:</strong> Anyone can find, but must request to join</li>
          <li><strong>Visible + Approval:</strong> Visible in search, join requires approval</li>
          <li><strong>Private + Invite Only:</strong> Hidden from search, invite required</li>
        </ul>
      </div>
    </div>
  )
}
