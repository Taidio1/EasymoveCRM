import fs from "fs/promises"
import path from "path"
import { PDFDocument, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib"
import fontkit from "@pdf-lib/fontkit"
import type { Client } from "@/lib/superbase"
import type { DocumentMapping, FieldMapping } from "@/lib/document-types"
import { layoutGrid } from "@/lib/pdf-coords"
import { getMapping } from "@/lib/document-store"
import { fieldValue, fieldGeometry } from "@/lib/document-overrides"
import type { FieldOverride } from "@/lib/document-types"
import { downloadDocumentTemplatePdf, resolveDocumentTemplateSource } from "@/lib/document-template-storage"

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

export async function loadDocumentTemplatePdfBytes(pdfPath: string): Promise<Uint8Array> {
  const source = resolveDocumentTemplateSource(pdfPath)
  if (source.kind === "storage") {
    return downloadDocumentTemplatePdf(source.templateId)
  }

  const pdfPathOnDisk = path.join(process.cwd(), "public", source.publicPath)
  return fs.readFile(pdfPathOnDisk)
}

export async function generateDocument(
  templateId: string,
  client: Client | null,
  overrides?: FieldOverride[],
): Promise<Uint8Array> {
  const mapping: DocumentMapping = await getMapping(templateId)

  const pdfBytes = await loadDocumentTemplatePdfBytes(mapping.pdfPath)

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

  mapping.fields.forEach((field, i) => {
    const ov = overrides?.[i]
    const value = fieldValue(field, client, ov)
    if (!value) return

    const page = pages[field.page - 1]
    if (!page) return

    const geom = fieldGeometry(field, ov)
    const merged: FieldMapping = { ...field, x: geom.x, y: geom.y, fontSize: geom.fontSize }

    if (field.type === "grid") {
      drawGridField(page, value, merged, font)
    } else {
      const text = merged.maxWidth ? truncateToWidth(value, merged.maxWidth, font, geom.fontSize) : value
      page.drawText(text, { x: geom.x, y: geom.y, size: geom.fontSize, font })
    }
  })

  return pdfDoc.save()
}
