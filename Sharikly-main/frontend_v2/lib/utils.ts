import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Safe date format (no dateStyle/timeStyle) for browsers that reject those options.
 * Returns empty string for null/undefined/NaN; invalid or unsupported dates fall back to ISO slice (YYYY-MM-DD HH:mm). */
export function safeFormatDate(date: Date | string | number | null | undefined): string {
  if (date == null) return ""
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ""
  try {
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return d.toISOString().slice(0, 16).replace("T", " ")
  }
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

/** Local calendar date as YYYY-MM-DD (avoids UTC shift from toISOString). */
export function formatLocalYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** Parse YYYY-MM-DD into local midnight. Returns null if invalid. */
export function parseLocalYMD(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const d = Number(m[3])
  const date = new Date(y, mo, d)
  if (date.getFullYear() !== y || date.getMonth() !== mo || date.getDate() !== d) return null
  return date
}

/**
 * Inclusive rental days: same calendar start and end = 1 day.
 * Dates are normalized to local date-only before counting.
 */
export function countInclusiveRentalDays(from: Date, to: Date): number {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate())
  const diff = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY)
  return Math.max(1, diff + 1)
}
