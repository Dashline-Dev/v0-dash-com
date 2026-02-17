"use client"

import { useState } from "react"
import { User, Mail, Lock, Shield, Trash2, Check, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  changePassword,
  updateEmail,
  updateDisplayName,
  deleteAccount,
} from "@/lib/auth"
import type { MockUser } from "@/lib/mock-user"

interface SettingsViewProps {
  user: MockUser
  email: string
  displayName: string
  memberSince: string
}

function StatusMessage({
  message,
  type,
}: {
  message: string | null
  type: "success" | "error"
}) {
  if (!message) return null
  return (
    <p
      className={`text-sm rounded-lg px-3 py-2 mt-3 ${
        type === "success"
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "bg-destructive/10 text-destructive-foreground"
      }`}
    >
      {type === "success" && <Check className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
      {type === "error" && <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
      {message}
    </p>
  )
}

export function SettingsView({
  user,
  email: initialEmail,
  displayName: initialDisplayName,
  memberSince,
}: SettingsViewProps) {
  // ── Display Name ─────────────────────────────────────────
  const [nameValue, setNameValue] = useState(initialDisplayName)
  const [nameSaving, setNameSaving] = useState(false)
  const [nameMsg, setNameMsg] = useState<{ text: string; type: "success" | "error" } | null>(null)

  async function handleNameSave() {
    setNameSaving(true)
    setNameMsg(null)
    const result = await updateDisplayName({ displayName: nameValue })
    setNameSaving(false)
    if (result.ok) {
      setNameMsg({ text: "Display name updated.", type: "success" })
    } else {
      setNameMsg({ text: result.error, type: "error" })
    }
  }

  // ── Email ────────────────────────────────────────────────
  const [emailValue, setEmailValue] = useState(initialEmail)
  const [emailPassword, setEmailPassword] = useState("")
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailMsg, setEmailMsg] = useState<{ text: string; type: "success" | "error" } | null>(null)

  async function handleEmailSave() {
    setEmailSaving(true)
    setEmailMsg(null)
    const result = await updateEmail({ newEmail: emailValue, password: emailPassword })
    setEmailSaving(false)
    if (result.ok) {
      setEmailMsg({ text: "Email updated successfully.", type: "success" })
      setEmailPassword("")
    } else {
      setEmailMsg({ text: result.error, type: "error" })
    }
  }

  // ── Password ─────────────────────────────────────────────
  const [currentPw, setCurrentPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [confirmPw, setConfirmPw] = useState("")
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ text: string; type: "success" | "error" } | null>(null)

  async function handlePasswordSave() {
    setPwMsg(null)
    if (newPw !== confirmPw) {
      setPwMsg({ text: "New passwords do not match.", type: "error" })
      return
    }
    setPwSaving(true)
    const result = await changePassword({ currentPassword: currentPw, newPassword: newPw })
    setPwSaving(false)
    if (result.ok) {
      setPwMsg({ text: "Password changed successfully.", type: "success" })
      setCurrentPw("")
      setNewPw("")
      setConfirmPw("")
    } else {
      setPwMsg({ text: result.error, type: "error" })
    }
  }

  // ── Delete Account ───────────────────────────────────────
  const [showDelete, setShowDelete] = useState(false)
  const [deletePw, setDeletePw] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [deleteMsg, setDeleteMsg] = useState<{ text: string; type: "error" } | null>(null)

  async function handleDelete() {
    setDeleteMsg(null)
    if (deleteConfirm !== "DELETE") {
      setDeleteMsg({ text: "Please type DELETE to confirm.", type: "error" })
      return
    }
    setDeleting(true)
    const result = await deleteAccount({ password: deletePw })
    if (result.ok) {
      window.location.href = "/"
    } else {
      setDeleting(false)
      setDeleteMsg({ text: result.error, type: "error" })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account information, security, and preferences.
        </p>
      </div>

      {/* Account overview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Account Overview</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium text-foreground">{initialEmail}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Member since</p>
              <p className="font-medium text-foreground">
                {new Date(memberSince).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Display Name */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Display Name</CardTitle>
          </div>
          <CardDescription>
            This is how other members see you in communities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              placeholder="Your display name"
              className="max-w-xs"
            />
            <Button
              onClick={handleNameSave}
              disabled={nameSaving || nameValue === initialDisplayName}
              size="sm"
            >
              {nameSaving ? "Saving..." : "Save"}
            </Button>
          </div>
          <StatusMessage message={nameMsg?.text ?? null} type={nameMsg?.type ?? "success"} />
        </CardContent>
      </Card>

      {/* Email */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Email Address</CardTitle>
          </div>
          <CardDescription>
            Used for signing in and receiving notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div>
            <Label htmlFor="newEmail">New email</Label>
            <Input
              id="newEmail"
              type="email"
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
              placeholder="you@example.com"
              className="max-w-xs mt-1"
            />
          </div>
          <div>
            <Label htmlFor="emailPw">Confirm with your password</Label>
            <Input
              id="emailPw"
              type="password"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              placeholder="Current password"
              className="max-w-xs mt-1"
            />
          </div>
          <Button
            onClick={handleEmailSave}
            disabled={emailSaving || emailValue === initialEmail || !emailPassword}
            size="sm"
            className="self-start"
          >
            {emailSaving ? "Updating..." : "Update Email"}
          </Button>
          <StatusMessage message={emailMsg?.text ?? null} type={emailMsg?.type ?? "success"} />
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Password</CardTitle>
          </div>
          <CardDescription>
            Change your password. Must be at least 6 characters.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div>
            <Label htmlFor="currentPw">Current password</Label>
            <Input
              id="currentPw"
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="Current password"
              className="max-w-xs mt-1"
            />
          </div>
          <div>
            <Label htmlFor="newPw">New password</Label>
            <Input
              id="newPw"
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="At least 6 characters"
              className="max-w-xs mt-1"
            />
          </div>
          <div>
            <Label htmlFor="confirmPw">Confirm new password</Label>
            <Input
              id="confirmPw"
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Repeat new password"
              className="max-w-xs mt-1"
            />
          </div>
          <Button
            onClick={handlePasswordSave}
            disabled={pwSaving || !currentPw || !newPw || !confirmPw}
            size="sm"
            className="self-start"
          >
            {pwSaving ? "Changing..." : "Change Password"}
          </Button>
          <StatusMessage message={pwMsg?.text ?? null} type={pwMsg?.type ?? "success"} />
        </CardContent>
      </Card>

      <Separator />

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-destructive-foreground" />
            <CardTitle className="text-base text-destructive-foreground">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Permanently delete your account and all associated data. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showDelete ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDelete(true)}
            >
              Delete my account
            </Button>
          ) : (
            <div className="flex flex-col gap-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <p className="text-sm font-medium text-foreground">
                This will permanently delete your account, all community memberships, and profile data.
              </p>
              <div>
                <Label htmlFor="deletePw">Your password</Label>
                <Input
                  id="deletePw"
                  type="password"
                  value={deletePw}
                  onChange={(e) => setDeletePw(e.target.value)}
                  placeholder="Enter your password"
                  className="max-w-xs mt-1"
                />
              </div>
              <div>
                <Label htmlFor="deleteConfirm">
                  {"Type "}
                  <span className="font-mono font-bold">DELETE</span>
                  {" to confirm"}
                </Label>
                <Input
                  id="deleteConfirm"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                  className="max-w-xs mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting || !deletePw || deleteConfirm !== "DELETE"}
                >
                  {deleting ? "Deleting..." : "Permanently Delete Account"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowDelete(false)
                    setDeletePw("")
                    setDeleteConfirm("")
                    setDeleteMsg(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
              <StatusMessage message={deleteMsg?.text ?? null} type="error" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
