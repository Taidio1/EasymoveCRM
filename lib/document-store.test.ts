import { describe, it, expect, vi } from "vitest"

const supabaseAdmin = vi.hoisted(() => ({ current: {} as Record<string, unknown> }))

vi.mock("@/lib/supabase-admin", () => ({ getSupabaseAdmin: () => supabaseAdmin.current }))

import {
  deleteMapping,
  normalizeDocumentMapping,
  normalizeDocumentTemplateInput,
  validateDocumentTemplateInput,
  validateMapping,
} from "@/lib/document-store"

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

  it("normalizes text fields to grid fields before persistence/generation", () => {
    expect(normalizeDocumentMapping(valid).fields).toEqual([
      {
        page: 1,
        x: 10,
        y: 20,
        dataKey: "Name",
        fontSize: 10,
        type: "grid",
        boxWidth: 15.7,
        maxCharsPerRow: 23,
        rowHeight: 25,
      },
    ])
  })
})

describe("deleteMapping", () => {
  it("deletes a mapping row by id", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const deleteRows = vi.fn(() => ({ eq }))
    const from = vi.fn(() => ({ delete: deleteRows }))
    supabaseAdmin.current = { from }

    await deleteMapping("wniosek-test")

    expect(from).toHaveBeenCalledWith("document_mappings")
    expect(deleteRows).toHaveBeenCalled()
    expect(eq).toHaveBeenCalledWith("id", "wniosek-test")
  })

  it("raises a clear error when deleting a mapping fails", async () => {
    const eq = vi.fn().mockResolvedValue({ error: { message: "permission denied" } })
    const deleteRows = vi.fn(() => ({ eq }))
    supabaseAdmin.current = { from: vi.fn(() => ({ delete: deleteRows })) }

    await expect(deleteMapping("wniosek-test")).rejects.toThrow("Usuniecie mappingu nie powiodlo sie: permission denied")
  })
})

describe("document template input validation", () => {
  it("accepts and normalizes a document template input", () => {
    expect(normalizeDocumentTemplateInput({
      id: " wniosek-test ",
      name: " Testowy wniosek ",
      pdfPath: " /forms/test.pdf ",
    })).toEqual({
      id: "wniosek-test",
      name: "Testowy wniosek",
      pdfPath: "/forms/test.pdf",
    })
  })

  it("rejects missing required template fields", () => {
    expect(validateDocumentTemplateInput({ id: "", name: "", pdfPath: "" })).toEqual([
      "Brak id",
      "Brak name",
      "Brak pdfPath",
    ])
  })
})
