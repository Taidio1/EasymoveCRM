import type { Client } from "@/lib/superbase"

type Transform =
  | "split_first"
  | "split_last"
  | "uppercase"
  | "year"
  | "month"
  | "day"
  | "address_street"
  | "address_number"
  | "address_zip"
  | "address_city"

function applyTransform(value: string, transform: Transform): string {
  switch (transform) {
    case "split_first":
      return value.split(" ")[0] ?? ""
    case "split_last":
      return value.split(" ").slice(-1)[0] ?? ""
    case "uppercase":
      return value.toUpperCase()
    case "year":
      return value.split("-")[0] ?? ""
    case "month":
      return value.split("-")[1] ?? ""
    case "day":
      return value.split("-")[2] ?? ""
    case "address_street": {
      const m = value.match(/ul\.\s+([^0-9,]+)/i)
      return m ? m[1].trim() : value
    }
    case "address_number": {
      const m = value.match(/ul\.[^0-9]+([0-9]+[^\s,]*)/)
      return m ? m[1].trim() : ""
    }
    case "address_zip": {
      const m = value.match(/\d{2}-\d{3}/)
      return m ? m[0] : ""
    }
    case "address_city": {
      const m = value.match(/\d{2}-\d{3}\s+([^,]+)/)
      return m ? m[1].trim() : ""
    }
    default:
      return value
  }
}

export function resolveField(client: Client, dataKey: string): string {
  const [key, transform] = dataKey.split("|") as [keyof Client, Transform | undefined]
  const raw = client[key]
  if (raw === null || raw === undefined) return ""
  const value = String(raw)
  if (!transform) return value
  return applyTransform(value, transform)
}
