import { describe, expect, it } from "vitest"
import { documentTemplateIdFromName } from "@/lib/document-template-id"

describe("documentTemplateIdFromName", () => {
  it("creates a lowercase kebab-case id from a template name", () => {
    expect(documentTemplateIdFromName("Wniosek nowy")).toBe("wniosek-nowy")
  })

  it("normalizes Polish characters and repeated separators", () => {
    expect(documentTemplateIdFromName("Załącznik nr 1: Żółć i Świadczenia")).toBe("zalacznik-nr-1-zolc-i-swiadczenia")
  })

  it("falls back to document-template when the name has no letters or digits", () => {
    expect(documentTemplateIdFromName(" !!! ")).toBe("document-template")
  })
})
