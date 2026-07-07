import { supabase, type Client } from "@/lib/superbase"
import { pickEditableFields } from "@/lib/panel/editable-fields"

// Pobiera wiersz klienta przypisany do zalogowanego użytkownika (po e-mailu, portal_enabled).
// Najpierw próbuje powiązać auth_user_id (idempotentnie) przez RPC link_my_client.
export async function getMyClient(): Promise<Client | null> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user?.email) return null

  await supabase.rpc("link_my_client") // ignorujemy błąd: brak wiersza = po prostu null niżej

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .ilike("Email", auth.user.email)
    .eq("portal_enabled", true)
    .maybeSingle()

  if (error) {
    console.error("getMyClient:", error.message)
    return null
  }
  return data
}

// Zapis dozwolonych pól przez RPC z whitelistą (RLS nie pozwala na bezpośredni UPDATE).
export async function updateMyClient(values: Record<string, unknown>): Promise<boolean> {
  const payload = pickEditableFields(values)
  const { error } = await supabase.rpc("update_client_self", { payload })
  if (error) {
    console.error("updateMyClient:", error.message)
    return false
  }
  return true
}
