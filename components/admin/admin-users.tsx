"use client"

import { useState, useCallback } from "react"
import {
  Search,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  getAllUsers,
  toggleSuperAdmin,
  adminDeleteUser,
  adminUpdateUser,
  adminCreateUser,
  type AdminUser,
} from "@/lib/actions/admin-actions"

interface AdminUsersProps {
  initialUsers: AdminUser[]
  initialTotal: number
}

export function AdminUsers({ initialUsers, initialTotal }: AdminUsersProps) {
  const [users, setUsers] = useState(initialUsers)
  const [total, setTotal] = useState(initialTotal)
  const [search, setSearch] = useState("")
  const [searching, setSearching] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null)
  const [editForm, setEditForm] = useState({ display_name: "", email: "" })
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createForm, setCreateForm] = useState({ display_name: "", email: "", password: "" })
  const [createError, setCreateError] = useState("")
  const [offset, setOffset] = useState(0)
  const limit = 50

  const doSearch = useCallback(
    async (query: string, newOffset = 0) => {
      setSearching(true)
      try {
        const result = await getAllUsers({
          search: query,
          limit,
          offset: newOffset,
        })
        setUsers(result.users)
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

  const handleToggleSuperAdmin = async (userId: string) => {
    setActionLoading(userId)
    const result = await toggleSuperAdmin(userId)
    if (result.ok) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_superadmin: !u.is_superadmin } : u
        )
      )
    }
    setActionLoading(null)
  }

  const handleDeleteUser = async () => {
    if (!deleteTarget) return
    setActionLoading(deleteTarget.id)
    const result = await adminDeleteUser(deleteTarget.id)
    if (result.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id))
      setTotal((prev) => prev - 1)
    }
    setDeleteTarget(null)
    setActionLoading(null)
  }

  const openEditDialog = (user: AdminUser) => {
    setEditTarget(user)
    setEditForm({ display_name: user.display_name, email: user.email })
  }

  const handleEditUser = async () => {
    if (!editTarget) return
    setActionLoading(editTarget.id)
    const result = await adminUpdateUser(editTarget.id, editForm)
    if (result.ok) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editTarget.id
            ? { ...u, display_name: editForm.display_name, email: editForm.email }
            : u
        )
      )
    }
    setEditTarget(null)
    setActionLoading(null)
  }

  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.display_name || !createForm.password) {
      setCreateError("All fields are required")
      return
    }
    setActionLoading("create")
    setCreateError("")
    const result = await adminCreateUser(createForm)
    if (result.ok && result.id) {
      // Add the new user to the list
      setUsers((prev) => [
        {
          id: result.id!,
          email: createForm.email,
          display_name: createForm.display_name,
          avatar_url: null,
          is_superadmin: false,
          created_at: new Date().toISOString(),
          community_count: 0,
        },
        ...prev,
      ])
      setTotal((prev) => prev + 1)
      setShowCreateDialog(false)
      setCreateForm({ display_name: "", email: "", password: "" })
    } else {
      setCreateError(result.error || "Failed to create user")
    }
    setActionLoading(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" disabled={searching}>
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
          </Button>
        </form>
        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add User
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {total} user{total !== 1 ? "s" : ""} total
      </p>

      <div className="space-y-1">
        {users.map((user) => {
          const initials = (user.display_name || user.email)
            .slice(0, 2)
            .toUpperCase()

          return (
            <div
              key={user.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <Avatar className="w-9 h-9">
                {user.avatar_url && (
                  <AvatarImage src={user.avatar_url} alt={user.display_name} />
                )}
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.display_name}
                  </p>
                  {user.is_superadmin && (
                    <Badge className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 hover:bg-red-100">
                      Superadmin
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>

              <div className="hidden sm:block text-xs text-muted-foreground text-right shrink-0">
                <p>{Number(user.community_count)} communities</p>
                <p>
                  Joined{" "}
                  {new Date(user.created_at).toLocaleDateString("en-US", {
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
                    disabled={actionLoading === user.id}
                  >
                    {actionLoading === user.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MoreHorizontal className="w-4 h-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEditDialog(user)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit User
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleToggleSuperAdmin(user.id)}
                  >
                    {user.is_superadmin ? (
                      <>
                        <ShieldOff className="w-4 h-4 mr-2" />
                        Revoke Superadmin
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Grant Superadmin
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteTarget(user)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete User
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        })}

        {users.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No users found.
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

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the platform
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Display Name</Label>
              <Input
                id="create-name"
                value={createForm.display_name}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, display_name: e.target.value }))
                }
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Password</Label>
              <Input
                id="create-password"
                type="password"
                value={createForm.password}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, password: e.target.value }))
                }
                placeholder="********"
              />
            </div>
            {createError && (
              <p className="text-sm text-destructive">{createError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={actionLoading === "create"}>
              {actionLoading === "create" ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information for {editTarget?.display_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Display Name</Label>
              <Input
                id="edit-name"
                value={editForm.display_name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, display_name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser} disabled={actionLoading === editTarget?.id}>
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
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>{deleteTarget?.display_name}</strong> (
              {deleteTarget?.email}) and all their memberships. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
