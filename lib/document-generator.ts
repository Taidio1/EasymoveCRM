import fs from "fs/promises"
import path from "path"
import { PDFDocument, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib"
import fontkit from "@pdf-lib/fontkit"
import type { Client } from "@/lib/superbase"
import type { DocumentMapping, FieldMapping } from "@/lib/document-types"
import { resolveField } from "@/lib/document-resolver"

function truncateToWidth(text: string, maxWidth: number, font: PDFFont, fontSize: number): string {
  if (font.widthOfTextAtSize(text, fontSize) <= maxWidth) return text
  let truncated = text
  while (truncated.length > 0 && font.widthOfTextAtSize(truncated + "…", fontSize) > maxWidth) {
    truncated = truncated.slice(0, -1)
  }
  return truncated + "…"
}

function drawGridField(page: PDFPage, text: string, field: FieldMapping, font: PDFFont): void {
  const boxWidth = field.boxWidth ?? 14.2
  const maxCharsPerRow = field.maxCharsPerRow ?? 35
  const rowHeight = field.rowHeight ?? 25
  const words = text.toUpperCase().split(" ")

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
      page.drawText(char, {
        x: field.x + currentCol * boxWidth,
        y: field.y - currentRow * rowHeight,
        size: field.fontSize,
        font,
      })
      currentCol++
    }

    if (currentCol < maxCharsPerRow) currentCol++
  }
}

export async function generateDocument(templateId: string, client: Client): Promise<Uint8Array> {
  const mappingPath = path.join(process.cwd(), "mappings", `${templateId}.json`)
  const mappingRaw = await fs.readFile(mappingPath, "utf-8")
  const mapping: DocumentMapping = JSON.parse(mappingRaw)

  const pdfRelative = mapping.pdfPath.startsWith("/") ? mapping.pdfPath.slice(1) : mapping.pdfPath
  const pdfPath = path.join(process.cwd(), "public", pdfRelative)
  const pdfBytes = await fs.readFile(pdfPath)

  const fontPath = path.join(process.cwd(), "public", "fonts", "NotoSans-Regular.ttf")
  const fontBytes = await fs.readFile(fontPath)

  const pdfDoc = await PDFDocument.load(pdfBytes)
  pdfDoc.registerFontkit(fontkit)

  let font: PDFFont
  try {
    font = await pdfDoc.embedFont(fontBytes)
  } catch {
    console.warn("NotoSans load failed, falling back to Helvetica (Polish diacritics may not render)")
    font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  }

  const pages = pdfDoc.getPages()

  for (const field of mapping.fields) {
    const value = resolveField(client, field.dataKey)
    if (!value) continue

    const page = pages[field.page - 1]
    if (!page) continue

    if (field.type === "grid") {
      drawGridField(page, value, field, font)
    } else {
      const text = field.maxWidth ? truncateToWidth(value, field.maxWidth, font, field.fontSize) : value
      page.drawText(text, { x: field.x, y: field.y, size: field.fontSize, font })
    }
  }

  return pdfDoc.save()
}
