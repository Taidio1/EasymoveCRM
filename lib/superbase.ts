import { createClient } from "@supabase/supabase-js"

// Sprawdzenie, czy zmienne rodowiskowe sš zdefiniowane
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Brakuje zmiennych rodowiskowych Supabase. Sprawd plik .env")
}


// Typy dla użytkowników
export interface User {
  id: string
  email: string
  role: 'Admin' | 'Boss' | 'Pracownik'
}

// Rozszerzamy interfejs User o pola z profilu
export interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
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

// Funkcje do interakcji z bazš danych

// Pobieranie wszystkich klientów
export async function getClients(): Promise<Client[]> {
  try {
    console.log("Próba pobrania klientów...");
    console.log("Supabase URL:", supabaseUrl);
    console.log("Supabase Anon Key:", supabaseAnonKey ? "? Klucz obecny" : "? Brak klucza");

    const { data, error } = await supabase
      .from("clients")
      .select("*");

    if (error) {
      console.error("Szczegółowy błšd Supabase:", error);
      console.error("Kod błędu:", error.code);
      console.error("Szczegóły:", error.details);
      console.error("Wiadomoć:", error.message);
      return [];
    }

    if (!data || data.length === 0) {
      console.warn("Brak danych w tabeli 'clients'");
    }

    console.log("Pobrano rekordów:", data?.length || 0);
    console.log("Pierwsze rekordy:", data?.slice(0, 3));

    return data || [];
  } catch (catchError) {
    console.error("Błšd catch:", catchError);
    return [];
  }
}
  

// Pobieranie klienta po ID
export async function getClientById(id: string): Promise<Client | null> {
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).single()

  if (error) {
    console.error("Błšd podczas pobierania klienta:", error)
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
      console.error("Szczegółowy błšd Supabase podczas dodawania klienta:");
      console.error("Kod błędu:", error.code);
      console.error("Szczegóły:", error.details);
      console.error("Wiadomoć:", error.message);
      return null;
    }

    console.log("Klient dodany pomylnie:", data?.[0]);
    return data?.[0] || null;
  } catch (catchError) {
    console.error("Nieoczekiwany błšd podczas dodawania klienta:", catchError);
    return null;
  }
}

// Funkcja aktualizacji klienta
export async function updateClient(id: string, updates: Partial<Client>): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Usuwanie klienta
export async function deleteClient(id: string): Promise<boolean> {
  const { error } = await supabase.from("clients").delete().eq("id", id)

  if (error) {
    console.error("Błšd podczas usuwania klienta:", error)
    return false
  }

  return true
}

// Funkcja pobierajšca pełny profil użytkownika
export async function getUserProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  // Pobierz dane profilu
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('first_name, last_name, role')
    .eq('id', user.id)
    .single();
  
  if (error) {
    console.error("Błšd podczas pobierania profilu:", error);
    return null;
  }
  
  return {
    id: user.id,
    email: user.email || '',
    first_name: profile?.first_name || null,
    last_name: profile?.last_name || null,
    role: profile?.role || null
  };
}

// Funkcja do wgrywania pliku do bucketu documents
export async function uploadClientDocument(clientId: string, file: File): Promise<string | null> {
  try {
    // Sprawd czy użytkownik jest zalogowany
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('Brak sesji użytkownika');
      return null;
    }

    // Generuj nazwę pliku
    const timestamp = Date.now();
    const fileName = `${clientId}/${timestamp}_${file.name}`;

    // Wgraj plik
    const { data, error } = await supabase
      .storage
      .from('documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type // Dodajemy typ zawartoci
      });

    if (error) {
      console.log(`Błšd podczas wgrywania pliku: ${error.message}`);
      return null;
    }

    // Pobierz publiczny URL
    const { data: urlData } = supabase
      .storage
      .from('documents')
      .getPublicUrl(fileName);

    return urlData?.publicUrl || null;
  } catch (err) {
    console.log(`Błšd podczas wgrywania pliku: ${err instanceof Error ? err.message : 'Nieznany błšd'}`);
    return null;
  }
}

// Funkcja do pobierania listy plików klienta
export async function getClientDocuments(clientId: string): Promise<Array<{ name: string, url: string, path: string }>> {
  try {
    // Listujemy pliki w folderze klienta
    const { data, error } = await supabase
      .storage
      .from('documents')
      .list(clientId, {
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('Błšd podczas pobierania listy plików:', error);
      return [];
    }

    // Tworzymy listę plików z URL-ami do pobrania
    return data.map(file => {
      const url = supabase
        .storage
        .from('documents')
        .getPublicUrl(`${clientId}/${file.name}`).data.publicUrl;

      return {
        name: file.name,
        url: url,
        path: `${clientId}/${file.name}`
      };
    });
  } catch (error) {
    console.error('Błšd podczas pobierania listy plików:', error);
    return [];
  }
}

// Funkcja do usuwania pliku
export async function deleteClientDocument(filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .storage
      .from('documents')
      .remove([filePath]);

    if (error) {
      console.error('Błšd podczas usuwania pliku:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Błšd podczas usuwania pliku:', error);
    return false;
  }
}

