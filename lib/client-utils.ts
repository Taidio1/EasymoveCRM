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
