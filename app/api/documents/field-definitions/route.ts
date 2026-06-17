import { NextRequest, NextResponse } from "next/server"
import {
  createFieldDefinition,
  listFieldDefinitions,
  validateFieldDefinitionInput,
} from "@/lib/document-field-definitions-store"
import { requireDocumentsAdmin } from "@/lib/documents-admin-auth"

export async function GET() {
  try {
    return NextResponse.json(await listFieldDefinitions())
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.warn(`Nie udało się wczytać słownika pól z Supabase: ${message}`)
    return NextResponse.json([])
  }
}

export async function POST(req: NextRequest) {
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
    const definition = await createFieldDefinition(body)
    return NextResponse.json(definition, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
