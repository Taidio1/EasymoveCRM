import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getMapping, saveMapping, validateMapping } from "@/lib/document-store"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
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

async function requireAdmin(
  req: NextRequest,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const auth = req.headers.get("authorization") ?? ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : ""
  if (!token) return { ok: false, status: 401, error: "Brak tokenu" }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: { user }, error } = await userClient.auth.getUser()
  if (error || !user) return { ok: false, status: 401, error: "Nieprawidłowa sesja" }

  const { data: profile, error: profErr } = await getSupabaseAdmin()
    .from("profiles").select("role").eq("id", user.id).single()
  if (profErr) return { ok: false, status: 403, error: `Nie znaleziono profilu: ${profErr.message}` }
  const role = (profile?.role ?? "").toString().trim().toLowerCase()
  if (role !== "admin") {
    return { ok: false, status: 403, error: `Wymagana rola Admin (masz: ${profile?.role ?? "brak"})` }
  }
  return { ok: true }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const gate = await requireAdmin(req)
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
