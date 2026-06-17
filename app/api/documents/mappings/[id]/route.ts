import { NextRequest, NextResponse } from "next/server"
import { deleteMapping, getMapping, saveMapping, validateMapping } from "@/lib/document-store"
import { requireDocumentsAdmin } from "@/lib/documents-admin-auth"
import { parseDocumentTemplateProxyPath, removeDocumentTemplatePdf } from "@/lib/document-template-storage"
import type { DocumentMapping } from "@/lib/document-types"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const mapping = await getMapping(id)
    return NextResponse.json(mapping)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: `Nie znaleziono mappingu: ${message}` }, { status: 404 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const gate = await requireDocumentsAdmin(req)
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  let body: DocumentMapping
  try {
    body = (await req.json()) as DocumentMapping
  } catch {
    return NextResponse.json({ error: "Nieprawidłowy JSON" }, { status: 400 })
  }

  const errors = validateMapping(body)
  if (errors.length) return NextResponse.json({ error: "Walidacja", details: errors }, { status: 400 })

  try {
    const updatedAt = await saveMapping(id, body)
    return NextResponse.json({ ok: true, updated_at: updatedAt })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const gate = await requireDocumentsAdmin(req)
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  let cleanupWarning = ""
  try {
    const mapping = await getMapping(id)
    const templateId = parseDocumentTemplateProxyPath(mapping.pdfPath)
    if (templateId) await removeDocumentTemplatePdf(templateId)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    cleanupWarning = `Nie udało się usunąć pliku PDF: ${message}`
  }

  try {
    await deleteMapping(id)
    return NextResponse.json(cleanupWarning ? { ok: true, warning: cleanupWarning } : { ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
