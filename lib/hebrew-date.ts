/**
 * Pure-JS Hebrew calendar conversion — works in all environments (Node SSR + all browsers)
 * without relying on Intl locale data for the Hebrew calendar.
 *
 * Algorithm: Dershowitz & Reingold, "Calendrical Calculations"
 */

// ── Gematria tables ──────────────────────────────────────────────────────────

const UNITS    = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"]
const TENS     = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"]
const HUNDREDS = ["", "ק", "ר", "ש", "ת"]

export const HEBREW_MONTH_NAMES = [
  "תשרי", "חשון", "כסלו", "טבת", "שבט", "אדר",
  "ניסן", "אייר", "סיון", "תמוז", "אב", "אלול",
  "אדר א׳", "אדר ב׳",
]

/**
 * Convert an integer (1–9999) to Hebrew letter notation (גימטריה).
 * Handles geresh / gershayim and avoids sacred 2-letter combinations for 15 & 16.
 */
export function numToHebrew(n: number): string {
  if (n === 15) return "ט״ו"
  if (n === 16) return "ט״ז"

  let result = ""
  let rem = n

  const h = Math.floor(rem / 100)
  if (h > 0 && h <= 4) { result += HUNDREDS[h]; rem -= h * 100 }
  const t = Math.floor(rem / 10)
  if (t > 0) { result += TENS[t]; rem -= t * 10 }
  if (rem > 0) result += UNITS[rem]

  // Add punctuation
  if (result.length > 1) {
    result = result.slice(0, -1) + "״" + result.slice(-1)
  } else if (result.length === 1) {
    result += "׳"
  }
  return result
}

// ── Julian Day Number ────────────────────────────────────────────────────────

function toJD(y: number, m: number, d: number): number {
  const a  = Math.floor((14 - m) / 12)
  const yr = y + 4800 - a
  const mo = m + 12 * a - 3
  return (
    d +
    Math.floor((153 * mo + 2) / 5) +
    365 * yr +
    Math.floor(yr / 4) -
    Math.floor(yr / 100) +
    Math.floor(yr / 400) -
    32045
  )
}

// ── Hebrew year helpers ──────────────────────────────────────────────────────

function hebrewElapsed(year: number): number {
  const months = Math.floor((235 * year - 234) / 19)
  const parts  = 12084 + 13753 * months
  let day = months * 29 + Math.floor(parts / 25920)
  if ((3 * (day + 1)) % 7 < 3) day++
  return day
}

function hebrewYearDays(year: number): number {
  return hebrewElapsed(year + 1) - hebrewElapsed(year)
}

function isLeap(year: number): boolean {
  return (7 * year + 1) % 19 < 7
}

function monthDays(year: number, month: number): number {
  if ([1, 3, 5, 7, 11].includes(month)) return 30
  if (month === 6)  return isLeap(year) ? 30 : 29
  if (month === 8)  return hebrewYearDays(year) % 10 === 5 ? 30 : 29
  if (month === 9)  return hebrewYearDays(year) % 10 === 3 ? 29 : 30
  return 29
}

// ── Public API ───────────────────────────────────────────────────────────────

export interface HebrewDateParts {
  year: number
  month: number
  day: number
  monthName: string
  /** e.g. "ה׳ תשפ״ה" */
  yearStr: string
  /** e.g. "ז׳" */
  dayStr: string
  /** Full formatted string, e.g. "ז׳ אדר ב׳ תשפ״ה" */
  full: string
  /** Short: day + month only, e.g. "ז׳ אדר ב׳" */
  short: string
}

/**
 * Convert a JavaScript Date (Gregorian) to its Hebrew calendar equivalent.
 * Uses local midnight — pass `new Date(year, month-1, day)` for pure date lookups.
 */
export function toHebrewDate(date: Date): HebrewDateParts {
  const EPOCH = 347997 // JDN of 1 Tishri year 1
  const jd    = toJD(date.getFullYear(), date.getMonth() + 1, date.getDate())
  const delta = jd - EPOCH

  // Estimate year, then walk ±1 to correct
  let year = Math.floor((delta * 98496) / 35975351) + 1
  while (hebrewElapsed(year) > delta) year--
  while (hebrewElapsed(year + 1) <= delta) year++

  const leap   = isLeap(year)
  const months = leap ? 13 : 12
  let dayInYear = delta - hebrewElapsed(year) + 1

  let month = 1
  while (month < months && dayInYear > monthDays(year, month)) {
    dayInYear -= monthDays(year, month)
    month++
  }

  // Map internal month index → display name index
  // Hebrew year starts at Tishri (internal month 1), which is display index 0
  const leapMap   = [0, 1, 2, 3, 4, 5, 12, 6, 7, 8, 9, 10, 11, 13]
  const regularMap= [0, 1, 2, 3, 4, 5,  6, 7, 8, 9, 10, 11]
  const namedIdx  = (leap ? leapMap : regularMap)[month - 1] ?? month - 1

  const monthName = HEBREW_MONTH_NAMES[namedIdx] ?? ""
  const yearMod   = year % 1000 === 0 ? 1000 : year % 1000
  const dayStr    = numToHebrew(dayInYear)
  const yearStr   = numToHebrew(yearMod)

  return {
    year,
    month,
    day: dayInYear,
    monthName,
    dayStr,
    yearStr,
    full:  `${dayStr} ${monthName} ${yearStr}`,
    short: `${dayStr} ${monthName}`,
  }
}

/** Convenience: just the Hebrew day number string for a date */
export function hebrewDayStr(date: Date): string {
  return toHebrewDate(date).dayStr
}

/** Convenience: "Month Year" string for calendar headers */
export function hebrewMonthYearStr(date: Date): string {
  const { monthName, yearStr } = toHebrewDate(date)
  return `${monthName} ${yearStr}`
}
