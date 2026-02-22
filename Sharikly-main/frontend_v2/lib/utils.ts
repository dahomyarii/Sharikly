import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Safe date format (no dateStyle/timeStyle) for browsers that reject those options */
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
