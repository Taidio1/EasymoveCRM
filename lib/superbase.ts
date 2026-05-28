import { createClient } from "@supabase/supabase-js"

// Sprawdzenie, czy zmienne środowiskowe są zdefiniowane
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Brakuje zmiennych środowiskowych Supabase. Sprawdź plik .env")
}

// Utworzenie klienta Supabase - musi być przed użyciem w funkcjach
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  avatar_url: string | null; // URL do zdjęcia profilowego
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

// Typy danych dla klienta
export interface Client {
  id: string
  Name: string
  Status: string
  CelPobytu: string | null
  PodLegPob: string | null
  KrajPoch: string | null
  Phone: string | null
  Adres: string | null
  StatusPla: string | null
  DataZloWnio: string | null // timestamp with time zone jako ISO string
  Email: string | null
  Birthday: string | null
  Notes: string | null
  Creator: string | null
  CreatedDate: string | null // timestamp with time zone jako ISO string
  TotalSpend: string | null
  Doc: string | null
  NumerSprawy: string | null
  Inspektor: string | null
  DataWydWni: string | null // date jako ISO string
  DataOdbKartyPob: string | null // date jako ISO string
  DataOdbDecyzji: string | null // date jako ISO string
  DataZakLegPob: string | null // date jako ISO string
  Firma: string | null
  FormWni: boolean | null
  ZalNrJed: boolean | null
  KopiaPasz: boolean | null
  ZalBlue: boolean | null
  CzteZdjecia: boolean | null
  Pelnomocnictwo: boolean | null
  country_id: number | null // foreign key do tabeli countries
  country_name: string | null // nazwa kraju z tabeli countries
}

// Funkcje do interakcji z bazą danych

// Pobieranie wszystkich klientów z nazwami krajów
export async function getClients(): Promise<Client[]> {
  try {
    const { data, error } = await supabase
      .from("clients")
      .select(`
        *,
        countries!country_id (
          name
        )
      `);

    if (error) {
      console.error("Błąd podczas pobierania klientów:", error.message);
      return [];
    }

    const transformedData = data.map(client => ({
      ...client,
      country_name: client.countries?.name || null
    }));

    return transformedData || [];
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
export async function addClient(client: Omit<Client, "id" | "created_at">): Promise<Client> {
  const { data, error } = await supabase.from("clients").insert([client]).select().single();

  if (error) throw error;
  return data;
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
    console.error("Błąd podczas usuwania klienta:", error)
    return false
  }

  return true
}

// Funkcja pobierająca pełny profil użytkownika
export async function getUserProfile(): Promise<UserProfile | null> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError) {
    console.error("Błąd podczas pobierania użytkownika z auth:", authError);
    return null;
  }
  
  if (!user) {
    console.log("Brak zalogowanego użytkownika");
    return null;
  }
  
  // Pobierz dane profilu z avatar_url
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('first_name, last_name, role, avatar_url')
    .eq('id', user.id)
    .single();
  
  // Jeśli profil nie istnieje, utwórz go z podstawowymi danymi
  if (error) {
    console.log("Profil nie istnieje lub błąd podczas pobierania:", error.code, error.message);
    
    // Jeśli to błąd "PGRST116" (not found), utwórz profil
    if (error.code === 'PGRST116') {
      console.log("Tworzenie nowego profilu dla użytkownika:", user.id);
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          first_name: null,
          last_name: null,
          role: user.user_metadata?.role || 'pracownik',
          avatar_url: null
        });
      
      if (insertError) {
        console.error("Błąd podczas tworzenia profilu:", insertError);
        // Zwróć podstawowy profil mimo błędu tworzenia
        return {
          id: user.id,
          email: user.email || '',
          first_name: null,
          last_name: null,
          role: user.user_metadata?.role || null,
          avatar_url: null
        };
      }
      
      // Zwróć nowo utworzony profil
      return {
        id: user.id,
        email: user.email || '',
        first_name: null,
        last_name: null,
        role: user.user_metadata?.role || 'pracownik',
        avatar_url: null
      };
    }
    
    // Dla innych błędów, zwróć podstawowy profil z danych auth
    console.warn("Nie można pobrać profilu, zwracam podstawowy profil:", error);
    return {
      id: user.id,
      email: user.email || '',
      first_name: null,
      last_name: null,
      role: user.user_metadata?.role || null,
      avatar_url: null
    };
  }
  
  return {
    id: user.id,
    email: user.email || '',
    first_name: profile?.first_name || null,
    last_name: profile?.last_name || null,
    role: profile?.role || null,
    avatar_url: profile?.avatar_url || null
  };
}

// Funkcja do wgrywania avatara użytkownika
export async function uploadUserAvatar(file: File): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('Użytkownik nie jest zalogowany');
      return null;
    }

    // Sprawdź typ i rozmiar pliku
    if (!file.type.startsWith('image/')) {
      console.error('Plik musi być obrazem');
      return null;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      console.error('Plik jest za duży (max 5MB)');
      return null;
    }

    // Utwórz nazwę pliku
    const fileExtension = file.name.split('.').pop();
    const fileName = `${user.id}.${fileExtension}`;

    // Usuń stary avatar jeśli istnieje
    await supabase.storage.from('avatarurl').remove([fileName]);

    // Wgraj nowy avatar do bucket'a avatarurl
    const { data, error } = await supabase.storage
      .from('avatarurl')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });

    if (error) {
      console.error('Błąd podczas wgrywania avatara:', error);
      return null;
    }

    // Pobierz publiczny URL
    const { data: urlData } = supabase.storage
      .from('avatarurl')
      .getPublicUrl(fileName);

    const avatarUrl = urlData?.publicUrl || null;

    // Zaktualizuj profil użytkownika
    if (avatarUrl) {
      console.log('Próba aktualizacji profilu dla użytkownika:', user.id);
      console.log('Avatar URL:', avatarUrl);
      
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id)
        .select();

      if (updateError) {
        console.error('Błąd podczas aktualizacji profilu:', updateError);
        console.error('Szczegóły błędu:', updateError.details);
        console.error('Kod błędu:', updateError.code);
        return null;
      }
      
      console.log('Profil zaktualizowany pomyślnie:', updateData);
    }

    return avatarUrl;
  } catch (err) {
    console.error('Nieoczekiwany błąd podczas wgrywania avatara:', err);
    return null;
  }
}

// Funkcja do usuwania avatara
export async function deleteUserAvatar(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Pobierz obecny avatar URL
    const profile = await getUserProfile();
    if (!profile?.avatar_url) return true; // Już nie ma avatara

    // Wyciągnij nazwę pliku z URL
    const url = new URL(profile.avatar_url);
    const pathParts = url.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];

    // Usuń plik z bucket'a avatarurl
    await supabase.storage.from('avatarurl').remove([fileName]);

    // Zaktualizuj profil (usuń URL)
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', user.id);

    if (error) {
      console.error('Błąd podczas usuwania avatara z profilu:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Błąd podczas usuwania avatara:', err);
    return false;
  }
}

// Funkcja do wgrywania pliku do bucketu documents
export async function uploadClientDocument(clientId: string, file: File, clientName?: string): Promise<string | null> {
  try {
    // Sprawdź czy użytkownik jest zalogowany
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('Brak sesji użytkownika');
      return null;
    }

    // Generuj nazwę pliku
    const timestamp = Date.now();
    const sanitizedClientName = clientName ? 
      clientName.replace(/[^a-zA-Z0-9]/g, '_') : 'dokument';
    const folderPrefix = `${sanitizedClientName}_${clientId}`;
    const fileName = `${folderPrefix}/${timestamp}_${file.name}`;

    // Wgraj plik
    const { data, error } = await supabase
      .storage
      .from('documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });

    if (error) {
      console.log(`Błąd podczas wgrywania pliku: ${error.message}`);
      return null;
    }

    // Pobierz publiczny URL
    const { data: urlData } = supabase
      .storage
      .from('documents')
      .getPublicUrl(fileName);

    return urlData?.publicUrl || null;
  } catch (err) {
    console.log(`Błąd podczas wgrywania pliku: ${err instanceof Error ? err.message : 'Nieznany błąd'}`);
    return null;
  }
}

// Funkcja do pobierania listy plików klienta
export async function getClientDocuments(clientId: string, clientName?: string): Promise<Array<{ name: string, url: string, path: string }>> {
  try {
    // Przygotuj prefiks folderu
    const sanitizedClientName = clientName ? 
      clientName.replace(/[^a-zA-Z0-9]/g, '_') : 'dokument';
    const folderPrefix = `${sanitizedClientName}_${clientId}`;
    
    // Listujemy pliki w folderze klienta
    const { data, error } = await supabase
      .storage
      .from('documents')
      .list(folderPrefix, {
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('Błąd podczas pobierania listy plików:', error);
      return [];
    }

    // Tworzymy listę plików z URL-ami do pobrania
    return data.map(file => {
      const filePath = `${folderPrefix}/${file.name}`;
      const url = supabase
        .storage
        .from('documents')
        .getPublicUrl(filePath).data.publicUrl;

      return {
        name: file.name.replace(/^\d+_/, ''), // Usunięcie przedrostka timestamp
        url: url,
        path: filePath
      };
    });
  } catch (error) {
    console.error('Błąd podczas pobierania listy plików:', error);
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
      console.error('Błąd podczas usuwania pliku:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Błąd podczas usuwania pliku:', error);
    return false;
  }
}

// Interfejs dla danych kwartalnych
export interface QuarterlyData {
  quarter: string; // np. "2024 Q1"
  quarterNum: number; // 1, 2, 3, 4
  year: number;
  clientCount: number;
}

// Funkcja do pobierania danych kwartalnych
export async function getQuarterlyClientData(): Promise<QuarterlyData[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_quarterly_client_stats');

    if (error) {
      // Fallback: jeśli RPC nie istnieje, użyj zwykłego query
      console.log('RPC nie istnieje, używam zwykłego query');
      const { data: manualData, error: manualError } = await supabase
        .from('clients')
        .select('DataZloWnio')
        .not('DataZloWnio', 'is', null);

      if (manualError) {
        console.error('Błąd podczas pobierania danych kwartalnych:', manualError);
        return [];
      }

      // Ręczne grupowanie po kwartałach
      const quarterlyMap = new Map<string, number>();
      
      manualData.forEach(client => {
        if (client.DataZloWnio) {
          const date = new Date(client.DataZloWnio);
          const year = date.getFullYear();
          const quarter = Math.ceil((date.getMonth() + 1) / 3);
          const quarterKey = `${year}-Q${quarter}`;
          
          quarterlyMap.set(quarterKey, (quarterlyMap.get(quarterKey) || 0) + 1);
        }
      });

      // Konwersja do oczekiwanego formatu i sortowanie
      const result: QuarterlyData[] = Array.from(quarterlyMap.entries())
        .map(([quarterKey, count]) => {
          const [yearStr, quarterStr] = quarterKey.split('-Q');
          const year = parseInt(yearStr);
          const quarterNum = parseInt(quarterStr);
          
          return {
            quarter: `${year} Q${quarterNum}`,
            quarterNum,
            year,
            clientCount: count
          };
        })
        .sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.quarterNum - b.quarterNum;
        });

      return result;
    }

    return data || [];
  } catch (err) {
    console.error('Błąd podczas pobierania danych kwartalnych:', err);
    return [];
  }
}

// Interfejs dla kraju
export interface Country {
  id: number;
  name: string;
}

// Interfejs dla formularza klienta
export interface ClientFormData {
  Name: string;
  Email: string;
  Phone: string;
  CelPobytu: string;
  country_id: number;
}

// Pobieranie wszystkich krajów
export async function getCountries(): Promise<Country[]> {
  try {
    const { data, error } = await supabase
      .from('countries')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('Błąd podczas pobierania krajów:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Błąd podczas pobierania krajów:', error);
    return [];
  }
}

// Dodawanie nowego klienta przez formularz publiczny
export async function addClientFromForm(clientData: ClientFormData): Promise<{ success: boolean; client?: any; error?: string }> {
  try {
    console.log("Próba dodania klienta z formularza:", clientData);

    // Przygotuj dane klienta z domyślnymi wartościami
    const newClient = {
      Name: clientData.Name,
      Email: clientData.Email,
      Phone: clientData.Phone,
      CelPobytu: clientData.CelPobytu,
      country_id: clientData.country_id,
      DataZloWnio: new Date().toISOString().split('T')[0], // Automatycznie dzisiejsza data
      Status: 'W trakcie', // Domyślny status dla nowych wniosków
      Creator: 'Formularz internetowy',
      CreatedDate: new Date().toISOString(),
      // Pozostałe pola pozostają null
      PodLegPob: null,
      StatusPla: null,
      Birthday: null,
      Notes: 'Dodano przez formularz internetowy',
      TotalSpend: null,
      Doc: null,
      NumerSprawy: null,
      Inspektor: null,
      DataWydWni: null,
      DataOdbKartyPob: null,
      DataOdbDecyzji: null,
      DataZakLegPob: null,
      Firma: null,
      FormWni: false,
      ZalNrJed: false,
      KopiaPasz: false,
      ZalBlue: false,
      CzteZdjecia: false,
      Pelnomocnictwo: false
    };

    const { data, error } = await supabase
      .from('clients')
      .insert([newClient])
      .select()
      .single();

    if (error) {
      console.error('Błąd Supabase podczas dodawania klienta:', error);
      return { 
        success: false, 
        error: `Błąd bazy danych: ${error.message}` 
      };
    }

    console.log('Klient dodany pomyślnie:', data);
    return { 
      success: true, 
      client: data 
    };

  } catch (error) {
    console.error('Błąd podczas dodawania klienta z formularza:', error);
    return { 
      success: false, 
      error: 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.' 
    };
  }
}

// Funkcja do wgrywania plików przez formularz publiczny (bez autoryzacji)
export async function uploadFormDocument(file: File, clientId: string): Promise<string | null> {
  try {
    // Sprawdź typ i rozmiar pliku
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      console.error('Nieprawidłowy typ pliku');
      return null;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      console.error('Plik jest za duży (max 10MB)');
      return null;
    }

    const timestamp = Date.now();
    const fileName = `form_uploads/${clientId}/${timestamp}_${file.name}`;

    // Wgraj plik do bucket'a documents
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });

    if (error) {
      console.error('Błąd podczas wgrywania pliku:', error);
      return null;
    }

    // Pobierz publiczny URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    return urlData?.publicUrl || null;
  } catch (err) {
    console.error('Błąd podczas wgrywania pliku z formularza:', err);
    return null;
  }
}

