# Edytowalny flow generowania PDF w `/documents` — projekt

Data: 2026-06-17
Status: zaakceptowany (do implementacji)

## Cel

Nowy flow dla admina na stronie `/documents`:

1. Admin wybiera klienta z listy **lub** zostawia puste (dane ręczne).
2. Klika „Podgląd" → przechodzi do panelu edycji PDF z już wgranymi danymi
   wybranego klienta (przy pustym wyborze — z pustymi polami do ręcznego
   wpisania).
3. W panelu admin może od razu kliknąć „Generuj" (pobrać PDF) albo najpierw
   poprawić dane / wyrównanie (nudge pozycji, fontSize) i dopiero wygenerować.

## Rozróżnienie krytyczne: DANE vs MAPPING

- **MAPPING** = pozycje i parametry pól, **wspólne** dla wszystkich generowań,
  zapisywane do Supabase (`document_mappings`) przez „Zapisz" w
  `mapping-editor.tsx`. Kanał: `PUT /api/documents/mappings/[id]` (bramka Admin).
- **DANE (override)** = wartości tekstowe konkretnego dokumentu oraz ewentualny
  nudge pozycji/fontSize, **per-generowanie**, których **NIE wolno** zapisywać do
  mappingu. Kanał: wyłącznie body `POST /api/documents/generate`.

Te dwa kanały są rozłączne — strukturalnie nie da się pomylić edycji DANYCH z
edycją POZYCJI mappingu.

## Stan obecny (punkt wyjścia)

- `generateDocument(templateId, client)` w `lib/document-generator.ts` bierze
  wartości pól wyłącznie z `resolveField(client, field.dataKey)` — brak kanału na
  nadpisanie wartości.
- `resolveField` (`lib/document-resolver.ts`) stosuje transformacje
  (`uppercase`, `address_street`, `split_first`…) na danych z obiektu `Client`.
- API `POST /api/documents/generate` już dziś przyjmuje cały obiekt `client` w
  body (nie czyta z bazy) → dodanie pola `overrides` jest niełamiącym
  rozszerzeniem.
- `mapping-editor.tsx` renderuje WYSIWYG-podgląd pozycjonowanego tekstu na
  canvasie PDF (`PdfCanvas` + `resolveField` + `layoutGrid` + `previewStyle`, ta
  sama osadzona NotoSans co generator).
- `documents-page.tsx` jest w dużej części makietą: `DOC_TEMPLATES`,
  `FIELD_DEFS`, `autoFilled`, `RECENT_DOCS` zahardkodowane i niepowiązane z
  realnym mappingiem. Tylko `wniosek-pobyt-czasowy` ma realny mapping+PDF.

## Wniosek projektowy

„Ręczne wpisanie" i „poprawienie wartości" to **ten sam mechanizm**: finalne
nadpisania per-pole. Wybór klienta to tylko sposób na *wstępne wypełnienie* tych
nadpisań przez `resolveField`. `resolveField` zostaje nietknięty; po stronie
klienta służy wyłącznie do zasiania początkowych wartości.

## Decyzje

- Panel edycji DANYCH żyje **w obrębie strony `/documents`**, jako krok po
  wyborze szablonu (tam, gdzie dziś makietowe `ConfigureView`/`PreviewView`).
  Przenoszenie klienta odbywa się przez stan React (`DocumentsPage`), bez
  `clientId` w URL. „Pusto = ręcznie" to brak wybranego klienta.
- Panel jest **WYSIWYG na canvasie**; mechanika wyciągnięta ze wspólnego
  `<PdfFieldLayer>`. Edycja zapisywanych POZYCJI zostaje w osobnym
  `mapping-editor` (admin-konfigurator).
- Override per-pole niesie **wartość + opcjonalny nudge `x`/`y`/`fontSize`**,
  efemerycznie (tylko w body `/generate`).
- Lista szablonów: **curated `DOC_TEMPLATES` + flaga `available`**. Tylko
  `wniosek-pobyt-czasowy` klikalny; pozostałe wyszarzone i nieklikalne (dodawane
  z czasem). Bez endpointu listującego mappingi.

## Model danych

`FieldMapping` pozostaje bez zmian. Nowy typ:

```ts
interface FieldOverride {
  value: string        // finalna treść pola (bez reaplikacji transformacji resolveField)
  x?: number           // nudge pozycji per-dokument (opcjonalny)
  y?: number
  fontSize?: number    // per-dokument (opcjonalny)
}
```

Override kluczowany **indeksem pola** w `mapping.fields`. Indeks jest bezpieczny:
w tym flow tablica mappingu jest niezmienna (edycja zapisywanych pozycji to
osobny ekran). Trwałe `id?` pola — niepotrzebne dziś, opcja na przyszłość.

## Komponenty

### Generator — `lib/document-generator.ts`

Sygnatura: `generateDocument(templateId, client: Client | null, overrides?: FieldOverride[])`.

Dla każdego pola `i`:
- wartość: `overrides ? overrides[i].value : resolveField(client, field.dataKey)`
  — override dosłowny (transform NIE reaplikowany); puste pomijane jak dziś.
- pozycja/fontSize: `overrides?.[i]?.x ?? field.x` (analogicznie `y`, `fontSize`).

Ścieżka bez `overrides` (sam `client`) działa jak dotąd → zero regresji.
`resolveField` nietknięty.

### API — `app/api/documents/generate/route.ts`

Body rozszerzone o `overrides?: FieldOverride[]`; `client` opcjonalny, gdy są
overrides. Walidacja: wymagane `templateId` oraz (`client` lub `overrides`).

### Wspólny rendering — `components/pdf-field-layer.tsx` (refactor)

Wyciągnięcie z `mapping-editor.tsx` warstwy canvas: `PdfCanvas` + znaczniki pól +
pozycjonowany podgląd tekstu (`layoutGrid`/`previewStyle`, osadzona NotoSans) +
drag. Parametry: `fields`, `valuePerField`, `dims`, `selected`, `editable`
(drag wł./wył.), `onSelect`, `onMove`. Używają jej oba: `mapping-editor` (bez
zmian funkcjonalnych) i `document-composer`. Eliminuje duplikację i gwarantuje
parytet podglądu z generowanym PDF.

### Nowy panel — `components/document-composer.tsx`

Props: `mapping`, `client | null`, `onBack`, `onNew`. Stan:
- `values: string[]` — zasiane `client ? resolveField(client, field.dataKey) : ""`.
- `pos: Record<number, { x?; y?; fontSize? }>` — z drag/inputów.
- `selected`, `pdfUrl`, `isGenerating`, `error`.

UI: po lewej `<PdfFieldLayer editable>` (drag = nudge pozycji); po prawej lista
pól z inputami treści + dla zaznaczonego pola inputy `x/y/fontSize`. Przyciski:
**Generuj** (POST `/generate` z `overrides = fields.map((_, i) => ({ value: values[i], ...pos[i] }))`)
→ podgląd w iframe + **Pobierz**.

Etykiety pól: na razie `dataKey` (admin techniczny); opcjonalne ludzkie `label?`
w mappingu — przyszłość.

### Przepływ — `components/documents-page.tsx`

Kroki: `browse → select → compose`.

- **BrowseView:** `wniosek-pobyt-czasowy` klikalny; pozostałe wyszarzone,
  nieklikalne (flaga `available` w `DOC_TEMPLATES`, domyślnie `false`). Po
  kliknięciu — `GET /api/documents/mappings/{id}`.
- **SelectView** (zastępuje makietowy `ConfigureView`): zachowany selektor
  klienta + opcja „Wpisz dane ręcznie" (brak klienta) → „Podgląd".
- **compose:** renderuje `DocumentComposer` (zastępuje makietowy `PreviewView`).
- Usunięcie martwej makiety kolidującej z realnym flow: `FIELD_DEFS`,
  `autoFilled`, `DocSection/DocGrid/DocRow`, picker formatu DOCX/ODT. Statystyki
  i „Ostatnio wygenerowane" zostają jako kosmetyka (poza zakresem).

## Przepływ danych

```
BrowseView (klik dostępny szablon)
  → GET /mappings/{id}  → mapping (pozycje)
  → SelectView: wybór klienta | "ręcznie"
  → DocumentComposer:
       values[i] = client ? resolveField(client, fields[i].dataKey) : ""
       admin edytuje values[i]; drag → pos[i].{x,y}; input fontSize
       Generuj → POST /generate { templateId, overrides: fields.map((_,i)=>({value:values[i], ...pos[i]})) }
       → PDF bytes → iframe + Pobierz
```

## Obsługa błędów

- Błąd `GET /mappings` → komunikat, pozostań na `browse`.
- Błąd `/generate` → komunikat w panelu (jak dziś).
- Puste wartości → pole pomijane (zachowanie generatora bez zmian).
- `client = null` i puste pola → dozwolony pusty PDF (czysty formularz).

## Testy

- **Generator (unit):** precedencja override (value bije `resolveField`;
  `x/y/fontSize` fallback do mappingu; pusty value pomijany); ścieżka „sam
  client" niezmieniona.
- **Seeding (unit):** `client → values` przez `resolveField`; `null → ""`.
- **Composer (integration):** „Generuj" wysyła poprawny payload `overrides`
  (treść + nudge).
- **Parytet podglądu:** WYSIWYG = wygenerowany PDF (gwarantowane wspólnym
  `<PdfFieldLayer>` i tymi samymi helperami).

## Zakres / nie-robimy (YAGNI)

- DANYCH nie zapisujemy nigdzie (brak historii dokumentów).
- `mapping-editor` bez zmian funkcjonalnych poza refaktorem renderingu.
- Bez DOCX/ODT.
- Bez endpointu listującego mappingi (curated lista + flaga `available`).
- Bez `clientId` w URL (stan React; brak deep-linku/przetrwania refresh — OK).
