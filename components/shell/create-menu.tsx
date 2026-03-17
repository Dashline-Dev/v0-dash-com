"use client"

import Link from "next/link"
import { Plus, Users, CalendarPlus, Layers, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function CreateMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          <span>Create</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href="/events/create" className="flex items-center gap-2 cursor-pointer">
            <CalendarPlus className="w-4 h-4" />
            <span>Event</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/communities/create" className="flex items-center gap-2 cursor-pointer">
            <Users className="w-4 h-4" />
            <span>Community</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/spaces/create" className="flex items-center gap-2 cursor-pointer">
            <Layers className="w-4 h-4" />
            <span>Space</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/areas/create" className="flex items-center gap-2 cursor-pointer">
            <MapPin className="w-4 h-4" />
            <span>Area</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
