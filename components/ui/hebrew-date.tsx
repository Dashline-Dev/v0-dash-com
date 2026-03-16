/**
 * <HebrewDate> — renders both an English date string and its Hebrew equivalent.
 *
 * Usage:
 *   <HebrewDate date={new Date(event.start_time)} format="short" />
 *   // → "Mar 5  ד׳ אדר ב׳"
 */

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
  const d = typeof date === "string" ? new Date(date) : date
  const h = toHebrewDate(d)

  const text =
    format === "full"  ? h.full  :
    format === "day"   ? h.dayStr :
    h.short

  return (
    <span
      dir="rtl"
      lang="he"
      className={className}
      title={h.full}
    >
      {text}
    </span>
  )
}
