import { describe, it, expect } from "vitest"
import { pixelToPoint, pointToPixel } from "@/lib/pdf-coords"

const dims = { pageWidthPt: 595, pageHeightPt: 842, imageWidthPx: 1190, imageHeightPx: 1684 }

describe("pixelToPoint", () => {
  it("maps top-left pixel to top of page in points", () => {
    const pt = pixelToPoint(0, 0, dims)
    expect(pt.x).toBeCloseTo(0, 1)
    expect(pt.y).toBeCloseTo(842, 1) // góra obrazu = max Y w punktach
  })

  it("maps a mid pixel correctly (Y flipped)", () => {
    const pt = pixelToPoint(595, 842, dims) // środek przy skali 2x
    expect(pt.x).toBeCloseTo(297.5, 1)
    expect(pt.y).toBeCloseTo(421, 1)
  })
})

describe("pointToPixel", () => {
  it("is the inverse of pixelToPoint", () => {
    const px = pointToPixel(235, 125, dims)
    const back = pixelToPoint(px.x, px.y, dims)
    expect(back.x).toBeCloseTo(235, 1)
    expect(back.y).toBeCloseTo(125, 1)
  })
})
