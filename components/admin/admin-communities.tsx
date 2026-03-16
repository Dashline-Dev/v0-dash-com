"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import {
  Search,
  BadgeCheck,
  BadgeX,
  Trash2,
  Loader2,
  MoreHorizontal,
  ExternalLink,
  Pencil,
  Plus,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  getAllCommunities,
  toggleCommunityVerified,
  adminDeleteCommunity,
  type AdminCommunity,
} from "@/lib/actions/admin-actions"

interface AdminCommunitiesProps {
  initialCommunities: AdminCommunity[]
  initialTotal: number
}

export function AdminCommunities({
  initialCommunities,
  initialTotal,
}: AdminCommunitiesProps) {
  const [communities, setCommunities] = useState(initialCommunities)
  const [total, setTotal] = useState(initialTotal)
  const [search, setSearch] = useState("")
  const [searching, setSearching] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminCommunity | null>(null)
  const [offset, setOffset] = useState(0)
  const limit = 50

  const doSearch = useCallback(
    async (query: string, newOffset = 0) => {
      setSearching(true)
      try {
        const result = await getAllCommunities({
          search: query,
          limit,
          offset: newOffset,
        })
        setCommunities(result.communities)
        setTotal(result.total)
        setOffset(newOffset)
      } catch {
        // silently fail
      } finally {
        setSearching(false)
      }
    },
    [limit]
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    doSearch(search, 0)
  }

  const handleToggleVerified = async (communityId: string) => {
    setActionLoading(communityId)
    const result = await toggleCommunityVerified(communityId)
    if (result.ok) {
      setCommunities((prev) =>
        prev.map((c) =>
          c.id === communityId ? { ...c, is_verified: !c.is_verified } : c
        )
      )
    }
    setActionLoading(null)
  }

  const handleDeleteCommunity = async () => {
    if (!deleteTarget) return
    setActionLoading(deleteTarget.id)
    const result = await adminDeleteCommunity(deleteTarget.id)
    if (result.ok) {
      setCommunities((prev) => prev.filter((c) => c.id !== deleteTarget.id))
      setTotal((prev) => prev - 1)
    }
    setDeleteTarget(null)
    setActionLoading(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" disabled={searching}>
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
          </Button>
        </form>
        <Button size="sm" asChild>
          <Link href="/communities/create">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Community
          </Link>
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {total} communit{total !== 1 ? "ies" : "y"} total
      </p>

      <div className="space-y-1">
        {communities.map((community) => (
          <div
            key={community.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <Avatar className="w-9 h-9 rounded-lg">
              {community.avatar_url && (
                <AvatarImage src={community.avatar_url} alt={community.name} />
              )}
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold rounded-lg">
                {community.name.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  href={`/communities/${community.slug}`}
                  className="text-sm font-medium text-foreground truncate hover:underline"
                >
                  {community.name}
                </Link>
                {community.is_verified && (
                  <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                /{community.slug} &middot;{" "}
                {Number(community.member_count)} members
                {community.owner_name && (
                  <> &middot; Owner: {community.owner_name}</>
                )}
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <Badge variant="secondary" className="text-[10px]">
                {community.visibility}
              </Badge>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground shrink-0"
                  disabled={actionLoading === community.id}
                >
                  {actionLoading === community.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MoreHorizontal className="w-4 h-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/communities/${community.slug}/edit`}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Community
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/communities/${community.slug}/admin`}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Admin Panel
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleToggleVerified(community.id)}
                >
                  {community.is_verified ? (
                    <>
                      <BadgeX className="w-4 h-4 mr-2" />
                      Remove Verification
                    </>
                  ) : (
                    <>
                      <BadgeCheck className="w-4 h-4 mr-2" />
                      Verify Community
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteTarget(community)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Community
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}

        {communities.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No communities found.
          </p>
        )}
      </div>

      {total > offset + limit && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => doSearch(search, offset + limit)}
            disabled={searching}
          >
            {searching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Show more"
            )}
          </Button>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this community?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>{deleteTarget?.name}</strong> and all its members, spaces,
              events, and data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCommunity}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
