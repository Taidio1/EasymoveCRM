import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/supabase-admin", () => ({ supabaseAdmin: {} }))

import { validateMapping } from "@/lib/document-store"

describe("validateMapping", () => {
  const valid = {
    id: "x", name: "X", pdfPath: "/forms/x.pdf",
    fields: [{ page: 1, x: 10, y: 20, dataKey: "Name", fontSize: 10 }],
  }

  it("accepts a well-formed mapping", () => {
    expect(validateMapping(valid)).toEqual([])
  })

  it("rejects missing pdfPath", () => {
    const bad = { ...valid, pdfPath: "" }
    expect(validateMapping(bad).length).toBeGreaterThan(0)
  })

  it("rejects non-numeric coordinates", () => {
    const bad = { ...valid, fields: [{ page: 1, x: "nope", y: 20, dataKey: "Name", fontSize: 10 }] }
    expect(validateMapping(bad as never).length).toBeGreaterThan(0)
  })

  it("rejects grid field without boxWidth", () => {
    const bad = { ...valid, fields: [{ page: 1, x: 10, y: 20, dataKey: "Name", fontSize: 10, type: "grid" }] }
    expect(validateMapping(bad as never).length).toBeGreaterThan(0)
  })
})
