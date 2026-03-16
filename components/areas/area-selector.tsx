"use client"

import { X, MapPin } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

export interface AreaOption {
  id: string
  name: string
  type: string
  parentName: string | null
}

interface AreaSelectorProps {
  availableAreas: AreaOption[]
  selectedAreaIds: string[]
  onChange: (areaIds: string[]) => void
  label?: string
  description?: string
  placeholder?: string
}

export function AreaSelector({
  availableAreas,
  selectedAreaIds,
  onChange,
  label = "Areas (optional)",
  description = "Link to geographic areas so local users can discover this.",
  placeholder = "Select areas...",
}: AreaSelectorProps) {
  function toggleArea(areaId: string) {
    if (selectedAreaIds.includes(areaId)) {
      onChange(selectedAreaIds.filter((id) => id !== areaId))
    } else {
      onChange([...selectedAreaIds, areaId])
    }
  }

  function removeArea(areaId: string) {
    onChange(selectedAreaIds.filter((id) => id !== areaId))
  }

  const selectedAreas = availableAreas.filter((a) => selectedAreaIds.includes(a.id))

  if (availableAreas.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <MapPin className="w-3.5 h-3.5" />
        {label}
      </Label>
      <p className="text-xs text-muted-foreground">{description}</p>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            {selectedAreas.length > 0
              ? `${selectedAreas.length} area${selectedAreas.length > 1 ? "s" : ""} selected`
              : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="max-h-60 overflow-y-auto p-2 space-y-1">
            {availableAreas.map((area) => (
              <label
                key={area.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
              >
                <Checkbox
                  checked={selectedAreaIds.includes(area.id)}
                  onCheckedChange={() => toggleArea(area.id)}
                />
                <span className="text-sm flex-1">
                  {area.name}
                  {area.parentName && (
                    <span className="text-muted-foreground text-xs ml-1">
                      ({area.parentName})
                    </span>
                  )}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  {area.type}
                </span>
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {selectedAreas.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedAreas.map((area) => (
            <Badge key={area.id} variant="secondary" className="gap-1 pr-1">
              {area.name}
              <button
                type="button"
                onClick={() => removeArea(area.id)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
