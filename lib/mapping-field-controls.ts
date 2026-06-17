import type { FieldMapping } from "@/lib/document-types"

export const DEFAULT_GRID_BOX_WIDTH = 15.7
export const DEFAULT_GRID_MAX_CHARS = 23
export const DEFAULT_GRID_ROW_HEIGHT = 25

export type EditableMappingFieldControl =
  | "x"
  | "y"
  | "fontSize"
  | "maxWidth"
  | "boxWidth"
  | "maxCharsPerRow"
  | "rowHeight"

export function getEditableMappingFieldControls(field: FieldMapping): EditableMappingFieldControl[] {
  void field
  const controls: EditableMappingFieldControl[] = ["x", "y", "fontSize"]
  return [...controls, "boxWidth", "maxCharsPerRow", "rowHeight"]
}

export function normalizeMappingFieldToGrid(field: FieldMapping): FieldMapping {
  const { maxWidth: _maxWidth, ...withoutTextOnlyGeometry } = field
  return {
    ...withoutTextOnlyGeometry,
    type: "grid",
    boxWidth: field.boxWidth ?? DEFAULT_GRID_BOX_WIDTH,
    maxCharsPerRow: field.maxCharsPerRow ?? DEFAULT_GRID_MAX_CHARS,
    rowHeight: field.rowHeight ?? DEFAULT_GRID_ROW_HEIGHT,
  }
}

export function normalizeMappingFieldsToGrid(fields: FieldMapping[]): FieldMapping[] {
  return fields.map(normalizeMappingFieldToGrid)
}
