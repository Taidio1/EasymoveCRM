export interface PageDims {
  pageWidthPt: number
  pageHeightPt: number
  imageWidthPx: number
  imageHeightPx: number
}

export function pixelToPoint(px: number, py: number, d: PageDims): { x: number; y: number } {
  const scaleX = d.pageWidthPt / d.imageWidthPx
  const scaleY = d.pageHeightPt / d.imageHeightPx
  return {
    x: Math.round(px * scaleX * 10) / 10,
    y: Math.round((d.imageHeightPx - py) * scaleY * 10) / 10,
  }
}

export function pointToPixel(x: number, y: number, d: PageDims): { x: number; y: number } {
  const scaleX = d.imageWidthPx / d.pageWidthPt
  const scaleY = d.imageHeightPx / d.pageHeightPt
  return {
    x: x * scaleX,
    y: (d.pageHeightPt - y) * scaleY,
  }
}
