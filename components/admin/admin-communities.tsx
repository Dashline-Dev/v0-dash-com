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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  getAllCommunities,
  toggleCommunityVerified,
  adminDeleteCommunity,
  adminUpdateCommunity,
  adminCreateCommunity,
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
  const [editTarget, setEditTarget] = useState<AdminCommunity | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    slug: "",
    description: "",
    visibility: "public",
    join_policy: "open",
  })
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

  const openEditDialog = (community: AdminCommunity) => {
    setEditTarget(community)
    setEditForm({
      name: community.name,
      slug: community.slug,
      description: community.description || "",
      visibility: community.visibility,
    })
  }

  const handleEditCommunity = async () => {
    if (!editTarget) return
    setActionLoading(editTarget.id)
    const result = await adminUpdateCommunity(editTarget.id, editForm)
    if (result.ok) {
      setCommunities((prev) =>
        prev.map((c) =>
          c.id === editTarget.id
            ? {
                ...c,
                name: editForm.name,
                slug: editForm.slug,
                description: editForm.description,
                visibility: editForm.visibility,
              }
            : c
        )
      )
    }
  setEditTarget(null)
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
                <DropdownMenuItem onClick={() => openEditDialog(community)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Community
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

{/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Community</DialogTitle>
            <DialogDescription>
              Update community information for {editTarget?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                value={editForm.slug}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, slug: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select
                  value={editForm.visibility}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, visibility: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="unlisted">Unlisted</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Join Policy</Label>
                <Select
                  value={editForm.join_policy || "open"}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, join_policy: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="approval">Approval Required</SelectItem>
                    <SelectItem value="invite_only">Invite Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditCommunity} disabled={actionLoading === editTarget?.id}>
              {actionLoading === editTarget?.id ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
