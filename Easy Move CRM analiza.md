# Easy Move CRM - Analiza funkcjonalności

## Spis treści
1. [Strona /clients - Zarządzanie klientami](#strona-clients---zarządzanie-klientami)
2. [Strona /reports - Generowanie dokumentów](#strona-reports---generowanie-dokumentów)

---

## Strona /clients - Zarządzanie klientami

### Struktura komponentów
Strona `/clients` składa się z dwóch głównych komponentów:
- **`client-table.tsx`** - Tabela wyświetlająca listę klientów z funkcjami filtrowania i zarządzania
- **`client-details-modal.tsx`** - Modal z szczegółami klienta, umożliwiający edycję i przeglądanie danych

---

### 1. Tabela klientów (`client-table.tsx`)

#### Kolumny w tabeli
Tabela wyświetla następujące kolumny:

| Kolumna | Widoczność | Opis |
|---------|------------|------|
| **Imię i nazwisko** | Zawsze widoczna | `client.Name` |
| **Status** | Zawsze widoczna | `client.Status` z kolorowym badge |
| **Cel Pobytu** | Ukryta na mobile (`hidden md:table-cell`) | `client.CelPobytu` |
| **Numer Sprawy** | Ukryta na mobile (`hidden md:table-cell`) | `client.NumerSprawy` |
| **Data Złożenia Wniosku** | Ukryta na mobile (`hidden md:table-cell`) | `client.DataZloWnio` (formatowana) |
| **Akcje** | Zawsze widoczna | Menu z opcjami: Szczegóły, Edytuj, Usuń |

#### Zmienne stanu w tabeli
```typescript
- searchTerm: string                    // Wyszukiwanie po Name, Email, NumerSprawy, Phone
- statusFilter: string                  // Filtr statusu ("all", "zaplanowany", "w trakcie", "Zakończony", "zawieszony")
- showCompleted: boolean                 // Pokazywanie/ukrywanie klientów ze statusem "Zakończony"
- isCreateModalOpen: boolean             // Stan modala tworzenia klienta
- isDetailsModalOpen: boolean            // Stan modala szczegółów klienta
- selectedClient: Client | null          // Aktualnie wybrany klient
- clients: Client[]                      // Lista wszystkich klientów
- isLoading: boolean                     // Stan ładowania
- isEditMode: boolean                    // Tryb edycji w modalu
- currentPage: number                    // Aktualna strona paginacji
- itemsPerPage: number                   // Ilość elementów na stronę (5, 10, 20, 50)
```

#### Funkcje filtrowania
- **Wyszukiwanie tekstowe**: Filtruje po `Name`, `Email`, `NumerSprawy`, `Phone`
- **Filtr statusu**: Dropdown z opcjami: Wszystkie, Zaplanowany, W trakcie, Zakończony, Zawieszony
- **Filtr zakończonych**: Przełącznik pokazujący/ukrywający klientów ze statusem "Zakończony"
- **Paginacja**: Obsługa paginacji z możliwością wyboru ilości elementów na stronę

---

### 2. Modal szczegółów klienta (`client-details-modal.tsx`)

#### Układ danych w modalu

Modal jest podzielony na sekcje z zakładkami:

##### **Nagłówek modala**
- Tytuł: `client.Name` z badge statusu
- Przycisk edycji (przełączanie trybu edycji/podglądu)
- Opis: Numer sprawy | Data złożenia wniosku

##### **Sekcja 1: Informacje o kliencie** (zawsze widoczna)

**Tryb podglądu** (grid 2 kolumny):
- Imię i nazwisko (`client.Name`)
- Email (`client.Email`)
- Telefon (`client.Phone`)
- Data urodzenia (`client.Birthday`)
- Kraj pochodzenia (`client.KrajPoch`)
- Firma (`client.Firma`)
- Status płatności (`client.StatusPla`)

**Tryb edycji** (formularz 2 kolumny):
- **Pola tekstowe:**
  - Imię i nazwisko (wymagane, min 2 znaki)
  - Email
  - Telefon
  - Kraj pochodzenia
  - Data urodzenia (input type="date")
  - Numer sprawy
  - Inspektor
  - Data złożenia wniosku (input type="date")
  - Data wydania wniosku (input type="date")
  - Data odbioru karty pobytu (input type="date")
  - Data odbioru decyzji (input type="date")
  - Data zakończenia legalnego pobytu (input type="date")

- **Pola select:**
  - Status (wymagane): Aktywny, Nieaktywny, W trakcie
  - Cel Pobytu: Brak, Praca, Nauka, Rodzina, BlueCard
  - Podstawa Legalnego Pobytu: Brak, Wiza, Wiza Pracownicza, Wiza Studencka, Karta Pobytu, Inne

- **Pola checkbox (Dokumenty):**
  - Formularz wniosku (`FormWni`)
  - Załącznik nr 1 (`ZalNrJed`)
  - Kopia paszportu (`KopiaPasz`)
  - Załącznik Blue (`ZalBlue`)
  - 4 zdjęcia (`CzteZdjecia`)
  - Pełnomocnictwo (`Pelnomocnictwo`)

- **Pola tekstowe wieloliniowe:**
  - Notatki (`Notes`)

##### **Sekcja 2: Zakładki** (tylko w trybie podglądu)

**Zakładka 1: Szczegóły** (`details`)
- Numer sprawy (`client.NumerSprawy`)
- Inspektor (`client.Inspektor`)
- Data złożenia wniosku (`client.DataZloWnio`)
- Data wydania wniosku (`client.DataWydWni`)
- Data odbioru karty pobytu (`client.DataOdbKartyPob`)
- Data odbioru decyzji (`client.DataOdbDecyzji`)
- Data zakończenia legalnego pobytu (`client.DataZakLegPob`)
- Cel pobytu (`client.CelPobytu`)
- Podstawa legalnego pobytu (`client.PodLegPob`)

**Zakładka 2: Dokumenty** (`documents`)
- **Sekcja załączonych plików:**
  - Lista dokumentów z `client.Doc` (URL-e oddzielone przecinkami)
  - Przycisk "Dodaj dokument" (upload PDF/Word, max 10MB)
  - Dla każdego dokumentu: ikona pobierania i usuwania
  - Nazwa pliku wyciągana z URL

- **Sekcja statusu dokumentów** (grid 2 kolumny):
  - Formularz wniosku: Tak/Nie (`FormWni`)
  - Załącznik nr jedności: Tak/Nie (`ZalNrJed`)
  - Kopia paszportu: Tak/Nie (`KopiaPasz`)
  - Załącznik Blue: Tak/Nie (`ZalBlue`)
  - Cztery zdjęcia: Tak/Nie (`CzteZdjecia`)
  - Pełnomocnictwo: Tak/Nie (`Pelnomocnictwo`)

**Zakładka 3: Notatki** (`notes`)
- Wyświetlenie `client.Notes` (z obsługą wieloliniowego tekstu)
- Informacja o twórcy: `client.Creator`

---

### 3. Funkcje CRUD na stronie /clients

#### **CREATE (Tworzenie)**
- **Lokalizacja**: Przycisk "Dodaj nowego klienta" w `client-table.tsx`
- **Komponent**: `CreateClientModal` (osobny komponent)
- **Funkcja**: `handleClientCreated()` - dodaje nowego klienta na początku listy
- **API**: `addClient()` z `lib/superbase.ts`

#### **READ (Odczyt)**
- **Pobieranie listy**: `getClients()` - wywoływane w `useEffect` przy montowaniu komponentu
- **Odświeżanie**: Przycisk refresh z ikoną `RefreshCw` - wywołuje `refreshClients()`
- **Wyświetlanie szczegółów**: 
  - Kliknięcie "Szczegóły" w menu akcji otwiera modal
  - `handleViewDetails(client)` - ustawia `selectedClient` i otwiera modal

#### **UPDATE (Aktualizacja)**
- **Tryb edycji**: 
  - Przycisk edycji w nagłówku modala lub opcja "Edytuj" w menu akcji tabeli
  - `handleEdit(client)` - ustawia klienta i przechodzi w tryb edycji
- **Zapisywanie zmian**:
  - Formularz z walidacją (Zod schema)
  - Funkcja `onSubmit(data)` w `client-details-modal.tsx`
  - API: `updateClient(client.id, processedData)`
  - Callback: `onClientUpdated()` - aktualizuje listę w tabeli
- **Edycja dokumentów**:
  - Upload: `handleFileUpload()` - `uploadClientDocument()`, zapisuje do `client.Doc`
  - Delete: `handleDeleteDocument()` - `deleteClientDocument()`, usuwa z `client.Doc`
  - Download: `handleDownloadDocument()` - pobiera plik z Supabase Storage

#### **DELETE (Usuwanie)**
- **Lokalizacja**: Menu akcji w tabeli → "Usuń klienta"
- **Funkcja**: `handleDeleteClient(clientId)`
- **Potwierdzenie**: `window.confirm()` przed usunięciem
- **API**: `deleteClient(clientId)` z `lib/superbase.ts`
- **Aktualizacja UI**: Filtruje usuniętego klienta z listy

---

### 4. Dodatkowe funkcjonalności

#### **Paginacja**
- Wybór ilości elementów: 5, 10, 20, 50 na stronę
- Nawigacja: przyciski poprzednia/następna strona
- Wyświetlanie: "Strona X z Y"
- Licznik: "Wyświetlanie X z Y klientów"

#### **Filtrowanie i wyszukiwanie**
- Wyszukiwanie w czasie rzeczywistym po: Name, Email, NumerSprawy, Phone
- Filtrowanie po statusie (dropdown)
- Przełącznik pokazywania klientów zakończonych
- Filtry działają jednocześnie (AND logic)

#### **Formatowanie dat**
- Funkcja `formatDate()` w `client-table.tsx`
- Konwersja timestamp z timezone na format polski (DD-MM-YYYY HH:MM)
- Obsługa różnych formatów dat (ISO string, GMT, etc.)
- Wyświetlanie tylko daty jeśli godzina to 00:00

#### **Obsługa błędów**
- Toast notifications dla wszystkich operacji
- Komunikaty błędów dla: pobierania danych, aktualizacji, usuwania, uploadu plików
- Loading states dla wszystkich asynchronicznych operacji

#### **Walidacja formularza**
- Schema Zod z wymaganiami:
  - `Name`: min 2 znaki
  - `Status`: wymagane
- Walidacja plików:
  - Typy: PDF, DOC, DOCX
  - Rozmiar: max 10MB

---

## Strona /reports - Generowanie dokumentów

### Struktura komponentu
Strona `/reports` składa się z komponentu:
- **`reports.tsx`** - Główny komponent z zakładkami do generowania różnych typów dokumentów

---

### 1. Zakładki w komponencie Reports

#### **Zakładka 1: Dokumenty klienta** (`documents`)
**Funkcjonalność**: Generowanie dokumentów PDF dla pojedynczego klienta

**Elementy interfejsu:**
- Wyszukiwarka klientów (po Name, Email, NumerSprawy)
- Lista klientów w scrollowalnym kontenerze (wysokość 60vh)
- Dropdown wyboru typu dokumentu:
  - Karta klienta
  - Wniosek o pobyt czasowy
  - Pełnomocnictwo
  - Zaświadczenie o zameldowaniu
- Przycisk "Generuj dokument"

**Funkcje:**
- `generateSingleDocument()` - generuje PDF dla wybranego klienta
- Używa `documentGenerators[selectedDocType]` z `lib/pdf-generator.ts`
- Wyświetla podgląd PDF w komponencie `PdfPreview`

**Status**: Funkcjonalność częściowo zaimplementowana

---

#### **Zakładka 2: Listy klientów** (`lists`)
**Funkcjonalność**: Generowanie listy wielu klientów w jednym dokumencie PDF

**Elementy interfejsu:**
- Wyszukiwarka klientów
- Lista klientów z checkboxami do zaznaczania
- Przycisk "Zaznacz wszystkich" / "Odznacz wszystkich"
- Licznik wybranych klientów: "Wybrano X z Y klientów"
- Przycisk "Generuj listę klientów"

**Funkcje:**
- `handleClientSelect(clientId)` - zaznaczanie/odznaczanie pojedynczego klienta
- `handleSelectAll()` - zaznaczanie wszystkich widocznych klientów
- `generateClientsList()` - generuje PDF z listą wybranych klientów
- Używa `documentGenerators.clientsList(selectedClientsList)`

**Status**: Funkcjonalność częściowo zaimplementowana

---

#### **Zakładka 3: Statystyki** (`statistics`)
**Funkcjonalność**: Generowanie raportu statystycznego na podstawie wszystkich klientów

**Elementy interfejsu:**
- Opis zawartości raportu:
  - Łączna liczba klientów
  - Podział klientów według statusu
  - Najczęstsze kraje pochodzenia klientów
  - Najczęstsze cele pobytu
  - Statystyki miesięczne nowych klientów
- Przycisk "Generuj raport statystyczny"

**Funkcje:**
- `generateStatisticsReport()` - generuje raport dla wszystkich klientów
- Używa `documentGenerators.statisticsReport(clients)`

**Status**: Funkcjonalność częściowo zaimplementowana

---

#### **Zakładka 4: Formularze urzędowe** (`forms`)
**Funkcjonalność**: Generowanie formularzy urzędowych na bazie danych klientów

**Elementy interfejsu:**
- Komponent `FormGenerator` (osobny komponent)
- Przekazuje listę wszystkich klientów jako props

**Status**: Funkcjonalność nie jest dokończona i będzie robiona później

---

### 2. Zmienne stanu w komponencie Reports

```typescript
- clients: Client[]                      // Lista wszystkich klientów z bazy
- filteredClients: Client[]              // Przefiltrowana lista klientów
- selectedClient: Client | null         // Wybrany klient (dla zakładki dokumentów)
- selectedDocType: DocumentType         // Typ dokumentu ("clientCard", "temporaryResidenceApplication", etc.)
- searchTerm: string                     // Wyszukiwarka klientów
- isLoading: boolean                     // Stan ładowania klientów
- isGenerating: boolean                  // Stan generowania dokumentu
- pdfPreviewUrl: string | null           // URL do podglądu wygenerowanego PDF
- selectedClients: string[]              // Lista ID wybranych klientów (dla zakładki list)
```

---

### 3. Funkcje w komponencie Reports

#### **Pobieranie danych**
- `useEffect` z funkcją `fetchClients()` przy montowaniu komponentu
- API: `getClients()` z `lib/superbase.ts`
- Obsługa błędów z toast notifications

#### **Filtrowanie klientów**
- `useEffect` reagujący na zmiany `searchTerm` i `clients`
- Filtruje po: `Name`, `Email`, `NumerSprawy`
- Jeśli `searchTerm` pusty → pokazuje wszystkich klientów

#### **Generowanie dokumentów**
- **Dla pojedynczego klienta**: `generateSingleDocument()`
  - Sprawdza czy klient wybrany
  - Wybiera odpowiedni generator z `documentGenerators[selectedDocType]`
  - Generuje PDF i konwertuje do data URL
  - Ustawia `pdfPreviewUrl` do podglądu

- **Dla listy klientów**: `generateClientsList()`
  - Sprawdza czy wybrano co najmniej jednego klienta
  - Filtruje wybranych klientów z listy
  - Używa `documentGenerators.clientsList()`
  - Generuje PDF i wyświetla podgląd

- **Raport statystyczny**: `generateStatisticsReport()`
  - Używa wszystkich klientów
  - Wywołuje `documentGenerators.statisticsReport(clients)`
  - Generuje PDF i wyświetla podgląd

---

### 4. Komponenty powiązane

#### **PdfPreview**
- Komponent do wyświetlania podglądu wygenerowanego PDF
- Otrzymuje `pdfDataUrl` jako prop
- Przycisk zamknięcia podglądu

#### **FormGenerator**
- Komponent do generowania formularzy urzędowych
- Otrzymuje listę klientów jako prop
- Status: W trakcie rozwoju

---

### 5. Uwagi dotyczące implementacji

#### **Status funkcjonalności**
- ✅ **Zaimplementowane**: Podstawowa struktura, wyszukiwanie, filtrowanie, wybór klientów
- ⚠️ **Częściowo zaimplementowane**: Generowanie dokumentów PDF (wymaga dokończenia generatorów w `lib/pdf-generator.ts`)
- ❌ **Nie dokończone**: Formularze urzędowe (`FormGenerator`) - będzie robione później

#### **Zależności**
- `documentGenerators` z `lib/pdf-generator.ts` - generatory dokumentów PDF
- `getClients()` z `lib/superbase.ts` - pobieranie danych klientów
- `PdfPreview` - komponent podglądu PDF
- `FormGenerator` - komponent formularzy (w trakcie rozwoju)

#### **Błędy i obsługa**
- Toast notifications dla wszystkich operacji
- Loading states (`Loader2` spinner)
- Komunikaty błędów dla: pobierania klientów, generowania dokumentów
- Walidacja: sprawdzanie czy klient wybrany przed generowaniem

---

## Podsumowanie

### Strona /clients
- ✅ **Pełna implementacja CRUD**: Create, Read, Update, Delete
- ✅ **Zaawansowane filtrowanie**: Wyszukiwanie, statusy, daty
- ✅ **Zarządzanie dokumentami**: Upload, download, delete plików
- ✅ **Paginacja**: Elastyczna z wyborem ilości elementów
- ✅ **Walidacja**: Formularze z Zod schema
- ✅ **Responsywność**: Ukrywanie kolumn na mobile

### Strona /reports
- ✅ **Struktura podstawowa**: 4 zakładki z różnymi typami dokumentów
- ⚠️ **Częściowa implementacja**: Generowanie PDF wymaga dokończenia generatorów
- ❌ **Niedokończone**: Formularze urzędowe - planowane na przyszłość
- ✅ **Funkcjonalność wyszukiwania**: Działa poprawnie
- ✅ **Wybór klientów**: Checkboxy z możliwością zaznaczenia wszystkich

---

## Propozycje przydatnych funkcji dla nowej aplikacji

Niniejsza sekcja zawiera propozycje funkcjonalności, które mogą znacząco usprawnić pracę w systemie CRM dla firmy zajmującej się legalizacją pobytu cudzoziemców.

---

### 📅 1. Zaawansowane zarządzanie terminami i kalendarzem

#### **1.1. Kalendarz terminów urzędowych**
- **Terminy kluczowe dla każdego klienta:**
  - Data wygaśnięcia wizy
  - Data wygaśnięcia karty pobytu
  - Termin odbioru decyzji
  - Termin odbioru karty pobytu
  - Termin złożenia wniosku o przedłużenie
  - Terminy wizyt w urzędach (np. Urząd Wojewódzki, Urząd do Spraw Cudzoziemców)
- **Widoki kalendarza:**
  - Widok dzienny z godzinami
  - Widok tygodniowy
  - Widok miesięczny
  - Widok listy nadchodzących terminów
- **Powiadomienia i przypomnienia:**
  - Automatyczne powiadomienia email/SMS 30, 14, 7, 3, 1 dni przed terminem
  - Powiadomienia o zbliżających się wygaśnięciach dokumentów
  - Alerty o przekroczonych terminach (czerwone flagi)
  - Powiadomienia push w aplikacji
- **Filtrowanie:**
  - Filtrowanie po typie terminu
  - Filtrowanie po statusie (nadchodzące, przekroczone, zakończone)
  - Filtrowanie po pracowniku przypisanym do sprawy

#### **1.2. Automatyczne śledzenie terminów**
- **Kalkulator terminów:**
  - Automatyczne obliczanie terminu złożenia wniosku przed wygaśnięciem dokumentu
  - Alerty o konieczności rozpoczęcia procedury przedłużenia
  - Kalkulator czasu na przygotowanie dokumentów
- **Workflow automatyczny:**
  - Automatyczne przypisywanie statusu "Wymaga uwagi" gdy zbliża się termin
  - Automatyczne przypisywanie statusu "Krytyczne" gdy termin przekroczony
  - Automatyczne tworzenie zadań do wykonania

---

### 📋 2. Zarządzanie dokumentami i checklisty

#### **2.1. Inteligentne checklisty dokumentów**
- **Szablony dokumentów dla różnych typów wniosków:**
  - Wniosek o pobyt czasowy
  - Wniosek o kartę pobytu
  - Wniosek o przedłużenie pobytu
  - Wniosek o zmianę celu pobytu
  - Wniosek o Blue Card
  - Wniosek o pobyt stały
- **Status checklisty:**
  - ✅ Otrzymany
  - ⏳ Oczekuje na dostarczenie
  - ❌ Brak
  - ⚠️ Wymaga aktualizacji
  - 📝 W trakcie przygotowania
- **Automatyczne przypisywanie:**
  - Automatyczne przypisanie odpowiedniej checklisty na podstawie typu wniosku
  - Automatyczne zaznaczanie dokumentów już obecnych w systemie
  - Podpowiedzi jakie dokumenty są wymagane dla danego kraju pochodzenia

#### **2.2. Weryfikacja kompletności dokumentów**
- **Automatyczna walidacja:**
  - Sprawdzanie czy wszystkie wymagane dokumenty są załączone
  - Sprawdzanie dat ważności dokumentów (paszport, wiza)
  - Sprawdzanie czy dokumenty nie są przeterminowane
  - Sprawdzanie czy zdjęcia spełniają wymagania (rozmiar, format)
- **Raport kompletności:**
  - Procent kompletności dokumentacji dla każdego klienta
  - Lista brakujących dokumentów
  - Lista dokumentów wymagających aktualizacji
  - Timeline przygotowania dokumentacji

#### **2.3. Wersjonowanie dokumentów**
- **Historia dokumentów:**
  - Przechowywanie wszystkich wersji dokumentów
  - Możliwość porównania wersji
  - Oznaczenie aktualnej wersji
  - Automatyczne archiwizowanie starych wersji
- **Wersjonowanie formularzy:**
  - Śledzenie zmian w formularzach wniosków
  - Możliwość powrotu do poprzedniej wersji
  - Historia kto i kiedy wprowadził zmiany

---

### 📊 4. Zaawansowana analityka i raportowanie

#### **4.1. Raporty biznesowe**
- **Raporty finansowe:**
  - Przychody z podziałem na typy wniosków
  - Przychody z podziałem na pracowników
  - Przychody z podziałem na kraje pochodzenia klientów
  - Przychody miesięczne/kwartalne/roczne
  - Wskaźniki konwersji (zapytania → klienci)
  - Średni czas realizacji sprawy
  - Średnia wartość sprawy
- **Raporty operacyjne:**
  - Liczba spraw w poszczególnych statusach
  - Liczba spraw zakończonych sukcesem vs. odrzuconych
  - Średni czas realizacji sprawy
  - Najczęstsze przyczyny odrzuceń
  - Statystyki wydajności pracowników
  - Obciążenie pracowników (liczba spraw na pracownika)
- **Raporty strategiczne:**
  - Trendy w liczbie klientów
  - Najpopularniejsze kraje pochodzenia
  - Najpopularniejsze cele pobytu
  - Sezonowość zapytań
  - Analiza ROI kampanii marketingowych

#### **4.2. Dashboardy analityczne**
- **Dashboard kierownika:**
  - Przegląd wszystkich aktywnych spraw
  - Alerty o sprawach wymagających uwagi
  - Statystyki wydajności zespołu
  - Wykresy trendów
  - Top 10 pracowników
  - Top 10 klientów (wartość)
- **Dashboard pracownika:**
  - Moje sprawy w toku
  - Nadchodzące terminy
  - Zadania do wykonania
  - Statystyki osobiste
  - Historia wykonanych spraw
- **Dashboard klienta (portal klienta):**
  - Status mojej sprawy
  - Postęp procesu (progress bar)
  - Nadchodzące terminy
  - Lista dokumentów do dostarczenia
  - Historia komunikacji

---

### 💬 5. Komunikacja i CRM

#### **5.1. System komunikacji z klientami**
- **Kanały komunikacji:**
  - Email (integracja z systemem)
  - Chat w aplikacji
  - Portal klienta
- **Historia komunikacji:**
  - Pełna historia wszystkich kontaktów z klientem
  - Timeline komunikacji
  - Automatyczne zapisywanie emaili i SMS
  - Nagrywanie rozmów telefonicznych (opcjonalnie)
  - Notatki z rozmów
- **Szablony wiadomości:**
  - Szablony emaili dla różnych sytuacji
  - Szablony SMS dla przypomnień
  - Automatyczne wypełnianie danych klienta
  - Personalizacja wiadomości
- **Automatyczne powiadomienia:**
  - Powiadomienia o zmianie statusu sprawy
  - Powiadomienia o potrzebie dostarczenia dokumentów
  - Powiadomienia o terminach
  - Powiadomienia o decyzjach urzędowych

#### **5.2. Portal klienta**
- **Funkcjonalności portalu:**
  - Logowanie klienta
  - Podgląd statusu sprawy
  - Lista dokumentów do dostarczenia
  - Upload dokumentów przez klienta
  - Kalendarz terminów
  - Historia komunikacji
  - Pobieranie dokumentów (decyzje, karty pobytu)
- **Bezpieczeństwo:**
  - Dwuskładnikowe uwierzytelnianie
  - Szyfrowana komunikacja
  - Kontrola dostępu do dokumentów

---
### 📱 6. Aplikacja mobilna (RWD)

#### **6.1. Funkcjonalności mobilne**
- **Podstawowe funkcje:**
  - Podgląd spraw w terenie
  - Szybkie dodawanie notatek
  - Upload zdjęć dokumentów bezpośrednio z telefonu
  - Skanowanie dokumentów (OCR)
  - Lokalizacja GPS dla wizyt u klientów
  - Kalendarz mobilny z powiadomieniami

---


### 🎨 15. UI/UX i personalizacja

#### **15.1. Personalizacja interfejsu**
- **Dostosowywanie dashboardu:**
  - Drag & drop widgetów
  - Wybór wyświetlanych metryk
  - Dostosowywanie kolorów i motywów
- **Responsywność:**
  - Pełna responsywność na wszystkich urządzeniach
  - Optymalizacja dla tabletów
  - Optymalizacja dla smartfonów

---


## Priorytetyzacja funkcji

### 🔥 **Wysoki priorytet**
1. ✅ Zaawansowane zarządzanie terminami i kalendarzem
2. ✅ Inteligentne checklisty dokumentów
3. ✅ Automatyczne workflow dla typowych procedur
4. ✅ System komunikacji z klientami (email, SMS)
5. ✅ Portal klienta (podstawowy)
6. ✅ System fakturowania i płatności
7. ✅ Zaawansowana analityka i raportowanie
8. ✅ Aplikacja mobilna (RWD)


---

*Dokument wygenerowany: $(date)*
*Wersja: 1.1 - Dodano propozycje funkcji*

