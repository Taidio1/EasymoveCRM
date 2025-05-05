# React CRM System v4

Nowoczesny system CRM (Customer Relationship Management) zbudowany przy użyciu React, Next.js i Supabase.

## Funkcjonalności

- **Dashboard**: Podgląd metryk biznesowych, wykresów przychodów, wzrostu liczby klientów i nadchodzących zadań
- **Zarządzanie Klientami**: 
  - Dodawanie, edycja, podgląd i usuwanie rekordów klientów
  - Zaawansowane zarządzanie dokumentami klientów
  - System statusów i śledzenia postępu spraw
  - Notatki i uwagi do klientów
- **Zarządzanie Dokumentami**:
  - Upload dokumentów w formatach PDF i Word
  - Automatyczne nazewnictwo plików z timestampem
  - Podgląd i pobieranie dokumentów
  - Bezpieczne przechowywanie w Supabase Storage
  - Limit wielkości plików (10MB)
- **Śledzenie Procesu**:
  - Status sprawy
  - Daty złożenia i odbioru dokumentów
  - Podstawa legalnego pobytu
  - Cel pobytu
- **Data Visualization**: Wykresy pokazujące trendy przychodów i wzrost liczby klientów
- **Autentykacja**: Role użytkowników (Admin, Boss, Employee) z odpowiednimi uprawnieniami
- **Responsywny Design**: Działa płynnie na urządzeniach mobilnych, tabletach i desktopach

## Stack Technologiczny

- **Frontend**: React 19, Next.js 15
- **UI Components**: Shadcn UI, Radix UI, Lucide React icons
- **Styling**: Tailwind CSS
- **Zarządzanie Stanem**: React Hooks
- **Formularze**: React Hook Form z walidacją Zod
- **Baza Danych**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage dla dokumentów
- **Autentykacja**: Supabase Auth z bezpiecznym zarządzaniem sesją
- **Wykresy**: Recharts
- **Powiadomienia**: Toast notifications

## Wymagania

- Node.js 18 lub wyższy
- npm lub pnpm package manager
- Konto i projekt Supabase

## Instalacja

1. Klonowanie repozytorium
```bash
git clone https://github.com/yourusername/react-crm.git
cd react-crm
```

2. Instalacja zależności
```bash
npm install
# lub
pnpm install
```

3. Utworzenie pliku `.env` w katalogu głównym z danymi Supabase:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key


4. Uruchomienie serwera deweloperskiego
```bash
npm run dev
# lub
pnpm dev
```

5. Otwórz [http://localhost:3000](http://localhost:3000) w przeglądarce

## Struktura Bazy Danych

Aplikacja wykorzystuje backend Supabase z następującymi tabelami:

- **clients**: Przechowuje informacje o klientach, w tym:
  - Dane kontaktowe
  - Numery spraw
  - Status dokumentów
  - Daty procesowe
  - URLe do dokumentów
  - Notatki i uwagi
- **users**: Zarządza autentykacją użytkowników i uprawnieniami bazującymi na rolach

## System Dokumentów

Aplikacja zawiera zaawansowany system zarządzania dokumentami:

### Przechowywanie
- Dokumenty przechowywane są w bucket'cie 'documents' w Supabase Storage
- Automatyczne nazewnictwo plików w formacie: `timestamp_nazwapliku.rozszerzenie`
- Obsługiwane formaty: PDF, DOC, DOCX
- Limit rozmiaru pliku: 10MB

### Funkcjonalności
- Upload wielu plików jednocześnie
- Podgląd listy dokumentów
- Pobieranie dokumentów
- Usuwanie dokumentów
- Walidacja typów i rozmiaru plików
- Zarządzanie dokumentami zarówno przy tworzeniu jak i edycji klienta

## Autentykacja

System implementuje bezpieczną autentykację przy użyciu Supabase Auth:

- **Ekran logowania**: Bezpieczny interfejs logowania
- **Chronione ścieżki**: Wszystkie ścieżki aplikacji wymagają autentykacji
- **Dostęp bazujący na rolach**: Różne funkcjonalności dla różnych ról (Admin, Boss, Employee)
- **Zarządzanie profilem**: Podgląd i edycja informacji profilowych
- **Bezpieczne wylogowanie**: Możliwość bezpiecznego zakończenia sesji

## Użytkowanie

### Dashboard

Dashboard zapewnia przegląd kluczowych metryk biznesowych:
- Całkowity przychód
- Aktywni klienci
- Oczekujące faktury
- Aktywne projekty
- Wykresy przychodów
- Statystyki wzrostu liczby klientów
- Ostatnie aktywności i nadchodzące zadania

### Zarządzanie Klientami

Strona klientów pozwala na:
- Przeglądanie wszystkich klientów w sortowanej i filtrowalnej tabeli
- Wyszukiwanie klientów po nazwie, emailu, numerze sprawy lub telefonie
- Filtrowanie klientów po statusie
- Dodawanie nowych klientów przez formularz modalny
- Przeglądanie szczegółowych informacji o kliencie
- Aktualizację danych klienta
- Usuwanie rekordów klientów
- Zarządzanie dokumentami klienta

## Deployment

Aplikacja może być wdrożona na Vercel, Netlify lub innej platformie wspierającej aplikacje Next.js.

```bash
npm run build
# lub
pnpm build
```

## Kontrybucje

1. Zforkuj repozytorium
2. Utwórz branch z funkcjonalnością (`git checkout -b feature/amazing-feature`)
3. Commituj zmiany (`git commit -m 'Add some amazing feature'`)
4. Pushuj do brancha (`git push origin feature/amazing-feature`)
5. Otwórz Pull Request

## Licencja

Projekt jest licencjonowany pod licencją MIT - szczegóły w pliku LICENSE.