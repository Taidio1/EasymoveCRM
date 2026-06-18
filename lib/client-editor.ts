import type { Client } from "@/lib/superbase"

// Zwraca podzbiór `next` zawierający tylko pola różniące się od `original`.
export function diffClientPatch(original: Client, next: Partial<Client>): Partial<Client> {
  const patch: Partial<Client> = {}
  for (const key of Object.keys(next) as Array<keyof Client>) {
    if (next[key] !== original[key]) {
      patch[key] = next[key] as any
    }
  }
  return patch
}
