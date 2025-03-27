import { createClient } from "@supabase/supabase-js"

// Sprawdzenie, czy zmienne środowiskowe są zdefiniowane
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Brakuje zmiennych środowiskowych Supabase. Sprawdź plik .env")
}


// Typy dla użytkowników
export interface User {
  id: string
  email: string
  role: 'Admin' | 'Boss' | 'Pracownik'
}

// Metoda logowania
export async function signIn({ 
  email, 
  password 
}: { 
  email: string, 
  password: string 
}) {
  return await supabase.auth.signInWithPassword({
    email,
    password
  })
}

// Metoda wylogowania
export async function signOut() {
  return await supabase.auth.signOut()
}

// Pobranie aktualnego użytkownika
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || !user.email) return null

  return {
    id: user.id,
    email: user.email, // Teraz email jest wymagany
    role: user.user_metadata.role || 'Pracownik'
  }
}

// Rejestracja użytkownika
export async function signUp({
  email,
  password,
  role = 'Pracownik'
}: {
  email: string,
  password: string,
  role?: 'Admin' | 'Boss' | 'Pracownik'
}) {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role
      }
    }
  })
}

// Sprawdzenie uprawnień użytkownika
export async function checkUserAccess(requiredRoles: string[]): Promise<boolean> {
  const user = await getCurrentUser()
  
  if (!user) return false
  
  return requiredRoles.includes(user.role)
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
  CreatedDate: string | null
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
  try {
    console.log("Próba dodania klienta:", client);
    
    const { data, error } = await supabase.from("clients").insert([client]).select();

    if (error) {
      console.error("Szczegółowy błąd Supabase podczas dodawania klienta:");
      console.error("Kod błędu:", error.code);
      console.error("Szczegóły:", error.details);
      console.error("Wiadomość:", error.message);
      return null;
    }

    console.log("Klient dodany pomyślnie:", data?.[0]);
    return data?.[0] || null;
  } catch (catchError) {
    console.error("Nieoczekiwany błąd podczas dodawania klienta:", catchError);
    return null;
  }
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

