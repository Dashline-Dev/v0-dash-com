"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AuthFormProps {
  mode: "signin" | "signup"
}

export function AuthForm({ mode }: AuthFormProps) {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const isSignUp = mode === "signup"
  const action = isSignUp ? "/api/auth/signup" : "/api/auth/signin"

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground text-lg font-bold">
            CC
          </span>
        </Link>
        <h1 className="text-2xl font-bold text-foreground text-balance">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          {isSignUp
            ? "Join Community Circle to find your people."
            : "Sign in to continue to Community Circle."}
        </p>
      </div>

      <form method="POST" action={action} className="space-y-4">
        {isSignUp && (
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              name="displayName"
              type="text"
              placeholder="Alex"
              required
              autoComplete="name"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder={isSignUp ? "At least 6 characters" : "Your password"}
            required
            minLength={isSignUp ? 6 : 1}
            autoComplete={isSignUp ? "new-password" : "current-password"}
          />
        </div>

        {error && (
          <p className="text-sm text-destructive-foreground bg-destructive/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full">
          {isSignUp ? "Create account" : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        {isSignUp ? (
          <>
            Already have an account?{" "}
            <Link href="/signin" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            {"Don't have an account?"}{" "}
            <Link href="/signup" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </>
        )}
      </p>
    </div>
  )
}
