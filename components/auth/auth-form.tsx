"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signUp, signIn } from "@/lib/auth"

interface AuthFormProps {
  mode: "signin" | "signup"
}

export function AuthForm({ mode }: AuthFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignUp = mode === "signup"

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      if (isSignUp) {
        const displayName = formData.get("displayName") as string
        const result = await signUp({ email, password, displayName })
        // On success, signUp calls redirect("/") server-side (never returns).
        // If we reach here, it means there was a validation error.
        if (!result.ok) {
          setError(result.error)
          setLoading(false)
          return
        }
      } else {
        const result = await signIn({ email, password })
        // On success, signIn calls redirect("/") server-side (never returns).
        if (!result.ok) {
          setError(result.error)
          setLoading(false)
          return
        }
      }
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

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

      <form onSubmit={handleSubmit} className="space-y-4">
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
              disabled={loading}
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
            disabled={loading}
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
            disabled={loading}
          />
        </div>

        {error && (
          <p className="text-sm text-destructive-foreground bg-destructive/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading
            ? isSignUp
              ? "Creating account..."
              : "Signing in..."
            : isSignUp
              ? "Create account"
              : "Sign in"}
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
