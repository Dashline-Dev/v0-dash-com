/**
 * Hebrew calendar utilities — powered by @hebcal/hdate
 * https://github.com/hebcal/hdate-js
 *
 * HDate accepts a JS Date directly and handles all conversion, leap-year logic,
 * and Hebrew letter (gematriya) rendering internally.
 */
import { HDate } from "@hebcal/hdate"

export interface HebrewDateParts {
  year: number
  month: number
  day: number
  /** Hebrew month name in Hebrew script, e.g. "אדר ב׳" */
  monthName: string
  /** Day as Hebrew letters, e.g. "ז׳" */
  dayStr: string
  /** Year as Hebrew letters, e.g. "תשפ״ה" */
  yearStr: string
  /** Full formatted string without nikud: "ז׳ אדר ב׳ תשפ״ה" */
  full: string
  /** Short: day + month only, no year, no nikud: "ז׳ אדר ב׳" */
  short: string
}

// Hebrew month display names (no nikud), keyed by HDate month number (1=Nisan, 7=Tishrei)
const MONTH_NAMES: Record<number, string> = {
  1: "ניסן", 2: "אייר", 3: "סיון", 4: "תמוז", 5: "אב", 6: "אלול",
  7: "תשרי", 8: "חשון", 9: "כסלו", 10: "טבת", 11: "שבט",
  12: "אדר", 13: "אדר א׳", 14: "אדר ב׳",
}

/**
 * Convert a JavaScript Date to its Hebrew calendar equivalent.
 * Pass `new Date(year, month - 1, day)` for pure date lookups (no time offset).
 */
export function toHebrewDate(date: Date): HebrewDateParts {
  const hd = new HDate(date)

  // renderGematriya(suppressNikud=true) → "ז׳ אדר ב׳ תשפ״ה"
  // renderGematriya(suppressNikud=true, suppressYear=true) → "ז׳ אדר ב׳"
  const full  = hd.renderGematriya(true)        // "ז׳ אדר ב׳ תשפ״ה"
  const short = hd.renderGematriya(true, true)  // "ז׳ אדר ב׳"

  // Day is always the first token
  const dayStr  = full.split(" ")[0] ?? String(hd.getDate())
  // Year is always the last token of the full string
  const yearStr = full.split(" ").pop() ?? ""

  const month     = hd.getMonth()
  const monthName = MONTH_NAMES[month] ?? hd.getMonthName()

  return {
    year:  hd.getFullYear(),
    month,
    day:   hd.getDate(),
    monthName,
    dayStr,
    yearStr,
    full,
    short,
  }
}

/** Just the Hebrew day number string for a date, e.g. "ז׳" */
export function hebrewDayStr(date: Date): string {
  return toHebrewDate(date).dayStr
}

/** "Month Year" string for calendar headers, e.g. "אדר ב׳ תשפ״ה" */
export function hebrewMonthYearStr(date: Date): string {
  const { monthName, yearStr } = toHebrewDate(date)
  return `${monthName} ${yearStr}`
}
