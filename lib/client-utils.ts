const COUNTRY_FLAGS: Array<[RegExp, string]> = [
  [/polsk/i, "🇵🇱"],
  [/ukrai/i, "🇺🇦"],
  [/biało|bialor/i, "🇧🇾"],
  [/gruz/i, "🇬🇪"],
  [/mołd|moldow/i, "🇲🇩"],
  [/rosj|rossi/i, "🇷🇺"],
  [/kazach/i, "🇰🇿"],
  [/uzbek/i, "🇺🇿"],
  [/indie|india/i, "🇮🇳"],
]

export function getFlagEmoji(country: string | null | undefined): string {
  if (!country) return "🏳️"
  for (const [pattern, flag] of COUNTRY_FLAGS) {
    if (pattern.test(country)) return flag
  }
  return "🌍"
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "??"
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)
}

export const CSV_BOM = "﻿"

export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return ""
  const str = String(value)
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function isYes(value: unknown): boolean {
  if (value === true || value === "true") return true
  if (typeof value === "string" && value.toLowerCase() === "yes") return true
  if (value === 1 || value === "1") return true
  return false
}

export function emptyToNull(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

export function toDateInputValue(value: string | null | undefined): string {
  if (!value) return ""
  // ISO timestamp lub data — bierzemy pierwsze 10 znaków yyyy-MM-dd
  return value.slice(0, 10)
}
