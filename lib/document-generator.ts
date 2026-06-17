import fs from "fs/promises"
import path from "path"
import { PDFDocument, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib"
import fontkit from "@pdf-lib/fontkit"
import type { Client } from "@/lib/superbase"
import type { DocumentMapping, FieldMapping } from "@/lib/document-types"
import { resolveField } from "@/lib/document-resolver"
import { layoutGrid } from "@/lib/pdf-coords"
import { getMapping } from "@/lib/document-store"

function truncateToWidth(text: string, maxWidth: number, font: PDFFont, fontSize: number): string {
  if (font.widthOfTextAtSize(text, fontSize) <= maxWidth) return text
  let truncated = text
  while (truncated.length > 0 && font.widthOfTextAtSize(truncated + "…", fontSize) > maxWidth) {
    truncated = truncated.slice(0, -1)
  }
  return truncated + "…"
}

function drawGridField(page: PDFPage, text: string, field: FieldMapping, font: PDFFont): void {
  for (const g of layoutGrid(text, field)) {
    page.drawText(g.char, { x: g.x, y: g.y, size: field.fontSize, font })
  }
}

export async function generateDocument(templateId: string, client: Client): Promise<Uint8Array> {
  const mapping: DocumentMapping = await getMapping(templateId)

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
