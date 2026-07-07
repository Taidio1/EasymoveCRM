export const EDITABLE_CLIENT_FIELDS = [
  "Name", "Phone", "Adres", "Birthday", "KrajPoch", "CelPobytu",
] as const

export type EditableField = (typeof EDITABLE_CLIENT_FIELDS)[number]

export function pickEditableFields(
  input: Record<string, unknown>,
): Partial<Record<EditableField, unknown>> {
  const out: Partial<Record<EditableField, unknown>> = {}
  for (const key of EDITABLE_CLIENT_FIELDS) {
    if (key in input) out[key] = input[key]
  }
  return out
}
