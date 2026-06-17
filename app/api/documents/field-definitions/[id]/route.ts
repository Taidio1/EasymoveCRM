import { NextRequest, NextResponse } from "next/server"
import {
  deleteFieldDefinition,
  updateFieldDefinition,
  validateFieldDefinitionInput,
} from "@/lib/document-field-definitions-store"
import { requireDocumentsAdmin } from "@/lib/documents-admin-auth"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireDocumentsAdmin(req)
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Nieprawidłowy JSON" }, { status: 400 })
  }

  const errors = validateFieldDefinitionInput(body)
  if (errors.length) return NextResponse.json({ error: "Walidacja", details: errors }, { status: 400 })

  try {
    const { id } = await params
    const definition = await updateFieldDefinition(id, body)
    return NextResponse.json(definition)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireDocumentsAdmin(req)
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  try {
    const { id } = await params
    await deleteFieldDefinition(id)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
