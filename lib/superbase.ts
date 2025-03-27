import { createClient } from "@supabase/supabase-js"

// Sprawdzenie, czy zmienne środowiskowe są zdefiniowane
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Brakuje zmiennych środowiskowych Supabase. Sprawdź plik .env")
}

// Utworzenie klienta Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Typy danych dla klienta
export interface Client {
  id: string
  Name: string
  Status: string
  CelPobytu: string | null
  PodLegPob: string | null
  KrajPoch: string | null
  Phone: string | null
  StatusPla: string | null
  DataZloWnio: string | null
  Email: string | null
  Birthday: string | null
  Notes: string | null
  Creator: string | null
  TotalSpend: string | null
  Doc: string | null
  NumerSprawy: string | null
  Inspektor: string | null
  DataWydWni: string | null
  DataOdbKartyPob: string | null
  DataOdbDecyzji: string | null
  DataZakLegPob: string | null
  Firma: string | null
  FormWni: string | null
  ZalNrJed: string | null
  KopiaPasz: string | null
  ZalBlue: string | null
  CzteZdjecia: string | null
  Pelnomocnictwo: string | null
  created_at?: string
}

// Funkcje do interakcji z bazą danych

// Pobieranie wszystkich klientów
export async function getClients(): Promise<Client[]> {
  try {
    console.log("Próba pobrania klientów...");
    console.log("Supabase URL:", supabaseUrl);
    console.log("Supabase Anon Key:", supabaseAnonKey ? "✓ Klucz obecny" : "✗ Brak klucza");

    const { data, error } = await supabase
      .from("clients")
      .select("*");

    if (error) {
      console.error("Szczegółowy błąd Supabase:", error);
      console.error("Kod błędu:", error.code);
      console.error("Szczegóły:", error.details);
      console.error("Wiadomość:", error.message);
      return [];
    }

    if (!data || data.length === 0) {
      console.warn("Brak danych w tabeli 'clients'");
    }

    console.log("Pobrano rekordów:", data?.length || 0);
    console.log("Pierwsze rekordy:", data?.slice(0, 3));

    return data || [];
  } catch (catchError) {
    console.error("Błąd catch:", catchError);
    return [];
  }
}
  

// Pobieranie klienta po ID
export async function getClientById(id: string): Promise<Client | null> {
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).single()

  if (error) {
    console.error("Błąd podczas pobierania klienta:", error)
    return null
  }

  return data
}

// Dodawanie nowego klienta
export async function addClient(client: Omit<Client, "id" | "created_at">): Promise<Client | null> {
  const { data, error } = await supabase.from("clients").insert([client]).select()

  if (error) {
    console.error("Błąd podczas dodawania klienta:", error)
    return null
  }

  return data?.[0] || null
}

// Aktualizacja klienta
export async function updateClient(id: string, client: Partial<Client>): Promise<Client | null> {
  const { data, error } = await supabase.from("clients").update(client).eq("id", id).select()

  if (error) {
    console.error("Błąd podczas aktualizacji klienta:", error)
    return null
  }

  return data?.[0] || null
}

// Usuwanie klienta
export async function deleteClient(id: string): Promise<boolean> {
  const { error } = await supabase.from("clients").delete().eq("id", id)

  if (error) {
    console.error("Błąd podczas usuwania klienta:", error)
    return false
  }

  return true
}

