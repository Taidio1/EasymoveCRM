import "server-only"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const DOCUMENT_TEMPLATE_BUCKET = "document-templates"
export const DOCUMENT_TEMPLATE_PREFIX = "templates"
export const DOCUMENT_TEMPLATE_MAX_BYTES = 25 * 1024 * 1024

type PdfFileLike = Pick<File, "name" | "type" | "size">

export function documentTemplateObjectPath(templateId: string): string {
  return `${DOCUMENT_TEMPLATE_PREFIX}/${templateId}.pdf`
}

export function documentTemplateProxyPath(templateId: string): string {
  return `/api/documents/templates/${encodeURIComponent(templateId)}/pdf`
}

export function parseDocumentTemplateProxyPath(pdfPath: string): string | null {
  const match = pdfPath.match(/^\/api\/documents\/templates\/([^/]+)\/pdf$/)
  return match ? decodeURIComponent(match[1]) : null
}

export type DocumentTemplateSource =
  | { kind: "local"; publicPath: string }
  | { kind: "storage"; templateId: string }

export function resolveDocumentTemplateSource(pdfPath: string): DocumentTemplateSource {
  const templateId = parseDocumentTemplateProxyPath(pdfPath)
  if (templateId) return { kind: "storage", templateId }

  const publicPath = pdfPath.startsWith("/") ? pdfPath.slice(1) : pdfPath
  return { kind: "local", publicPath }
}

export function validateDocumentTemplatePdfFile(file: PdfFileLike | null | undefined): string[] {
  if (!file) return ["Brak pliku PDF"]

  const errors: string[] = []
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  if (!isPdf) errors.push("Plik musi byc PDF")
  if (file.size <= 0) errors.push("Plik PDF jest pusty")
  if (file.size > DOCUMENT_TEMPLATE_MAX_BYTES) errors.push("Plik PDF jest za duzy (max 25MB)")
  return errors
}

export async function uploadDocumentTemplatePdf(templateId: string, file: File): Promise<string> {
  const path = documentTemplateObjectPath(templateId)
  const { error } = await getSupabaseAdmin()
    .storage
    .from(DOCUMENT_TEMPLATE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: "application/pdf",
      upsert: true,
    })

  if (error) throw new Error(`Upload PDF nie powiodl sie: ${error.message}`)
  return path
}

export async function removeDocumentTemplatePdf(templateId: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .storage
    .from(DOCUMENT_TEMPLATE_BUCKET)
    .remove([documentTemplateObjectPath(templateId)])
  if (error) throw new Error(`Cleanup PDF nie powiodl sie: ${error.message}`)
}

export async function downloadDocumentTemplatePdf(templateId: string): Promise<Uint8Array> {
  const { data, error } = await getSupabaseAdmin()
    .storage
    .from(DOCUMENT_TEMPLATE_BUCKET)
    .download(documentTemplateObjectPath(templateId))

  if (error) throw new Error(`Odczyt PDF nie powiodl sie: ${error.message}`)
  return new Uint8Array(await data.arrayBuffer())
}
