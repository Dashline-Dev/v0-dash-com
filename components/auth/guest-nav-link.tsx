"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
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

interface GuestNavLinkProps {
  href: string
  isGuest: boolean
  className?: string
  children: ReactNode
  "aria-label"?: string
  "aria-current"?: "page" | undefined
}

/**
 * Renders a normal <Link> for authenticated users.
 * For guests, intercepts the click and opens the sign-up modal
 * in-place without any page navigation.
 */
export function GuestNavLink({
  href,
  isGuest,
  className,
  children,
  "aria-label": ariaLabel,
  "aria-current": ariaCurrent,
}: GuestNavLinkProps) {
  const [open, setOpen] = useState(false)

  if (!isGuest) {
    return (
      <Link
        href={href}
        className={className}
        aria-label={ariaLabel}
        aria-current={ariaCurrent}
      >
        {children}
      </Link>
    )
  }

  return (
    <>
      <button
        type="button"
        className={className}
        aria-label={ariaLabel}
        onClick={() => setOpen(true)}
      >
        {children}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-sm p-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="w-4 h-4" />
          </button>

          <DialogHeader className="text-center items-center">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground text-lg font-bold mb-2 select-none">
              CC
            </span>
            <DialogTitle className="text-xl">Create a free account</DialogTitle>
            <DialogDescription>
              Join Community Circle to access this page and everything on the platform.
            </DialogDescription>
          </DialogHeader>

          <form method="POST" action="/api/auth/signup" className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="gnl-name">Full name</Label>
              <Input
                id="gnl-name"
                name="name"
                type="text"
                placeholder="Jane Smith"
                required
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gnl-email">Email</Label>
              <Input
                id="gnl-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gnl-password">Password</Label>
              <Input
                id="gnl-password"
                name="password"
                type="password"
                placeholder="Create a password"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" className="w-full">
              Get started — it&apos;s free
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </DialogContent>
      </Dialog>
    </>
  )
}
