import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export type AdminGate = { ok: true } | { ok: false; status: number; error: string }

export async function requireDocumentsAdmin(req: NextRequest): Promise<AdminGate> {
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
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (profErr) return { ok: false, status: 403, error: `Nie znaleziono profilu: ${profErr.message}` }

  const role = (profile?.role ?? "").toString().trim().toLowerCase()
  if (role !== "admin") {
    return { ok: false, status: 403, error: `Wymagana rola Admin (masz: ${profile?.role ?? "brak"})` }
  }
  return { ok: true }
}
