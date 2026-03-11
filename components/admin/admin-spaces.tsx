"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import {
  Search,
  Trash2,
  Loader2,
  MoreHorizontal,
  ExternalLink,
  Layers,
  Eye,
  EyeOff,
  Pencil,
  Plus,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
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
  getAllSpaces,
  adminDeleteSpace,
  adminUpdateSpace,
  getAllCommunities,
  type AdminSpace,
} from "@/lib/actions/admin-actions"
import { SpaceCreateDialog } from "@/components/spaces/space-create-dialog"

interface AdminSpacesProps {
  initialSpaces: AdminSpace[]
  initialTotal: number
}

export function AdminSpaces({ initialSpaces, initialTotal }: AdminSpacesProps) {
  const [spaces, setSpaces] = useState(initialSpaces)
  const [total, setTotal] = useState(initialTotal)
  const [search, setSearch] = useState("")
  const [searching, setSearching] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminSpace | null>(null)
  const [editTarget, setEditTarget] = useState<AdminSpace | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    slug: "",
    type: "general",
    visibility: "public",
    join_policy: "open",
  })
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [communities, setCommunities] = useState<{ id: string; name: string; slug: string }[]>([])
  const [offset, setOffset] = useState(0)
  const limit = 50

  const doSearch = useCallback(
    async (query: string, newOffset = 0) => {
      setSearching(true)
      try {
        const result = await getAllSpaces({
          search: query,
          limit,
          offset: newOffset,
        })
        setSpaces(result.spaces)
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

  const handleDeleteSpace = async () => {
    if (!deleteTarget) return
    setActionLoading(deleteTarget.id)
    const result = await adminDeleteSpace(deleteTarget.id)
    if (result.ok) {
      setSpaces((prev) => prev.filter((s) => s.id !== deleteTarget.id))
      setTotal((prev) => prev - 1)
    }
    setDeleteTarget(null)
    setActionLoading(null)
  }

  const openEditDialog = (space: AdminSpace) => {
    setEditTarget(space)
    setEditForm({
      name: space.name,
      slug: space.slug,
      type: space.type,
      visibility: space.visibility,
    })
  }

  const handleEditSpace = async () => {
    if (!editTarget) return
    setActionLoading(editTarget.id)
    const result = await adminUpdateSpace(editTarget.id, editForm)
    if (result.ok) {
      setSpaces((prev) =>
        prev.map((s) =>
          s.id === editTarget.id
            ? {
                ...s,
                name: editForm.name,
                slug: editForm.slug,
                type: editForm.type,
                visibility: editForm.visibility,
              }
            : s
        )
      )
    }
  setEditTarget(null)
  setActionLoading(null)
  }

  const openCreateDialog = async () => {
    try {
      const result = await getAllCommunities({ limit: 100 })
      setCommunities(result.communities.map((c) => ({ id: c.id, name: c.name, slug: c.slug })))
    } catch {
      // ignore
    }
    setShowCreateDialog(true)
  }

  const handleSpaceCreated = (space: { id: string; slug: string }) => {
    // Refresh the list
    doSearch(search, 0)
  }
  
  const typeColor: Record<string, string> = {
    general: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    events: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    announcements:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    discussions:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  }

  return (
  <div className="space-y-4">
  <div className="flex items-center justify-between gap-4">
  <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1">
  <div className="relative flex-1 max-w-sm">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
  <Input
  placeholder="Search spaces..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="pl-9"
  />
  </div>
  <Button type="submit" variant="secondary" size="sm" disabled={searching}>
  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
  </Button>
  </form>
  <Button size="sm" onClick={openCreateDialog}>
  <Plus className="w-4 h-4 mr-1.5" />
  Add Space
  </Button>
  </div>

      <p className="text-xs text-muted-foreground">
        {total} space{total !== 1 ? "s" : ""} total
      </p>

      <div className="space-y-1">
        {spaces.map((space) => (
          <div
            key={space.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4 text-muted-foreground" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground truncate">
                  {space.name}
                </span>
                <Badge
                  className={`text-[10px] ${typeColor[space.type] || "bg-muted text-muted-foreground"}`}
                >
                  {space.type}
                </Badge>
                {space.visibility === "private" ? (
                  <EyeOff className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <Eye className="w-3 h-3 text-muted-foreground" />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {space.community_name ? (
                  <Link
                    href={`/communities/${space.community_slug}`}
                    className="hover:underline"
                  >
                    {space.community_name}
                  </Link>
                ) : (
                  "No community"
                )}
                {" "}&middot; {Number(space.member_count)} members
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <Badge variant="secondary" className="text-[10px]">
                {space.visibility}
              </Badge>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground shrink-0"
                  disabled={actionLoading === space.id}
                >
                  {actionLoading === space.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MoreHorizontal className="w-4 h-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEditDialog(space)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Space
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/communities/${space.community_slug}/spaces/${space.slug}`}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Space
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteTarget(space)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Space
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}

        {spaces.length === 0 && (
          <div className="text-center py-12">
            <Layers className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No spaces found.</p>
          </div>
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

{/* Create Dialog */}
      <SpaceCreateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        communities={communities}
        onSuccess={handleSpaceCreated}
      />

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Space</DialogTitle>
            <DialogDescription>
              Update space information for {editTarget?.name}
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
              <Label>Type</Label>
              <Select
                value={editForm.type}
                onValueChange={(v) => setEditForm((f) => ({ ...f, type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="discussion">Discussion</SelectItem>
                  <SelectItem value="events">Events</SelectItem>
                  <SelectItem value="announcements">Announcements</SelectItem>
                  <SelectItem value="resources">Resources</SelectItem>
                  <SelectItem value="projects">Projects</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
            <Button onClick={handleEditSpace} disabled={actionLoading === editTarget?.id}>
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
            <AlertDialogTitle>Delete this space?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong>{" "}
              and all its members. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSpace}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
