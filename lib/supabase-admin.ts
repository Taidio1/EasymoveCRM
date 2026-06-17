import "server-only"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let client: SupabaseClient | null = null

// Leniwa inicjalizacja — rzuca dopiero przy pierwszym użyciu, nie przy imporcie.
// Dzięki temu getMapping() może złapać brak konfiguracji i zrobić fallback do pliku.
export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error("Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY w środowisku")
  }
  // Klient z kluczem service-role — bypassuje RLS. Wyłącznie po stronie serwera.
  client = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return client
}
