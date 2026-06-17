import { NextRequest, NextResponse } from "next/server"
import { createEmptyMapping, listMappings, validateDocumentTemplateInput } from "@/lib/document-store"
import { requireDocumentsAdmin } from "@/lib/documents-admin-auth"
import {
  documentTemplateProxyPath,
  removeDocumentTemplatePdf,
  uploadDocumentTemplatePdf,
  validateDocumentTemplatePdfFile,
} from "@/lib/document-template-storage"

async function createMappingFromFormData(req: NextRequest) {
  const formData = await req.formData()
  const id = String(formData.get("id") ?? "").trim()
  const name = String(formData.get("name") ?? "").trim()
  const pdf = formData.get("pdf")
  const file = pdf instanceof File ? pdf : null

  const baseErrors = validateDocumentTemplateInput({ id, name, pdfPath: documentTemplateProxyPath(id || "missing") })
  const fileErrors = validateDocumentTemplatePdfFile(file)
  const errors = [...baseErrors.filter(error => error !== "Brak pdfPath"), ...fileErrors]
  if (errors.length || !file) {
    return NextResponse.json({ error: "Walidacja", details: errors }, { status: 400 })
  }

  await uploadDocumentTemplatePdf(id, file)
  try {
    const mapping = await createEmptyMapping({ id, name, pdfPath: documentTemplateProxyPath(id) })
    return NextResponse.json(mapping, { status: 201 })
  } catch (err: unknown) {
    let cleanupMessage = ""
    try {
      await removeDocumentTemplatePdf(id)
    } catch (cleanupErr: unknown) {
      cleanupMessage = cleanupErr instanceof Error ? ` Cleanup: ${cleanupErr.message}` : " Cleanup nie powiodl sie."
    }
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: `${message}${cleanupMessage}` }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const gate = await requireDocumentsAdmin(req)
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  try {
    return NextResponse.json(await listMappings())
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireDocumentsAdmin(req)
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const contentType = req.headers.get("content-type") ?? ""
  if (contentType.includes("multipart/form-data")) {
    return createMappingFromFormData(req)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Nieprawidłowy JSON" }, { status: 400 })
  }

  const errors = validateDocumentTemplateInput(body)
  if (errors.length) return NextResponse.json({ error: "Walidacja", details: errors }, { status: 400 })

  try {
    const mapping = await createEmptyMapping(body)
    return NextResponse.json(mapping, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
