import type { Client } from "@/lib/superbase"

function normalizeSearchValue(value: unknown): string {
  return String(value ?? "").trim().toLowerCase()
}

export function clientDocumentPreviewSearchText(client: Client): string {
  return [
    client.Name,
    client.Email,
    client.Phone,
    client.NumerSprawy,
    client.Firma,
    client.Inspektor,
    client.country_name,
    client.KrajPoch,
  ]
    .map(normalizeSearchValue)
    .filter(Boolean)
    .join(" ")
}

export function filterClientsForDocumentPreview(clients: Client[], query: string): Client[] {
  const normalizedQuery = normalizeSearchValue(query)
  if (!normalizedQuery) return clients
  return clients.filter(client => clientDocumentPreviewSearchText(client).includes(normalizedQuery))
}
