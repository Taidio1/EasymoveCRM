# Document Generator — Design Spec
_2026-05-28_

## Context

EasymoveCRM needs to generate filled official Polish government forms (static PDFs — no AcroForm fields) from client data stored in Supabase. The initial scope is one document type (wniosek o pobyt czasowy i pracę), scaling to ~5 types. The developer adds new document types, not end users.

## Approach

**Config JSON + pdf-lib overlay.** Each document type has a JSON mapping file that describes where each client data field should be drawn on the original PDF. A generator service loads the original PDF, resolves client data, overlays text at specified coordinates, and returns the filled PDF.

Rejected alternatives:
- **HTML → Puppeteer**: requires server-side headless browser, output is not the official government form
- **SVG overlay + html2canvas**: fragile export quality, complex implementation

---

## File Structure

```
lib/
  document-generator.ts       ← core engine: loads PDF + JSON, draws text
  document-resolver.ts        ← resolves dataKey expressions against Client
mappings/
  index.ts                    ← registry of available template IDs
  wniosek-pobyt-czasowy.json  ← field mappings for this document
public/forms/
  wniosek-pobyt-czasowy.pdf   ← original government PDF (static, not committed to git)
app/api/documents/generate/
  route.ts                    ← POST { templateId, clientId } → PDF bytes
components/documents-page.tsx ← existing UI, wired to new API route
```

---

## JSON Mapping Schema

One file per document type in `mappings/`. Each field defines where and how to draw one piece of client data.

```json
{
  "id": "wniosek-pobyt-czasowy",
  "name": "Wniosek o udzielenie zezwolenia na pobyt czasowy i pracę",
  "pdfPath": "/forms/wniosek-pobyt-czasowy.pdf",
  "fields": [
    {
      "page": 1,
      "x": 120,
      "y": 710,
      "dataKey": "Name|split_last",
      "fontSize": 10,
      "maxWidth": 180
    },
    {
      "page": 1,
      "x": 310,
      "y": 710,
      "dataKey": "Name|split_first",
      "fontSize": 10,
      "maxWidth": 150
    },
    {
      "page": 1,
      "x": 120,
      "y": 690,
      "dataKey": "Birthday|year",
      "fontSize": 10
    }
  ]
}
```

### Field properties

| Property   | Type   | Required | Description |
|------------|--------|----------|-------------|
| `page`     | number | ✓ | 1-indexed page number |
| `x`        | number | ✓ | X coordinate in PDF points (origin: bottom-left) |
| `y`        | number | ✓ | Y coordinate in PDF points (origin: bottom-left) |
| `dataKey`  | string | ✓ | Client property path, optionally with `\|transform` |
| `fontSize` | number | ✓ | Font size in points (typically 8–11 for form fields) |
| `maxWidth` | number | — | Truncates with `…` if text exceeds this width in points |

### Supported transforms (after `|`)

| Transform        | Input        | Output |
|-----------------|--------------|--------|
| `split_first`   | `"Jan Kowalski"` | `"Jan"` |
| `split_last`    | `"Jan Kowalski"` | `"Kowalski"` |
| `uppercase`     | `"polska"`   | `"POLSKA"` |
| `year`          | `"1990-03-15"` | `"1990"` |
| `month`         | `"1990-03-15"` | `"03"` |
| `day`           | `"1990-03-15"` | `"15"` |
| `address_street`| `"ul. Marszałkowska 1, 00-001 Warszawa"` | `"Marszałkowska"` |
| `address_number`| same | `"1"` |
| `address_zip`   | same | `"00-001"` |
| `address_city`  | same | `"Warszawa"` |

---

## Core Services

### `document-generator.ts`

```
generateDocument(templateId: string, client: Client): Promise<Uint8Array>
  1. fs.readFile(path.join(process.cwd(), 'public/forms', pdfPath)) → pdfBytes
  2. fs.readFile(path.join(process.cwd(), 'mappings', templateId + '.json')) → mapping
  3. PDFDocument.load(pdfBytes)
  4. embed NotoSans font via fontkit (Polish character support)
     fs.readFile(path.join(process.cwd(), 'public/fonts/NotoSans-Regular.ttf'))
  5. for each field in mapping.fields:
       value = resolver.resolve(client, field.dataKey)
       if value is empty → skip (no blank placeholder drawn)
       if maxWidth defined → manually truncate string with "…" using font.widthOfTextAtSize()
       page = pdfDoc.getPages()[field.page - 1]
       page.drawText(value, { x, y, size: fontSize, font })
  6. return pdfDoc.save()
```

**Font:** `NotoSans-Regular.ttf` embedded via `@pdf-lib/fontkit`. Standard pdf-lib fonts (Helvetica, Times) do not support Polish diacritics (ą, ć, ę, ł, ń, ó, ś, ź, ż). Font file stored at `public/fonts/NotoSans-Regular.ttf`.

**Note on maxWidth:** pdf-lib's built-in `maxWidth` does line-wrapping, not truncation. We implement manual truncation: shorten the string character by character until `font.widthOfTextAtSize(text, size) <= maxWidth`, then append `…`.

**Coordinate system:** pdf-lib origin is bottom-left of the page. A4 = 595 × 842 pt. Screenshots have origin top-left. Conversion: `y_pdf = 842 - y_screenshot`.

### `document-resolver.ts`

```
resolve(client: Client, dataKey: string): string
  1. split dataKey on "|" → [path, transform?]
  2. get value from client by path (e.g. "Name", "Birthday", "KrajPoch")
  3. if no value → return ""
  4. apply transform if present
  5. return string
```

### `mappings/index.ts`

```typescript
export const DOCUMENT_TEMPLATES = [
  { id: 'wniosek-pobyt-czasowy', name: 'Wniosek o pobyt czasowy i pracę' },
  // add new entries here as new forms are added
]
```

### `app/api/documents/generate/route.ts`

```
POST { templateId: string, clientId: string }
  → fetch client from Supabase by clientId
  → generateDocument(templateId, client)
  → return Response with Content-Type: application/pdf
```

Generation is server-side because fetching from `/public/` via browser fetch has CORS issues in some environments, and Supabase access requires server context.

---

## UI Integration

In `documents-page.tsx`, the "Generuj dokument" button (currently a placeholder) calls:

```typescript
const res = await fetch('/api/documents/generate', {
  method: 'POST',
  body: JSON.stringify({ templateId: template.id, clientId: client.id })
})
const blob = await res.blob()
const url = URL.createObjectURL(blob)
// trigger download
```

No UI changes needed beyond wiring this fetch call.

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| PDF file missing from `/public/forms/` | API returns 404 with message naming the missing file |
| JSON mapping file missing | API returns 500 with message naming the missing mapping |
| `dataKey` not found on Client | Field skipped silently (empty = no overlay) |
| Text exceeds `maxWidth` | Truncated with `…` |
| Font load failure | Falls back to `StandardFonts.Helvetica` with a console warning |

---

## Adding a New Document Type (workflow)

1. Place original PDF in `public/forms/new-form.pdf`
2. Take page screenshots → send to AI with the prompt below
3. AI generates `mappings/new-form.json`
4. Paste, run dev server, test output, fine-tune coordinates
5. Add entry to `mappings/index.ts`
6. Add entry to `DOC_TEMPLATES` in `documents-page.tsx`

---

## AI Prompt for Generating JSON Mapping

See bottom of this document.

---

## AI Prompt Template

Copy this prompt, attach screenshots of each PDF page, and paste into Claude.ai or ChatGPT:

---

```
Mam statyczny formularz PDF (bez pól AcroForm). Chcę wygenerować plik JSON 
z mapowaniem pól formularza na dane klienta z mojego CRM.

## Format strony
A4 w punktach: szerokość = 595pt, wysokość = 842pt.
WAŻNE: pdf-lib używa układu z (0,0) w LEWYM DOLNYM rogu.
Konwersja ze screenshota: y_pdf = 842 - y_screen

## Schemat JSON
Wygeneruj plik JSON zgodny z tym schematem:

{
  "id": "<id-formularza>",
  "name": "<polska nazwa formularza>",
  "pdfPath": "/forms/<id-formularza>.pdf",
  "fields": [
    {
      "page": <numer strony, od 1>,
      "x": <x w punktach PDF, od lewej>,
      "y": <y w punktach PDF, od dołu>,
      "dataKey": "<klucz|transform>",
      "fontSize": <rozmiar czcionki, typowo 9-11>,
      "maxWidth": <opcjonalnie, maks szerokość w punktach>
    }
  ]
}

## Dostępne pola klienta (Client) i ich klucze

| Klucz       | Opis                        | Przykład                        |
|-------------|-----------------------------|---------------------------------|
| Name        | Pełne imię i nazwisko       | "Jan Kowalski"                  |
| Birthday    | Data urodzenia (YYYY-MM-DD) | "1990-03-15"                    |
| KrajPoch    | Kraj pochodzenia             | "Ukraina"                       |
| Phone       | Numer telefonu              | "+48 600 123 456"               |
| Email       | Adres e-mail                | "jan@example.com"               |
| Adres       | Adres w Polsce              | "ul. Marszałkowska 1, 00-001 Warszawa" |
| CelPobytu   | Cel pobytu                  | "Praca"                         |
| NumerSprawy | Numer sprawy w CRM          | "2024/001"                      |

## Dostępne transformacje (po "|")

| Transform        | Opis                              |
|-----------------|-----------------------------------|
| split_first     | Pierwsze słowo z Name (imię)      |
| split_last      | Ostatnie słowo z Name (nazwisko)  |
| uppercase       | Zamienia na wielkie litery        |
| year            | Rok z daty (Birthday)             |
| month           | Miesiąc z daty (Birthday)         |
| day             | Dzień z daty (Birthday)           |
| address_street  | Nazwa ulicy z Adres               |
| address_number  | Numer domu/mieszkania z Adres     |
| address_zip     | Kod pocztowy z Adres              |
| address_city    | Miasto z Adres                    |

## Instrukcje

1. Przeanalizuj każdy screenshot strony formularza.
2. Zidentyfikuj wszystkie pola do wypełnienia (kratki, linie, ramki).
3. Dla każdego pola:
   - Oszacuj współrzędne x, y w punktach PDF (pamiętaj o konwersji y)
   - Dobierz odpowiedni dataKey z tabeli powyżej
   - Dobierz fontSize (dla standardowych pól formularza: 9-10pt)
   - Jeśli pole ma ograniczoną szerokość, dodaj maxWidth
4. Wygeneruj kompletny plik JSON.
5. Po JSON dodaj krótką tabelę weryfikacyjną:
   | Strona | Pole | x | y | dataKey |
   z listą wszystkich wykrytych pól — żebym mógł szybko zweryfikować.

Załączam screenshoty stron formularza. Formularz to: [WPISZ NAZWĘ FORMULARZA]
```

---
