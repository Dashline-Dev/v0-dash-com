"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import {
  Search,
  Trash2,
  Loader2,
  MoreHorizontal,
  ExternalLink,
  Plus,
  MapPin,
  Pencil,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  getAllAreas,
  adminDeleteArea,
  adminUpdateArea,
  type AdminArea,
} from "@/lib/actions/admin-actions"

interface AdminAreasProps {
  initialAreas: AdminArea[]
  initialTotal: number
}

export function AdminAreas({ initialAreas, initialTotal }: AdminAreasProps) {
  const [areas, setAreas] = useState(initialAreas)
  const [total, setTotal] = useState(initialTotal)
  const [search, setSearch] = useState("")
  const [searching, setSearching] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminArea | null>(null)
  const [editTarget, setEditTarget] = useState<AdminArea | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    slug: "",
    description: "",
    type: "city",
    status: "active",
  })
  const [offset, setOffset] = useState(0)
  const limit = 50

  const doSearch = useCallback(
    async (query: string, newOffset = 0) => {
      setSearching(true)
      try {
        const result = await getAllAreas({
          search: query,
          limit,
          offset: newOffset,
        })
        setAreas(result.areas)
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

  const handleDeleteArea = async () => {
    if (!deleteTarget) return
    setActionLoading(deleteTarget.id)
    const result = await adminDeleteArea(deleteTarget.id)
    if (result.ok) {
      setAreas((prev) => prev.filter((a) => a.id !== deleteTarget.id))
      setTotal((prev) => prev - 1)
    }
    setDeleteTarget(null)
    setActionLoading(null)
  }

  const openEditDialog = (area: AdminArea) => {
    setEditTarget(area)
    setEditForm({
      name: area.name,
      slug: area.slug,
      description: area.description || "",
      type: area.type,
      status: area.status,
    })
  }

  const handleEditArea = async () => {
    if (!editTarget) return
    setActionLoading(editTarget.id)
    const result = await adminUpdateArea(editTarget.id, editForm)
    if (result.ok) {
      setAreas((prev) =>
        prev.map((a) =>
          a.id === editTarget.id
            ? {
                ...a,
                name: editForm.name,
                slug: editForm.slug,
                description: editForm.description,
                type: editForm.type,
                status: editForm.status,
              }
            : a
        )
      )
    }
    setEditTarget(null)
    setActionLoading(null)
  }

  const typeColor: Record<string, string> = {
    region: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    city: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    neighborhood:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search areas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            disabled={searching}
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
          </Button>
        </form>

        <Button asChild size="sm" className="gap-1.5">
          <Link href="/areas/create">
            <Plus className="w-4 h-4" />
            Create
          </Link>
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {total} area{total !== 1 ? "s" : ""} total
      </p>

      <div className="space-y-1">
        {areas.map((area) => (
          <div
            key={area.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-muted-foreground" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  href={`/areas/${area.slug}`}
                  className="text-sm font-medium text-foreground truncate hover:underline"
                >
                  {area.name}
                </Link>
                <Badge
                  className={`text-[10px] ${typeColor[area.type] || "bg-muted text-muted-foreground"}`}
                >
                  {area.type}
                </Badge>
                {area.status !== "active" && (
                  <Badge
                    variant="outline"
                    className="text-[10px] text-muted-foreground"
                  >
                    {area.status}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                /{area.slug}
                {area.parent_name && <> &middot; Parent: {area.parent_name}</>}
                {" "}&middot; {Number(area.community_count)} communities
              </p>
            </div>

            <div className="hidden sm:block text-xs text-muted-foreground text-right shrink-0">
              <p>
                {new Date(area.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground shrink-0"
                  disabled={actionLoading === area.id}
                >
                  {actionLoading === area.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MoreHorizontal className="w-4 h-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEditDialog(area)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Area
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/areas/${area.slug}`}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Area
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteTarget(area)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Area
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}

        {areas.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No areas found.</p>
            <Button asChild variant="link" size="sm" className="mt-2">
              <Link href="/areas/create">Create an area</Link>
            </Button>
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

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Area</DialogTitle>
            <DialogDescription>
              Update area information for {editTarget?.name}
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
            <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="region">Region</SelectItem>
                    <SelectItem value="city">City</SelectItem>
                    <SelectItem value="neighborhood">Neighborhood</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditArea} disabled={actionLoading === editTarget?.id}>
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
            <AlertDialogTitle>Delete this area?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate <strong>{deleteTarget?.name}</strong> and
              unlink it from all communities. This action can be reversed by
              reactivating the area in the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteArea}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
