import { describe, expect, it } from "vitest"
import { clampPdfPage, nextPdfPage, previousPdfPage } from "@/lib/pdf-page-navigation"

describe("pdf page navigation", () => {
  it("clamps page number to the available PDF range", () => {
    expect(clampPdfPage(0, 4)).toBe(1)
    expect(clampPdfPage(2, 4)).toBe(2)
    expect(clampPdfPage(99, 4)).toBe(4)
  })

  it("keeps navigation inside the available PDF range", () => {
    expect(previousPdfPage(1, 4)).toBe(1)
    expect(previousPdfPage(3, 4)).toBe(2)
    expect(nextPdfPage(3, 4)).toBe(4)
    expect(nextPdfPage(4, 4)).toBe(4)
  })
})
