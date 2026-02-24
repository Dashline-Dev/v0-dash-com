"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
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

export function AuthRequiredModal() {
  const pathname = usePathname()

  return (
    <Dialog open>
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="sm:max-w-md"
      >
        <DialogHeader className="text-center items-center">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground text-lg font-bold mb-2">
            CC
          </span>
          <DialogTitle className="text-xl">Sign in to continue</DialogTitle>
          <DialogDescription>
            You need an account to access this page.
          </DialogDescription>
        </DialogHeader>

        <form
          method="POST"
          action="/api/auth/signin"
          className="space-y-4 mt-2"
        >
          <input type="hidden" name="redirectTo" value={pathname} />

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
              placeholder="Your password"
              required
              minLength={1}
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {"Don't have an account?"}{" "}
          <Link
            href="/signup"
            className="text-primary font-medium hover:underline"
          >
            Sign up
          </Link>
        </p>
      </DialogContent>
    </Dialog>
  )
}
