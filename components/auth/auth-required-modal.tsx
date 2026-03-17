"use client"

import { useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface AuthRequiredModalProps {
  children?: ReactNode
}

export function AuthRequiredModal({ children }: AuthRequiredModalProps = {}) {
  const router = useRouter()
  const [open, setOpen] = useState(true)
  const [mode, setMode] = useState<"signup" | "signin">("signup")

  function handleClose() {
    setOpen(false)
    if (!children) router.back()
  }

  const isSignIn = mode === "signin"

  const modal = (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <button
          onClick={handleClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-sm p-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="w-4 h-4" />
        </button>

        <DialogHeader className="text-center items-center">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground text-lg font-bold mb-2 select-none">
            CC
          </span>
          <DialogTitle className="text-xl">
            {isSignIn ? "Welcome back" : "Create a free account"}
          </DialogTitle>
          <DialogDescription>
            {isSignIn
              ? "Sign in to your Community Circle account."
              : "Join Community Circle to access this page and everything on the platform."}
          </DialogDescription>
        </DialogHeader>

        <form
          method="POST"
          action={isSignIn ? "/api/auth/signin" : "/api/auth/signup"}
          className="space-y-4 mt-2"
        >
          {!isSignIn && (
            <div className="space-y-2">
              <Label htmlFor="modal-name">Full name</Label>
              <Input
                id="modal-name"
                name="name"
                type="text"
                placeholder="Jane Smith"
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="modal-email">Email</Label>
            <Input
              id="modal-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-password">Password</Label>
            <Input
              id="modal-password"
              name="password"
              type="password"
              placeholder={isSignIn ? "Your password" : "Create a password"}
              required
              minLength={isSignIn ? 1 : 8}
              autoComplete={isSignIn ? "current-password" : "new-password"}
            />
          </div>

          <Button type="submit" className="w-full">
            {isSignIn ? "Sign in" : "Get started — it's free"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isSignIn ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="text-primary font-medium hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </DialogContent>
    </Dialog>
  )

  if (children) {
    return (
      <div className="relative">
        <div
          className="pointer-events-none select-none"
          aria-hidden="true"
          style={{ filter: open ? "blur(4px)" : undefined, opacity: open ? 0.45 : 1 }}
        >
          {children}
        </div>
        {modal}
      </div>
    )
  }

  return modal
}
