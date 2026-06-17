# Edytor mappingów PDF — specyfikacja

**Data:** 2026-06-17
**Status:** zatwierdzony kierunek, do rozpisania w plan implementacji

## Problem

Aplikacja generuje dokumenty PDF na bazie danych klienta: pusty formularz PDF +
plik mappingu JSON (współrzędne `x/y`, `fontSize`, dla formularzy kratkowych
`boxWidth/maxCharsPerRow/rowHeight`) → `pdf-lib` „rysuje" tekst we wskazanych
miejscach.

Admin **nie ma żadnej możliwości** poprawienia wyrównania tekstu do pól/kratek.
Jedyny dziś sposób to deweloperski, ręczny workflow:

1. Otworzyć standalone `tools/pdf-mapper.html` (poza aplikacją).
2. Ręcznie wgrać screenshot strony PDF.
3. Naklikać pozycje od nowa.
4. Wyeksportować JSON i ręcznie wkleić do repo.
5. Zredeployować.

Cel: **wbudowany w aplikację wizualny edytor mappingów**, w którym admin
przeciąga pola na realnej stronie PDF, widzi podgląd z danymi klienta i zapisuje
zmiany trwale — bez udziału programisty i bez deployu.

## Kontekst / stan obecny

- `mappings/*.json` — mapping pól (`DocumentMapping` / `FieldMapping` w
  `lib/document-types.ts`). Realnie istnieje **jeden** szablon:
  `mappings/wniosek-pobyt-czasowy.json`.
- `lib/document-generator.ts` — `generateDocument(templateId, client)`: czyta
  mapping **z pliku** (`fs.readFile`), ładuje PDF z `public/forms/`, rysuje pola
  przez `pdf-lib`. `drawGridField` rozkłada litery po kratkach.
- `lib/document-resolver.ts` — `resolveField(client, dataKey)`: zamienia klucz
  typu `Name|uppercase`, `Adres|address_city` na wartość (z transformacjami).
- `app/api/documents/generate/route.ts` — endpoint zwracający bajty PDF.
- `components/documents-page.tsx` — UI generowania. **W dużej mierze makieta**:
  lista szablonów, „ostatnie dokumenty" i pola formularza są zahardkodowane;
  realny mapping ma tylko jeden szablon. (Poza zakresem tej zmiany — adresujemy
  wyłącznie edycję mappingów.)
- `tools/pdf-mapper.html` — standalone narzędzie dev: upload screenshotu,
  klik = pozycja pola, eksport JSON. Zawiera **już rozwiązaną** matematykę
  px↔pt oraz dwuklikowy tryb grid (wyliczanie `boxWidth`). Przenosimy tę logikę
  do aplikacji.
- Hosting: **Mikr.us VPS** (zapisywalny dysk).
- Supabase: klient w `lib/superbase.ts` na **anon key** (publiczny). Role:
  `Admin / Boss / Pracownik`.
- Zależności: `pdf-lib`, `@pdf-lib/fontkit` są. **`pdfjs-dist` trzeba dodać** —
  pdf-lib nie renderuje strony na canvas.

## Decyzje

| Decyzja | Wybór | Uzasadnienie |
|---|---|---|
| Poziom edytora | Pełny edytor wizualny | Admin samodzielny: drag&drop, dodawanie pól, edycja parametrów |
| Render PDF | `pdfjs-dist` na `<canvas>` | Admin klika na **realnej** stronie, nie na wgranym screenshocie |
| Podgląd na żywo | Nakładka DOM + przycisk „Generuj prawdziwy PDF" | Płynne przeciąganie + weryfikacja 1:1 na żądanie |
| Magazyn mappingów | **Supabase** (tabela `document_mappings`) | Bezpieczne przy `git pull` na VPS, backupy, niezależne od serwera. Pliki JSON z repo = seed/fallback |
| Uprawnienia zapisu | Endpoint serwerowy, rola `Admin` | Anon key jest publiczny — zapis nie może iść z klienta bez bramki |

## Architektura i przepływ

```
Admin → /documents/[templateId]/edit (nowy widok edytora)
   │  render strony PDF (pdf.js → canvas)   ← public/forms/*.pdf
   │  przeciągalne znaczniki pól (DOM overlay) ← mapping z DB (GET)
   │  nakładka podglądu tekstu dla klienta-próbki (ta sama matematyka co generator)
   │  [Generuj prawdziwy PDF] → POST /api/documents/generate (istnieje)
   └  [Zapisz] → PUT /api/documents/mappings/[id]
                      │ (service-role, sprawdza rolę Admin, waliduje strukturę)
                      ▼
              Supabase: document_mappings (fields jsonb)
                      ▲
   generateDocument() czyta mapping z magazynu → fallback do mappings/*.json (seed)
```

## Komponenty

Każdy ma jedną odpowiedzialność, jasny interfejs i jest testowalny niezależnie.

### 1. `lib/pdf-coords.ts` — współdzielona matematyka
- `pointToPixel` / `pixelToPoint`: konwersja współrzędnych px (canvas) ↔ pt
  (PDF), z uwzględnieniem skali renderu i odwrócenia osi Y.
- `layoutGrid(text, field)`: zwraca listę `{ char, x, y }` dla pola typu grid
  (układanie znak-po-znaku po kratkach).
- **Kluczowe:** `drawGridField` w generatorze i nakładka podglądu w edytorze
  używają **tej samej** `layoutGrid` — gwarancja, że podgląd = wynik.
- Zależności: brak (czysta logika). Testy jednostkowe.

### 2. Tabela Supabase `document_mappings`
Kolumny: `id (text, pk)`, `name (text)`, `pdf_path (text)`,
`fields (jsonb)`, `updated_at (timestamptz, default now())`.
- RLS: SELECT dla zalogowanych; INSERT/UPDATE tylko rola `Admin`.
- Seed: jednorazowa migracja wgrywająca obecne `mappings/*.json`.

### 3. `lib/document-store.ts` — magazyn mappingów
- `getMapping(id): Promise<DocumentMapping>` — czyta z Supabase; przy braku
  rekordu lub błędzie DB → fallback do `mappings/${id}.json`.
- `saveMapping(id, mapping): Promise<void>` — upsert do Supabase (server-side,
  service-role).
- **Jedyne** miejsce dostępu do mappingów. `document-generator.ts` przestaje
  czytać plik bezpośrednio — woła `getMapping`.

### 4. `app/api/documents/mappings/[id]/route.ts` — API
- `GET` → zwraca `DocumentMapping` (przez `getMapping`).
- `PUT` → waliduje strukturę (`validateMapping`), sprawdza rolę `Admin`
  (sesja Supabase server-side), upsert przez `saveMapping`. Zwraca nowy
  `updated_at`.
- Walidacja: wymagane pola, typy liczbowe, `type ∈ {text, grid}`, dla grid
  obecność `boxWidth/maxCharsPerRow/rowHeight`.

### 5. `components/pdf-canvas.tsx` — renderer strony
- Props: `pdfUrl`, `page`, callback ze skalą (px na pt).
- Ładuje stronę przez `pdfjs-dist`, rysuje na `<canvas>`, eksportuje wymiary
  natywne i skalę renderu do rodzica (do pozycjonowania znaczników/nakładki).
- Worker pdf.js skonfigurowany lokalnie (asset w `public/`), bez CDN.

### 6. `components/mapping-editor.tsx` — edytor
- Renderuje `pdf-canvas` + warstwę overlay.
- Znaczniki pól: przeciągalne (drag → aktualizacja `x/y` przez `pixelToPoint`).
- Panel boczny: lista pól (dodaj / usuń / wybierz), edycja `dataKey`,
  `fontSize`, `maxWidth` (text) oraz `boxWidth/maxCharsPerRow/rowHeight` (grid),
  przełącznik strony i trybu text/grid (dwuklikowy pomiar `boxWidth` jak w
  mapperze).
- Wybór **klienta-próbki** (z `getClients`) → nakładka pokazuje rozwiązany
  tekst (`resolveField` + `layoutGrid`) w realnych pozycjach.
- Przyciski: „Generuj prawdziwy PDF" (POST do istniejącego endpointu, iframe),
  „Zapisz" (PUT).
- Wejście do edytora: przycisk w widoku szablonu na `/documents`.

## Obsługa błędów i przypadki brzegowe

- **DB niedostępne** → `getMapping` robi fallback do pliku JSON; generowanie
  działa dalej.
- **Walidacja PUT** odrzuca uszkodzony mapping zanim trafi do DB (400 z opisem).
- **Konflikt edycji** → optimistic-lock przez `updated_at`: PUT odrzuca zapis,
  jeśli `updated_at` klienta ≠ aktualny w DB (ostrzeżenie „ktoś zmienił, odśwież").
- **Pole poza stroną** → ostrzeżenie w UI, gdy `x/y` poza wymiarami strony (nie
  blokuje zapisu).
- **Brak roli Admin** → PUT zwraca 403; UI ukrywa „Zapisz" dla nie-adminów.
- **Brak fontu / diakrytyki** → bez zmian względem dziś (NotoSans z fallbackiem).

## Testy

- `pdf-coords`: `pointToPixel`/`pixelToPoint` (round-trip), `layoutGrid`
  (zawijanie wierszy, pozycje znaków) — jednostkowe.
- `document-store`: ścieżka DB-hit oraz DB-miss→plik (z zamockowanym Supabase).
- `validateMapping`: poprawne i niepoprawne struktury.
- Generator po refaktorze (czyta przez `getMapping`) — istniejące zachowanie bez
  regresji.

## Poza zakresem (YAGNI)

- Doprowadzanie reszty `documents-page.tsx` z makiety do realnego pipeline
  (lista szablonów z DB, kolejne formularze) — osobny projekt.
- Upload nowych plików PDF formularzy przez admina.
- Wersjonowanie/historia zmian mappingu poza `updated_at`.
- Edycja transformacji `dataKey` (lista transformacji pozostaje w kodzie).
