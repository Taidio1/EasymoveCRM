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

export interface GridField {
  x: number
  y: number
  boxWidth?: number
  maxCharsPerRow?: number
  rowHeight?: number
}

export interface Glyph {
  char: string
  x: number
  y: number
}

export function layoutGrid(text: string, field: GridField): Glyph[] {
  const boxWidth = field.boxWidth ?? 14.2
  const maxCharsPerRow = field.maxCharsPerRow ?? 35
  const rowHeight = field.rowHeight ?? 25
  const words = text.toUpperCase().split(" ")

  const glyphs: Glyph[] = []
  let currentRow = 0
  let currentCol = 0

  for (const word of words) {
    if (currentCol + word.length > maxCharsPerRow && currentCol > 0) {
      currentRow++
      currentCol = 0
    }
    for (const char of word) {
      if (currentCol >= maxCharsPerRow) {
        currentRow++
        currentCol = 0
      }
      glyphs.push({
        char,
        x: field.x + currentCol * boxWidth,
        y: field.y - currentRow * rowHeight,
      })
      currentCol++
    }
    if (currentCol < maxCharsPerRow) currentCol++
  }
  return glyphs
}
