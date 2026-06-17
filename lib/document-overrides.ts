import type { Client } from "@/lib/superbase"
import type { FieldMapping, FieldOverride } from "@/lib/document-types"
import { resolveField } from "@/lib/document-resolver"

export type { FieldOverride }

export function seedValues(client: Client | null, fields: FieldMapping[]): string[] {
  return fields.map(f => (client ? resolveField(client, f.dataKey) : ""))
}

export function fieldValue(
  field: FieldMapping,
  client: Client | null,
  override: FieldOverride | undefined,
): string {
  if (override) return override.value
  return client ? resolveField(client, field.dataKey) : ""
}

export function fieldGeometry(
  field: FieldMapping,
  override: FieldOverride | undefined,
): { x: number; y: number; fontSize: number } {
  return {
    x: override?.x ?? field.x,
    y: override?.y ?? field.y,
    fontSize: override?.fontSize ?? field.fontSize,
  }
}

export function buildOverrides(
  values: string[],
  pos: Record<number, { x?: number; y?: number; fontSize?: number }>,
): FieldOverride[] {
  return values.map((value, i) => {
    const p = pos[i]
    const ov: FieldOverride = { value }
    if (p?.x != null) ov.x = p.x
    if (p?.y != null) ov.y = p.y
    if (p?.fontSize != null) ov.fontSize = p.fontSize
    return ov
  })
}
