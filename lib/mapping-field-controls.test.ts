import { describe, expect, it } from "vitest"
import {
  getEditableMappingFieldControls,
  normalizeMappingFieldToGrid,
  normalizeMappingFieldsToGrid,
} from "@/lib/mapping-field-controls"
import type { FieldMapping } from "@/lib/document-types"

const baseField: FieldMapping = {
  page: 1,
  x: 10,
  y: 20,
  dataKey: "Name",
  fontSize: 11,
}

describe("getEditableMappingFieldControls", () => {
  it("shows grid controls for every mapped field", () => {
    expect(getEditableMappingFieldControls({ ...baseField, type: "grid" })).toEqual([
      "x",
      "y",
      "fontSize",
      "boxWidth",
      "maxCharsPerRow",
      "rowHeight",
    ])
    expect(getEditableMappingFieldControls({ ...baseField, type: "text" })).toEqual([
      "x",
      "y",
      "fontSize",
      "boxWidth",
      "maxCharsPerRow",
      "rowHeight",
    ])
    expect(getEditableMappingFieldControls(baseField)).toEqual([
      "x",
      "y",
      "fontSize",
      "boxWidth",
      "maxCharsPerRow",
      "rowHeight",
    ])
  })
})

describe("normalizeMappingFieldToGrid", () => {
  it("converts text fields to grid fields with editable grid defaults", () => {
    expect(normalizeMappingFieldToGrid({ ...baseField, type: "text", maxWidth: 120 })).toEqual({
      ...baseField,
      type: "grid",
      boxWidth: 15.7,
      maxCharsPerRow: 23,
      rowHeight: 25,
    })
  })

  it("preserves existing grid geometry", () => {
    expect(normalizeMappingFieldToGrid({
      ...baseField,
      type: "grid",
      boxWidth: 10,
      maxCharsPerRow: 12,
      rowHeight: 18,
    })).toEqual({
      ...baseField,
      type: "grid",
      boxWidth: 10,
      maxCharsPerRow: 12,
      rowHeight: 18,
    })
  })

  it("normalizes every field in a mapping field list", () => {
    expect(normalizeMappingFieldsToGrid([
      { ...baseField, dataKey: "Name", type: "text" },
      { ...baseField, dataKey: "Email" },
    ])).toEqual([
      { ...baseField, dataKey: "Name", type: "grid", boxWidth: 15.7, maxCharsPerRow: 23, rowHeight: 25 },
      { ...baseField, dataKey: "Email", type: "grid", boxWidth: 15.7, maxCharsPerRow: 23, rowHeight: 25 },
    ])
  })
})
