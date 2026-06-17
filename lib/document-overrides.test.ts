import { describe, it, expect } from "vitest"
import { seedValues, fieldValue, fieldGeometry, buildOverrides } from "@/lib/document-overrides"
import type { FieldMapping } from "@/lib/document-types"
import type { Client } from "@/lib/superbase"

const client = { Name: "Jan Kowalski", CelPobytu: "Praca" } as unknown as Client

const nameField: FieldMapping = { page: 1, x: 10, y: 20, dataKey: "Name", fontSize: 11 }
const upperField: FieldMapping = { page: 1, x: 30, y: 40, dataKey: "Name|uppercase", fontSize: 9 }

describe("seedValues", () => {
  it("seeds from client via resolveField", () => {
    expect(seedValues(client, [nameField, upperField])).toEqual(["Jan Kowalski", "JAN KOWALSKI"])
  })
  it("seeds empty strings when client is null (manual entry)", () => {
    expect(seedValues(null, [nameField, upperField])).toEqual(["", ""])
  })
})

describe("fieldValue", () => {
  it("override value wins over client (no transform reapplied)", () => {
    expect(fieldValue(upperField, client, { value: "anna nowak" })).toBe("anna nowak")
  })
  it("empty override value is respected (renders nothing)", () => {
    expect(fieldValue(nameField, client, { value: "" })).toBe("")
  })
  it("falls back to resolveField when no override and client present", () => {
    expect(fieldValue(nameField, client, undefined)).toBe("Jan Kowalski")
  })
  it("returns empty string when no override and no client", () => {
    expect(fieldValue(nameField, null, undefined)).toBe("")
  })
})

describe("fieldGeometry", () => {
  it("uses override coords/fontSize when present", () => {
    expect(fieldGeometry(nameField, { value: "x", x: 99, y: 88, fontSize: 7 }))
      .toEqual({ x: 99, y: 88, fontSize: 7 })
  })
  it("falls back to mapping geometry when override absent", () => {
    expect(fieldGeometry(nameField, undefined)).toEqual({ x: 10, y: 20, fontSize: 11 })
  })
  it("falls back per-property when override omits a coord", () => {
    expect(fieldGeometry(nameField, { value: "x", x: 99 })).toEqual({ x: 99, y: 20, fontSize: 11 })
  })
})

describe("buildOverrides", () => {
  it("maps values and merges sparse position overrides by index", () => {
    const result = buildOverrides(["A", "B", "C"], { 1: { x: 5, y: 6 }, 2: { fontSize: 8 } })
    expect(result).toEqual([
      { value: "A" },
      { value: "B", x: 5, y: 6 },
      { value: "C", fontSize: 8 },
    ])
  })
})
