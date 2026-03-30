"use client"

/**
 * <HebrewDate> — renders a Hebrew calendar date string.
 * Computed entirely on the client via useEffect to prevent
 * SSR/browser timezone mismatch hydration errors.
 */

import { useState, useEffect } from "react"
import { toHebrewDate } from "@/lib/hebrew-date"

interface HebrewDateProps {
  date: Date | string
  /**
   * "full"  → "ד׳ אדר ב׳ תשפ״ה"
   * "short" → "ד׳ אדר ב׳"  (default)
   * "day"   → just the Hebrew day letter, e.g. "ד׳"
   */
  format?: "full" | "short" | "day"
  className?: string
}

export function HebrewDate({ date, format = "short", className }: HebrewDateProps) {
  const [text, setText] = useState<string>("")

  useEffect(() => {
    const d = typeof date === "string" ? new Date(date) : date
    const h = toHebrewDate(d)
    setText(
      format === "full" ? h.full :
      format === "day"  ? h.dayStr :
      h.short
    )
  }, [date, format])

  // Server renders empty string; client populates after mount.
  // suppressHydrationWarning handles the "" → Hebrew text swap.
  return (
    <span
      dir="rtl"
      lang="he"
      className={className}
      suppressHydrationWarning
    >
      {text}
    </span>
  )
}
