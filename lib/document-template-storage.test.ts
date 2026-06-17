import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
import {
  DOCUMENT_TEMPLATE_BUCKET,
  documentTemplateObjectPath,
  documentTemplateProxyPath,
  parseDocumentTemplateProxyPath,
  resolveDocumentTemplateSource,
  validateDocumentTemplatePdfFile,
} from "@/lib/document-template-storage"

describe("document template storage paths", () => {
  it("builds stable bucket object and proxy paths from a template id", () => {
    expect(DOCUMENT_TEMPLATE_BUCKET).toBe("document-templates")
    expect(documentTemplateObjectPath("wniosek-nowy")).toBe("templates/wniosek-nowy.pdf")
    expect(documentTemplateProxyPath("wniosek-nowy")).toBe("/api/documents/templates/wniosek-nowy/pdf")
  })

  it("encodes proxy path segments and decodes them when parsing", () => {
    expect(documentTemplateProxyPath("wniosek nowy")).toBe("/api/documents/templates/wniosek%20nowy/pdf")
    expect(parseDocumentTemplateProxyPath("/api/documents/templates/wniosek%20nowy/pdf")).toBe("wniosek nowy")
  })

  it("returns null for non-template proxy paths", () => {
    expect(parseDocumentTemplateProxyPath("/forms/wniosek.pdf")).toBeNull()
    expect(parseDocumentTemplateProxyPath("https://example.com/file.pdf")).toBeNull()
  })
})

describe("validateDocumentTemplatePdfFile", () => {
  it("accepts a PDF by MIME type", () => {
    expect(validateDocumentTemplatePdfFile({ name: "x", type: "application/pdf", size: 1024 })).toEqual([])
  })

  it("accepts a PDF by extension when MIME type is missing", () => {
    expect(validateDocumentTemplatePdfFile({ name: "x.PDF", type: "", size: 1024 })).toEqual([])
  })

  it("rejects missing, non-PDF, empty, and oversized files", () => {
    expect(validateDocumentTemplatePdfFile(null)).toContain("Brak pliku PDF")
    expect(validateDocumentTemplatePdfFile({ name: "x.txt", type: "text/plain", size: 1024 })).toContain("Plik musi byc PDF")
    expect(validateDocumentTemplatePdfFile({ name: "x.pdf", type: "application/pdf", size: 0 })).toContain("Plik PDF jest pusty")
    expect(validateDocumentTemplatePdfFile({ name: "x.pdf", type: "application/pdf", size: 26 * 1024 * 1024 })).toContain("Plik PDF jest za duzy (max 25MB)")
  })
})

describe("resolveDocumentTemplateSource", () => {
  it("detects local public form paths", () => {
    expect(resolveDocumentTemplateSource("/forms/x.pdf")).toEqual({
      kind: "local",
      publicPath: "forms/x.pdf",
    })
  })

  it("detects Supabase-backed template proxy paths", () => {
    expect(resolveDocumentTemplateSource("/api/documents/templates/wniosek/pdf")).toEqual({
      kind: "storage",
      templateId: "wniosek",
    })
  })
})
