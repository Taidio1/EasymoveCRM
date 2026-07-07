import { createClient } from "@supabase/supabase-js"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Zwraca zalogowanego użytkownika na podstawie nagłówka Authorization lub null.
export async function getUserFromRequest(req: Request) {
  const header = req.headers.get("authorization") ?? ""
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7) : ""
  if (!token) return null
  const client = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await client.auth.getUser()
  if (error || !data.user) return null
  return data.user
}

// Rzuca, jeśli użytkownik nie jest pracownikiem (brak wiersza w profiles).
export async function assertStaff(userId: string): Promise<void> {
  const { data, error } = await getSupabaseAdmin()
    .from("profiles").select("id").eq("id", userId).maybeSingle()
  if (error) throw new Error(`Błąd weryfikacji uprawnień: ${error.message}`)
  if (!data) throw new Error("Brak uprawnień (tylko personel)")
}
