# Edytor mappingów PDF — plan implementacji

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dać adminowi wbudowany w aplikację wizualny edytor mappingów PDF — przeciąganie pól na realnej stronie PDF, podgląd z danymi klienta, trwały zapis bez deployu.

**Architecture:** Współrzędne pól (`x/y/fontSize/boxWidth/...`) przenosimy z plików JSON do tabeli Supabase `document_mappings`. Dostęp do tabeli idzie przez **server-only klient service-role** (`lib/supabase-admin.ts`), opakowany w `lib/document-store.ts` (read z fallbackiem do plików JSON, write). Generator czyta mapping przez store zamiast z dysku. Edytor renderuje stronę PDF przez `pdfjs-dist` na canvas, kładzie przeciągalne znaczniki, a wspólna matematyka współrzędnych i układania kratek żyje w `lib/pdf-coords.ts` (używana zarówno przez generator, jak i podgląd — gwarancja zgodności podgląd = wynik). Zapis przechodzi przez API route `PUT /api/documents/mappings/[id]` z weryfikacją roli `Admin`.

**Tech Stack:** Next.js 15 (App Router), React 18, TypeScript, `pdf-lib` (generowanie), `pdfjs-dist` (render w przeglądarce — NOWA zależność), `@supabase/supabase-js`, Vitest (NOWY runner testów).

**Odchylenie od specyfikacji (świadome):** Spec wspominał weryfikację roli przez `user_metadata.role`. W Supabase `user_metadata` jest edytowalne przez samego użytkownika, więc do autoryzacji **nie wolno** go używać. Plan sprawdza rolę przez tabelę `profiles` (`profiles.role = 'Admin'`), tak jak robi to już `getUserProfile()`. Dostęp do tabeli mappingów = klient service-role (bypassuje RLS), bo route generatora działa server-side bez sesji użytkownika i musi móc czytać mapping.

---

## Struktura plików

**Nowe:**
- `vitest.config.ts` — konfiguracja runnera testów
- `lib/pdf-coords.ts` — czysta matematyka: px↔pt + `layoutGrid`
- `lib/pdf-coords.test.ts` — testy jednostkowe pdf-coords
- `lib/supabase-admin.ts` — server-only klient service-role
- `lib/document-store.ts` — `getMapping` / `saveMapping` / `validateMapping`
- `lib/document-store.test.ts` — testy store (z mockiem supabase-admin)
- `supabase/migrations/2026-06-17-document-mappings.sql` — tabela + RLS + seed
- `app/api/documents/mappings/[id]/route.ts` — GET + PUT
- `components/pdf-canvas.tsx` — render strony PDF na canvas
- `components/mapping-editor.tsx` — edytor (overlay, drag, panel, podgląd)
- `app/documents/[templateId]/edit/page.tsx` — strona edytora
- `public/pdf.worker.min.mjs` — worker pdf.js (kopiowany z node_modules)

**Modyfikowane:**
- `package.json` — devDeps (vitest), dep (pdfjs-dist), skrypt `test`, skrypt kopiujący worker
- `lib/document-generator.ts` — używa `layoutGrid` i `getMapping` zamiast `fs` + własnej pętli
- `lib/document-types.ts` — (bez zmian strukturalnych; typy już wystarczają)
- `components/documents-page.tsx` — przycisk wejścia do edytora w widoku szablonu
- `.env.example` — dopisanie `SUPABASE_SERVICE_ROLE_KEY`

---

## Task 1: Runner testów (Vitest)

**Files:**
- Create: `vitest.config.ts`
- Create: `lib/_smoke.test.ts` (tymczasowy, usuwany na końcu taska)
- Modify: `package.json`

- [ ] **Step 1: Zainstaluj Vitest**

Run: `npm install -D vitest@^2`
Expected: dodane do `devDependencies`, brak błędów.

- [ ] **Step 2: Dodaj konfigurację**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
})
```

- [ ] **Step 3: Dodaj skrypt testowy**

W `package.json`, w sekcji `"scripts"`, dodaj:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Smoke test**

Create `lib/_smoke.test.ts`:

```ts
import { describe, it, expect } from "vitest"

describe("vitest", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 5: Uruchom i potwierdź zielone**

Run: `npm test`
Expected: PASS (1 test), Vitest startuje poprawnie.

- [ ] **Step 6: Usuń smoke test i commit**

```bash
rm lib/_smoke.test.ts
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest test runner"
```

---

## Task 2: `pdf-coords` — konwersja px↔pt

**Files:**
- Create: `lib/pdf-coords.ts`
- Test: `lib/pdf-coords.test.ts`

Kontekst osi: pdf-lib ma origin w **lewym-dolnym** rogu (Y rośnie w górę). Canvas/obraz ma origin w **lewym-górnym** (Y rośnie w dół). `imageHeightPx` to wysokość renderu w pikselach, `pageHeightPt` to wysokość strony w punktach. `scale = pixels / points`.

- [ ] **Step 1: Napisz failujący test**

Create `lib/pdf-coords.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { pixelToPoint, pointToPixel } from "@/lib/pdf-coords"

const dims = { pageWidthPt: 595, pageHeightPt: 842, imageWidthPx: 1190, imageHeightPx: 1684 }

describe("pixelToPoint", () => {
  it("maps top-left pixel to top of page in points", () => {
    const pt = pixelToPoint(0, 0, dims)
    expect(pt.x).toBeCloseTo(0, 1)
    expect(pt.y).toBeCloseTo(842, 1) // góra obrazu = max Y w punktach
  })

  it("maps a mid pixel correctly (Y flipped)", () => {
    const pt = pixelToPoint(595, 842, dims) // środek przy skali 2x
    expect(pt.x).toBeCloseTo(297.5, 1)
    expect(pt.y).toBeCloseTo(421, 1)
  })
})

describe("pointToPixel", () => {
  it("is the inverse of pixelToPoint", () => {
    const px = pointToPixel(235, 125, dims)
    const back = pixelToPoint(px.x, px.y, dims)
    expect(back.x).toBeCloseTo(235, 1)
    expect(back.y).toBeCloseTo(125, 1)
  })
})
```

- [ ] **Step 2: Uruchom — ma failować**

Run: `npx vitest run lib/pdf-coords.test.ts`
Expected: FAIL — `pixelToPoint is not a function` / brak modułu.

- [ ] **Step 3: Implementacja**

Create `lib/pdf-coords.ts`:

```ts
export interface PageDims {
  pageWidthPt: number
  pageHeightPt: number
  imageWidthPx: number
  imageHeightPx: number
}

export function pixelToPoint(px: number, py: number, d: PageDims): { x: number; y: number } {
  const scaleX = d.pageWidthPt / d.imageWidthPx
  const scaleY = d.pageHeightPt / d.imageHeightPx
  return {
    x: Math.round(px * scaleX * 10) / 10,
    y: Math.round((d.imageHeightPx - py) * scaleY * 10) / 10,
  }
}

export function pointToPixel(x: number, y: number, d: PageDims): { x: number; y: number } {
  const scaleX = d.imageWidthPx / d.pageWidthPt
  const scaleY = d.imageHeightPx / d.pageHeightPt
  return {
    x: x * scaleX,
    y: (d.pageHeightPt - y) * scaleY,
  }
}
```

- [ ] **Step 4: Uruchom — ma przejść**

Run: `npx vitest run lib/pdf-coords.test.ts`
Expected: PASS (4 asercje).

- [ ] **Step 5: Commit**

```bash
git add lib/pdf-coords.ts lib/pdf-coords.test.ts
git commit -m "feat: add pdf-coords pixel/point conversion"
```

---

## Task 3: `pdf-coords` — `layoutGrid`

**Files:**
- Modify: `lib/pdf-coords.ts`
- Modify: `lib/pdf-coords.test.ts`

To jest dokładnie logika z `drawGridField` w `lib/document-generator.ts:18-49`, wyciągnięta do czystej funkcji zwracającej listę glifów `{ char, x, y }` (zamiast rysować). Generator i podgląd będą jej używać wspólnie.

- [ ] **Step 1: Dopisz failujący test**

Dodaj do `lib/pdf-coords.test.ts`:

```ts
import { layoutGrid } from "@/lib/pdf-coords"

describe("layoutGrid", () => {
  const field = { x: 100, y: 700, boxWidth: 14, maxCharsPerRow: 5, rowHeight: 25 }

  it("places each char one box to the right", () => {
    const glyphs = layoutGrid("AB", field)
    expect(glyphs).toEqual([
      { char: "A", x: 100, y: 700 },
      { char: "B", x: 114, y: 700 },
    ])
  })

  it("uppercases input", () => {
    const glyphs = layoutGrid("ab", field)
    expect(glyphs.map(g => g.char)).toEqual(["A", "B"])
  })

  it("wraps to next row when a word does not fit", () => {
    const glyphs = layoutGrid("ABC DEF", field) // maxCharsPerRow=5
    const d = glyphs.find(g => g.char === "D")!
    expect(d.x).toBe(100)
    expect(d.y).toBe(675) // 700 - rowHeight
  })
})
```

- [ ] **Step 2: Uruchom — ma failować**

Run: `npx vitest run lib/pdf-coords.test.ts`
Expected: FAIL — `layoutGrid is not a function`.

- [ ] **Step 3: Implementacja**

Dodaj do `lib/pdf-coords.ts`:

```ts
export interface GridField {
  x: number
  y: number
  boxWidth?: number
  maxCharsPerRow?: number
  rowHeight?: number
}

export interface Glyph {
  char: string
  x: number
  y: number
}

export function layoutGrid(text: string, field: GridField): Glyph[] {
  const boxWidth = field.boxWidth ?? 14.2
  const maxCharsPerRow = field.maxCharsPerRow ?? 35
  const rowHeight = field.rowHeight ?? 25
  const words = text.toUpperCase().split(" ")

  const glyphs: Glyph[] = []
  let currentRow = 0
  let currentCol = 0

  for (const word of words) {
    if (currentCol + word.length > maxCharsPerRow && currentCol > 0) {
      currentRow++
      currentCol = 0
    }
    for (const char of word) {
      if (currentCol >= maxCharsPerRow) {
        currentRow++
        currentCol = 0
      }
      glyphs.push({
        char,
        x: field.x + currentCol * boxWidth,
        y: field.y - currentRow * rowHeight,
      })
      currentCol++
    }
    if (currentCol < maxCharsPerRow) currentCol++
  }
  return glyphs
}
```

- [ ] **Step 4: Uruchom — ma przejść**

Run: `npx vitest run lib/pdf-coords.test.ts`
Expected: PASS (wszystkie, łącznie z poprzednimi).

- [ ] **Step 5: Commit**

```bash
git add lib/pdf-coords.ts lib/pdf-coords.test.ts
git commit -m "feat: add layoutGrid to pdf-coords"
```

---

## Task 4: Generator używa `layoutGrid` (bez regresji)

**Files:**
- Modify: `lib/document-generator.ts:18-49` (usunięcie `drawGridField`, użycie `layoutGrid`)

Cel: zlikwidować duplikację logiki kratek. Zachowanie generowania bez zmian.

- [ ] **Step 1: Podmień `drawGridField` na wrapper nad `layoutGrid`**

W `lib/document-generator.ts` dodaj import na górze (przy istniejących importach):

```ts
import { layoutGrid } from "@/lib/pdf-coords"
```

Zastąp całą funkcję `drawGridField` (linie 18-49) tą wersją:

```ts
function drawGridField(page: PDFPage, text: string, field: FieldMapping, font: PDFFont): void {
  for (const g of layoutGrid(text, field)) {
    page.drawText(g.char, { x: g.x, y: g.y, size: field.fontSize, font })
  }
}
```

- [ ] **Step 2: Sanity — typecheck**

Run: `npx tsc --noEmit`
Expected: brak błędów typów w `lib/document-generator.ts`.

- [ ] **Step 3: Weryfikacja ręczna generowania**

Run: `npm run dev`, otwórz `/documents`, wybierz szablon „Wniosek o pobyt czasowy", wybierz dowolnego klienta, „Generuj dokument".
Expected: PDF generuje się tak jak wcześniej — imię w kratkach, adres i cel na właściwych stronach. Brak zmiany wizualnej względem stanu sprzed taska.

- [ ] **Step 4: Commit**

```bash
git add lib/document-generator.ts
git commit -m "refactor: generator uses shared layoutGrid"
```

---

## Task 5: Migracja Supabase — tabela `document_mappings`

**Files:**
- Create: `supabase/migrations/2026-06-17-document-mappings.sql`

Tabela trzyma to samo, co plik JSON. Klucz `id` = **stem nazwy pliku / templateId** (np. `wniosek-pobyt-czasowy`), bo właśnie tym kluczem woła generator. RLS domyślnie blokuje wszystko — dostęp tylko przez service-role (bypass RLS); żaden klient z anon/authenticated key nie czyta ani nie pisze bezpośrednio.

- [ ] **Step 1: Napisz migrację**

Create `supabase/migrations/2026-06-17-document-mappings.sql`:

```sql
create table if not exists public.document_mappings (
  id          text primary key,
  name        text not null,
  pdf_path    text not null,
  fields      jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table public.document_mappings enable row level security;
-- Brak policy = brak dostępu dla anon/authenticated.
-- Dostęp wyłącznie przez klienta service-role (bypassuje RLS).

-- Seed: obecny mapping z mappings/wniosek-pobyt-czasowy.json
insert into public.document_mappings (id, name, pdf_path, fields)
values (
  'wniosek-pobyt-czasowy',
  'Załącznik nr 1 do wniosku o pobyt czasowy',
  '/forms/wniosek-pobyt-czasowy.pdf',
  '[
    {"page":1,"x":235,"y":125,"dataKey":"Name|uppercase","fontSize":11,"type":"grid","boxWidth":13.8,"maxCharsPerRow":23,"rowHeight":25},
    {"page":2,"x":55,"y":780,"dataKey":"Adres|address_street","fontSize":10,"maxWidth":250},
    {"page":2,"x":320,"y":780,"dataKey":"Adres|address_number","fontSize":10,"maxWidth":100},
    {"page":2,"x":55,"y":750,"dataKey":"Adres|address_zip","fontSize":10,"maxWidth":80},
    {"page":2,"x":150,"y":750,"dataKey":"Adres|address_city","fontSize":10,"maxWidth":200},
    {"page":3,"x":55,"y":720,"dataKey":"CelPobytu","fontSize":10,"maxWidth":480}
  ]'::jsonb
)
on conflict (id) do nothing;
```

- [ ] **Step 2: Zastosuj migrację w Supabase**

Wykonaj zawartość pliku w panelu Supabase → SQL Editor (lub `supabase db push`, jeśli CLI jest skonfigurowane).
Expected: tabela `document_mappings` istnieje, ma 1 wiersz (`id = 'wniosek-pobyt-czasowy'`).

- [ ] **Step 3: Potwierdź seed**

W SQL Editor: `select id, name, jsonb_array_length(fields) as n from public.document_mappings;`
Expected: jeden wiersz, `n = 6`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/2026-06-17-document-mappings.sql
git commit -m "feat: add document_mappings table + seed"
```

---

## Task 6: Klient service-role (server-only)

**Files:**
- Create: `lib/supabase-admin.ts`
- Modify: `.env.example`

`SUPABASE_SERVICE_ROLE_KEY` weź z Supabase → Project Settings → API → `service_role` secret. Dodaj go do `.env` (lokalnie) i do środowiska na VPS. **Nigdy** nie prefiksuj go `NEXT_PUBLIC_` — to sekret server-only.

- [ ] **Step 1: Dodaj zmienną do `.env.example`**

Dopisz w `.env.example`:

```
SUPABASE_SERVICE_ROLE_KEY=...
```

Oraz dodaj realny klucz do lokalnego `.env` (plik nie jest w repo).

- [ ] **Step 2: Implementacja klienta**

Create `lib/supabase-admin.ts`:

```ts
import "server-only"
import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  throw new Error("Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY w środowisku")
}

// Klient z kluczem service-role — bypassuje RLS. Wyłącznie po stronie serwera.
export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
```

- [ ] **Step 3: Zainstaluj `server-only`**

Run: `npm install server-only`
Expected: dodane do dependencies (gwarantuje błąd buildu, gdyby ktoś zaimportował ten plik do kodu klienta).

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: brak błędów.

- [ ] **Step 5: Commit**

```bash
git add lib/supabase-admin.ts .env.example package.json package-lock.json
git commit -m "feat: add server-only supabase service-role client"
```

---

## Task 7: `document-store` — getMapping / saveMapping / validateMapping

**Files:**
- Create: `lib/document-store.ts`
- Test: `lib/document-store.test.ts`

`getMapping`: czyta z `document_mappings` (service-role); gdy brak wiersza lub błąd DB → fallback do `mappings/${id}.json`. `saveMapping`: upsert. `validateMapping`: sprawdza strukturę przed zapisem (zwraca listę błędów; pusta = OK).

- [ ] **Step 1: Napisz failujące testy**

Create `lib/document-store.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { validateMapping } from "@/lib/document-store"

describe("validateMapping", () => {
  const valid = {
    id: "x", name: "X", pdfPath: "/forms/x.pdf",
    fields: [{ page: 1, x: 10, y: 20, dataKey: "Name", fontSize: 10 }],
  }

  it("accepts a well-formed mapping", () => {
    expect(validateMapping(valid)).toEqual([])
  })

  it("rejects missing pdfPath", () => {
    const bad = { ...valid, pdfPath: "" }
    expect(validateMapping(bad).length).toBeGreaterThan(0)
  })

  it("rejects non-numeric coordinates", () => {
    const bad = { ...valid, fields: [{ page: 1, x: "nope", y: 20, dataKey: "Name", fontSize: 10 }] }
    expect(validateMapping(bad as never).length).toBeGreaterThan(0)
  })

  it("rejects grid field without boxWidth", () => {
    const bad = { ...valid, fields: [{ page: 1, x: 10, y: 20, dataKey: "Name", fontSize: 10, type: "grid" }] }
    expect(validateMapping(bad as never).length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Uruchom — ma failować**

Run: `npx vitest run lib/document-store.test.ts`
Expected: FAIL — brak `validateMapping`.

- [ ] **Step 3: Implementacja**

Create `lib/document-store.ts`:

```ts
import fs from "fs/promises"
import path from "path"
import { supabaseAdmin } from "@/lib/supabase-admin"
import type { DocumentMapping, FieldMapping } from "@/lib/document-types"

export function validateMapping(m: DocumentMapping): string[] {
  const errors: string[] = []
  if (!m || typeof m !== "object") return ["Mapping nie jest obiektem"]
  if (!m.name) errors.push("Brak name")
  if (!m.pdfPath) errors.push("Brak pdfPath")
  if (!Array.isArray(m.fields)) {
    errors.push("fields nie jest tablicą")
    return errors
  }
  m.fields.forEach((f: FieldMapping, i: number) => {
    const num = (v: unknown) => typeof v === "number" && Number.isFinite(v)
    if (!num(f.page)) errors.push(`Pole ${i}: page nie jest liczbą`)
    if (!num(f.x)) errors.push(`Pole ${i}: x nie jest liczbą`)
    if (!num(f.y)) errors.push(`Pole ${i}: y nie jest liczbą`)
    if (!num(f.fontSize)) errors.push(`Pole ${i}: fontSize nie jest liczbą`)
    if (!f.dataKey) errors.push(`Pole ${i}: brak dataKey`)
    if (f.type === "grid" && !num(f.boxWidth)) errors.push(`Pole ${i}: grid bez boxWidth`)
  })
  return errors
}

async function readFromFile(id: string): Promise<DocumentMapping> {
  const p = path.join(process.cwd(), "mappings", `${id}.json`)
  const raw = await fs.readFile(p, "utf-8")
  return JSON.parse(raw) as DocumentMapping
}

export async function getMapping(id: string): Promise<DocumentMapping> {
  try {
    const { data, error } = await supabaseAdmin
      .from("document_mappings")
      .select("id, name, pdf_path, fields")
      .eq("id", id)
      .single()
    if (error || !data) throw error ?? new Error("brak wiersza")
    return { id: data.id, name: data.name, pdfPath: data.pdf_path, fields: data.fields }
  } catch {
    // Fallback: plik JSON z repo (seed / DB niedostępne)
    return readFromFile(id)
  }
}

export async function saveMapping(id: string, mapping: DocumentMapping): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("document_mappings")
    .upsert({
      id,
      name: mapping.name,
      pdf_path: mapping.pdfPath,
      fields: mapping.fields,
      updated_at: new Date().toISOString(),
    })
    .select("updated_at")
    .single()
  if (error) throw new Error(`Zapis mappingu nie powiódł się: ${error.message}`)
  return data.updated_at
}
```

- [ ] **Step 4: Uruchom — ma przejść**

Run: `npx vitest run lib/document-store.test.ts`
Expected: PASS (4 asercje). (Testy dotykają tylko `validateMapping`, więc import `supabase-admin` nie wykona zapytań — ale moduł się ładuje; jeśli brak env w teście, dodaj na górze pliku testu `vi.mock("@/lib/supabase-admin", () => ({ supabaseAdmin: {} }))`.)

- [ ] **Step 5: Jeśli test failuje na imporcie env — dodaj mock i uruchom ponownie**

Na górze `lib/document-store.test.ts`, pod importami, dodaj:

```ts
vi.mock("@/lib/supabase-admin", () => ({ supabaseAdmin: {} }))
```

Run: `npx vitest run lib/document-store.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/document-store.ts lib/document-store.test.ts
git commit -m "feat: add document-store with DB read/write and validation"
```

---

## Task 8: Generator czyta przez `getMapping`

**Files:**
- Modify: `lib/document-generator.ts:51-58` (zamiana `fs.readFile` mappingu na `getMapping`)

- [ ] **Step 1: Podmień odczyt mappingu**

W `lib/document-generator.ts` dodaj import:

```ts
import { getMapping } from "@/lib/document-store"
```

Usuń linie czytające plik mappingu (obecnie ~52-54):

```ts
const mappingPath = path.join(process.cwd(), "mappings", `${templateId}.json`)
const mappingRaw = await fs.readFile(mappingPath, "utf-8")
const mapping: DocumentMapping = JSON.parse(mappingRaw)
```

i zastąp jedną linią:

```ts
const mapping: DocumentMapping = await getMapping(templateId)
```

(Pozostały odczyt — PDF i font przez `fs` — zostaje bez zmian.)

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: brak błędów. (Jeśli `path`/`DocumentMapping` przestały być używane gdzie indziej — usuń martwe importy; PDF/font nadal używają `path` i `fs`.)

- [ ] **Step 3: Weryfikacja ręczna**

Run: `npm run dev`, `/documents` → generuj „Wniosek o pobyt czasowy" dla klienta.
Expected: PDF identyczny jak wcześniej — teraz dane pochodzą z tabeli `document_mappings`.

- [ ] **Step 4: Test fallbacku (DB → plik)**

Tymczasowo w SQL Editor: `update public.document_mappings set name = 'ZMIANA' where id = 'wniosek-pobyt-czasowy';` — wygeneruj ponownie (powinno działać, name nie wpływa na render). Następnie `delete from public.document_mappings where id='wniosek-pobyt-czasowy';`, wygeneruj ponownie.
Expected: po delete generowanie nadal działa (fallback do pliku JSON). Przywróć wiersz uruchamiając ponownie INSERT z migracji (Task 5, Step 1).

- [ ] **Step 5: Commit**

```bash
git add lib/document-generator.ts
git commit -m "refactor: generator reads mapping from document-store"
```

---

## Task 9: API route GET/PUT mappingu

**Files:**
- Create: `app/api/documents/mappings/[id]/route.ts`

GET zwraca mapping (przez `getMapping`). PUT: odczytuje token Bearer z nagłówka, waliduje użytkownika, sprawdza `profiles.role = 'Admin'`, waliduje strukturę (`validateMapping`), zapisuje (`saveMapping`). Wzór odczytu tokenu: klient wysyła `Authorization: Bearer <access_token>` z `supabase.auth.getSession()`.

- [ ] **Step 1: Implementacja route**

Create `app/api/documents/mappings/[id]/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getMapping, saveMapping, validateMapping } from "@/lib/document-store"
import { supabaseAdmin } from "@/lib/supabase-admin"
import type { DocumentMapping } from "@/lib/document-types"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const mapping = await getMapping(id)
    return NextResponse.json(mapping)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: `Nie znaleziono mappingu: ${message}` }, { status: 404 })
  }
}

async function requireAdmin(req: NextRequest): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const auth = req.headers.get("authorization") ?? ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : ""
  if (!token) return { ok: false, status: 401, error: "Brak tokenu" }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const userClient = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } })
  const { data: { user }, error } = await userClient.auth.getUser()
  if (error || !user) return { ok: false, status: 401, error: "Nieprawidłowa sesja" }

  const { data: profile } = await supabaseAdmin
    .from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "Admin") return { ok: false, status: 403, error: "Wymagana rola Admin" }
  return { ok: true }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const gate = await requireAdmin(req)
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  let body: DocumentMapping
  try {
    body = (await req.json()) as DocumentMapping
  } catch {
    return NextResponse.json({ error: "Nieprawidłowy JSON" }, { status: 400 })
  }

  const errors = validateMapping(body)
  if (errors.length) return NextResponse.json({ error: "Walidacja", details: errors }, { status: 400 })

  try {
    const updatedAt = await saveMapping(id, body)
    return NextResponse.json({ ok: true, updated_at: updatedAt })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: brak błędów. (Uwaga: w Next 15 `params` jest Promise — sygnatury powyżej to uwzględniają.)

- [ ] **Step 3: Weryfikacja GET**

Run: `npm run dev`, w przeglądarce/cURL: `GET http://localhost:3000/api/documents/mappings/wniosek-pobyt-czasowy`.
Expected: JSON mappingu z 6 polami.

- [ ] **Step 4: Weryfikacja PUT bez tokenu**

Run: `curl -X PUT http://localhost:3000/api/documents/mappings/wniosek-pobyt-czasowy -H "Content-Type: application/json" -d '{}'`
Expected: 401 `{ "error": "Brak tokenu" }`.

- [ ] **Step 5: Commit**

```bash
git add app/api/documents/mappings/
git commit -m "feat: add GET/PUT mappings API with admin gate"
```

---

## Task 10: `pdf-canvas` — render strony PDF

**Files:**
- Create: `components/pdf-canvas.tsx`
- Create: `public/pdf.worker.min.mjs` (kopiowany)
- Modify: `package.json` (dep + skrypt kopiujący worker)

`pdfjs-dist` v4 renderuje stronę na `<canvas>`. Worker musi być serwowany lokalnie (bez CDN). Kopiujemy `pdf.worker.min.mjs` do `public/` i wskazujemy `GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"`.

- [ ] **Step 1: Zainstaluj pdfjs-dist**

Run: `npm install pdfjs-dist@^4`
Expected: dodane do dependencies.

- [ ] **Step 2: Skopiuj worker do public i dodaj skrypt postinstall**

Run (jednorazowo, ręcznie):
`cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs`

W `package.json` dodaj skrypt, by worker odtwarzał się po instalacji:

```json
"postinstall": "node -e \"require('fs').copyFileSync('node_modules/pdfjs-dist/build/pdf.worker.min.mjs','public/pdf.worker.min.mjs')\""
```

Expected: `public/pdf.worker.min.mjs` istnieje.

- [ ] **Step 3: Implementacja komponentu**

Create `components/pdf-canvas.tsx`:

```tsx
"use client"

import { useEffect, useRef } from "react"
import * as pdfjsLib from "pdfjs-dist"
import type { PageDims } from "@/lib/pdf-coords"

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"

interface Props {
  pdfUrl: string
  page: number // 1-based
  renderScale?: number
  onReady?: (dims: PageDims) => void
}

export function PdfCanvas({ pdfUrl, page, renderScale = 2, onReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let cancelled = false
    const canvas = canvasRef.current
    if (!canvas) return

    ;(async () => {
      const doc = await pdfjsLib.getDocument(pdfUrl).promise
      if (cancelled) return
      const pdfPage = await doc.getPage(page)
      const viewport = pdfPage.getViewport({ scale: renderScale })
      const ctx = canvas.getContext("2d")!
      canvas.width = viewport.width
      canvas.height = viewport.height
      await pdfPage.render({ canvasContext: ctx, viewport }).promise
      if (cancelled) return
      const ptViewport = pdfPage.getViewport({ scale: 1 })
      onReady?.({
        pageWidthPt: ptViewport.width,
        pageHeightPt: ptViewport.height,
        imageWidthPx: viewport.width,
        imageHeightPx: viewport.height,
      })
    })()

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfUrl, page, renderScale])

  return <canvas ref={canvasRef} className="block max-w-none" />
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: brak błędów.

- [ ] **Step 5: Smoke render (tymczasowa strona)**

Tymczasowo dodaj do dowolnej strony dev render `<PdfCanvas pdfUrl="/forms/wniosek-pobyt-czasowy.pdf" page={1} />`, otwórz w przeglądarce.
Expected: pierwsza strona formularza renderuje się na canvas. Usuń tymczasowy render po sprawdzeniu.

- [ ] **Step 6: Commit**

```bash
git add components/pdf-canvas.tsx public/pdf.worker.min.mjs package.json package-lock.json
git commit -m "feat: add PdfCanvas page renderer (pdfjs-dist)"
```

---

## Task 11: `mapping-editor` — edytor wizualny

**Files:**
- Create: `components/mapping-editor.tsx`

Składa: `PdfCanvas` + warstwę overlay z przeciągalnymi znacznikami pól i nakładką podglądu (`resolveField` + `layoutGrid` / pozycja tekstu). Panel boczny edytuje wybrane pole. Wybór klienta-próbki z `getClients`. Przyciski „Generuj prawdziwy PDF" (POST `/api/documents/generate`, iframe) i „Zapisz" (PUT z tokenem). To największy komponent — UI testujemy ręcznie; cała logika liczbowa jest już pokryta testami `pdf-coords`.

- [ ] **Step 1: Szkielet stanu + ładowanie mappingu i klientów**

Create `components/mapping-editor.tsx`:

```tsx
"use client"

import { useEffect, useState } from "react"
import { PdfCanvas } from "@/components/pdf-canvas"
import { resolveField } from "@/lib/document-resolver"
import { pointToPixel, pixelToPoint, layoutGrid, type PageDims } from "@/lib/pdf-coords"
import { getClients, supabase, type Client } from "@/lib/superbase"
import type { DocumentMapping, FieldMapping } from "@/lib/document-types"

export function MappingEditor({ templateId }: { templateId: string }) {
  const [mapping, setMapping] = useState<DocumentMapping | null>(null)
  const [page, setPage] = useState(1)
  const [dims, setDims] = useState<PageDims | null>(null)
  const [selected, setSelected] = useState<number>(-1)
  const [clients, setClients] = useState<Client[]>([])
  const [sample, setSample] = useState<Client | null>(null)
  const [status, setStatus] = useState("")
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/documents/mappings/${templateId}`)
      .then(r => r.json())
      .then((m: DocumentMapping) => setMapping(m))
      .catch(() => setStatus("Nie udało się wczytać mappingu"))
    getClients().then(setClients).catch(() => {})
  }, [templateId])

  if (!mapping) return <div className="p-6 text-text-mute">Ładowanie…</div>

  const pdfSrc = mapping.pdfPath
  const pageFields = mapping.fields
    .map((f, idx) => ({ f, idx }))
    .filter(({ f }) => f.page === page)

  function updateField(idx: number, patch: Partial<FieldMapping>) {
    setMapping(m => m ? { ...m, fields: m.fields.map((f, i) => i === idx ? { ...f, ...patch } : f) } : m)
  }

  return (
    <div className="flex h-screen">
      {/* panele i canvas — kolejne kroki */}
      <div className="flex-1 overflow-auto p-4" style={{ position: "relative" }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <PdfCanvas pdfUrl={pdfSrc} page={page} onReady={setDims} />
          {/* overlay — krok 2 */}
        </div>
      </div>
      <aside className="w-80 border-l border-border overflow-auto p-4">
        {/* panel — krok 3 */}
        <div className="text-[11px] text-text-mute">{status}</div>
      </aside>
    </div>
  )
}
```

- [ ] **Step 2: Warstwa overlay — znaczniki + podgląd**

Wewnątrz `<div style={{ position: "relative", display: "inline-block" }}>`, pod `<PdfCanvas>`, dodaj overlay (renderuje się gdy `dims` gotowe):

```tsx
{dims && pageFields.map(({ f, idx }) => {
  const px = pointToPixel(f.x, f.y, dims)
  const value = sample ? resolveField(sample, f.dataKey) : f.dataKey
  return (
    <div key={idx}>
      {/* znacznik (drag) */}
      <div
        onMouseDown={e => startDrag(e, idx)}
        onClick={() => setSelected(idx)}
        title={f.dataKey}
        style={{
          position: "absolute", left: px.x, top: px.y, width: 12, height: 12,
          marginLeft: -6, marginTop: -6, borderRadius: "50%", cursor: "grab",
          background: f.type === "grid" ? "var(--success)" : "var(--brand)",
          boxShadow: idx === selected ? "0 0 0 3px white" : "none", zIndex: 3,
        }}
      />
      {/* podgląd tekstu */}
      {sample && (f.type === "grid"
        ? layoutGrid(value, f).map((g, gi) => {
            const gp = pointToPixel(g.x, g.y, dims)
            return <span key={gi} style={previewStyle(gp.x, gp.y, f.fontSize, dims)}>{g.char}</span>
          })
        : <span style={previewStyle(px.x, px.y, f.fontSize, dims)}>{value}</span>
      )}
    </div>
  )
})}
```

Dodaj helpery i logikę drag w ciele komponentu (nad `return`):

```tsx
function previewStyle(x: number, y: number, fontSizePt: number, d: PageDims): React.CSSProperties {
  const scale = d.imageHeightPx / d.pageHeightPt
  return {
    position: "absolute", left: x, top: y, transform: "translateY(-100%)",
    fontSize: fontSizePt * scale, fontFamily: "var(--font-sans), sans-serif",
    color: "#111", whiteSpace: "nowrap", pointerEvents: "none", zIndex: 2,
  }
}

function startDrag(e: React.MouseEvent, idx: number) {
  e.preventDefault()
  setSelected(idx)
  const wrapper = (e.currentTarget as HTMLElement).parentElement!.parentElement!
  const move = (ev: MouseEvent) => {
    if (!dims) return
    const rect = wrapper.getBoundingClientRect()
    const pt = pixelToPoint(ev.clientX - rect.left, ev.clientY - rect.top, dims)
    updateField(idx, { x: pt.x, y: pt.y })
  }
  const up = () => {
    window.removeEventListener("mousemove", move)
    window.removeEventListener("mouseup", up)
  }
  window.addEventListener("mousemove", move)
  window.addEventListener("mouseup", up)
}
```

- [ ] **Step 3: Panel boczny — wybór klienta, edycja pola, strona, zapis**

Zastąp komentarz `{/* panel — krok 3 */}` zawartością:

```tsx
<div className="mb-4">
  <label className="block text-[11px] text-text-mute mb-1">Klient-próbka</label>
  <select className="w-full bg-surface border border-border rounded px-2 py-1 text-[12px]"
    onChange={e => setSample(clients.find(c => String(c.id) === e.target.value) ?? null)}>
    <option value="">— podgląd kluczy —</option>
    {clients.map(c => <option key={c.id} value={c.id}>{c.Name}</option>)}
  </select>
</div>

<div className="mb-4 flex items-center gap-2">
  <label className="text-[11px] text-text-mute">Strona</label>
  <input type="number" min={1} value={page}
    onChange={e => setPage(parseInt(e.target.value) || 1)}
    className="w-16 bg-surface border border-border rounded px-2 py-1 text-[12px]" />
</div>

{selected >= 0 && mapping.fields[selected] && (() => {
  const f = mapping.fields[selected]
  return (
    <div className="border border-border rounded p-3 mb-4 flex flex-col gap-2">
      <div className="text-[11px] font-bold text-text-mute uppercase">Pole #{selected}</div>
      <label className="text-[11px] text-text-mute">dataKey
        <input value={f.dataKey} onChange={e => updateField(selected, { dataKey: e.target.value })}
          className="w-full bg-surface border border-border rounded px-2 py-1 text-[12px]" /></label>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[11px] text-text-mute">x
          <input type="number" value={f.x} onChange={e => updateField(selected, { x: parseFloat(e.target.value) })}
            className="w-full bg-surface border border-border rounded px-2 py-1 text-[12px]" /></label>
        <label className="text-[11px] text-text-mute">y
          <input type="number" value={f.y} onChange={e => updateField(selected, { y: parseFloat(e.target.value) })}
            className="w-full bg-surface border border-border rounded px-2 py-1 text-[12px]" /></label>
        <label className="text-[11px] text-text-mute">fontSize
          <input type="number" value={f.fontSize} onChange={e => updateField(selected, { fontSize: parseFloat(e.target.value) })}
            className="w-full bg-surface border border-border rounded px-2 py-1 text-[12px]" /></label>
        {f.type === "grid" && (
          <label className="text-[11px] text-text-mute">boxWidth
            <input type="number" step="0.1" value={f.boxWidth ?? 0}
              onChange={e => updateField(selected, { boxWidth: parseFloat(e.target.value) })}
              className="w-full bg-surface border border-border rounded px-2 py-1 text-[12px]" /></label>
        )}
      </div>
    </div>
  )
})()}

<button onClick={handleSave}
  className="w-full h-9 rounded bg-[var(--brand)] text-white text-[13px] font-semibold mb-2">
  Zapisz
</button>
<button onClick={handleGenerate}
  className="w-full h-9 rounded border border-border text-[13px] font-medium mb-3">
  Generuj prawdziwy PDF
</button>
{pdfUrl && <iframe src={pdfUrl} className="w-full h-64 border border-border rounded" title="PDF" />}
```

Dodaj handlery w ciele komponentu (nad `return`):

```tsx
async function handleSave() {
  if (!mapping) return
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) { setStatus("Brak sesji — zaloguj się"); return }
  const res = await fetch(`/api/documents/mappings/${templateId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(mapping),
  })
  const body = await res.json()
  setStatus(res.ok ? "✓ Zapisano" : `Błąd: ${body.error}${body.details ? " — " + body.details.join("; ") : ""}`)
}

async function handleGenerate() {
  if (!sample) { setStatus("Wybierz klienta-próbkę"); return }
  const res = await fetch("/api/documents/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ templateId, client: sample }),
  })
  if (!res.ok) { setStatus("Błąd generowania"); return }
  const blob = await res.blob()
  setPdfUrl(URL.createObjectURL(blob))
}
```

Uwaga DRY: przy zapisie wysyłamy `mapping` z bieżącego stanu — przeciąganie i panel modyfikują ten sam obiekt, więc „Zapisz" utrwala dokładnie to, co widać.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: brak błędów.

- [ ] **Step 5: Weryfikacja ręczna (po Tasku 12, gdy jest strona)**

Pozostaw do kroku weryfikacji w Tasku 12.

- [ ] **Step 6: Commit**

```bash
git add components/mapping-editor.tsx
git commit -m "feat: add visual mapping editor component"
```

---

## Task 12: Strona edytora + wejście z `/documents`

**Files:**
- Create: `app/documents/[templateId]/edit/page.tsx`
- Modify: `components/documents-page.tsx` (przycisk „Edytuj mapping" w `ConfigureView`)

- [ ] **Step 1: Strona edytora**

Create `app/documents/[templateId]/edit/page.tsx`:

```tsx
import { MappingEditor } from "@/components/mapping-editor"

export default async function EditMappingPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params
  return <MappingEditor templateId={templateId} />
}
```

- [ ] **Step 2: Przycisk wejścia w `ConfigureView`**

W `components/documents-page.tsx`, w `ConfigureView`, obok nagłówka szablonu (po bloku „Header", ~linia 315) dodaj link do edytora. Dodaj import na górze pliku:

```tsx
import Link from "next/link"
```

I w JSX, pod blokiem nagłówka:

```tsx
<Link
  href={`/documents/${template.id}/edit`}
  className="inline-flex items-center gap-1.5 px-3 h-8 rounded-btn border border-border bg-transparent text-text text-[12px] font-medium hover:bg-surface-hover transition-colors mb-4"
>
  Edytuj mapping (admin)
</Link>
```

- [ ] **Step 3: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: brak błędów.

- [ ] **Step 4: Weryfikacja ręczna pełnego flow**

Run: `npm run dev`. Zaloguj się jako Admin. `/documents` → wybierz „Wniosek o pobyt czasowy" → „Edytuj mapping (admin)".
Expected:
- Strona 1 PDF renderuje się; widać znaczniki pól.
- Wybór klienta-próbki → pojawia się podgląd tekstu (imię w kratkach).
- Przeciągnięcie znacznika przesuwa pole; panel pokazuje nowe `x/y`.
- „Generuj prawdziwy PDF" → iframe z realnym PDF zgodnym z podglądem.
- „Zapisz" → „✓ Zapisano"; po odświeżeniu zmiany utrzymane.
- Konto nie-Admin → „Zapisz" zwraca błąd 403 (status w panelu).

- [ ] **Step 5: Uruchom pełen zestaw testów**

Run: `npm test`
Expected: wszystkie testy zielone (`pdf-coords`, `document-store`).

- [ ] **Step 6: Commit**

```bash
git add app/documents/ components/documents-page.tsx
git commit -m "feat: wire mapping editor into documents page"
```

---

## Self-review (pokrycie specyfikacji)

- Render realnej strony PDF (pdf.js) → Task 10. ✅
- Przeciągalne znaczniki + panel parametrów → Task 11. ✅
- Podgląd DOM + przycisk realnego PDF → Task 11 (overlay + `handleGenerate`). ✅
- Wspólna matematyka (podgląd = wynik) → Task 2-3 (`pdf-coords`), użyte w generatorze (Task 4) i edytorze (Task 11). ✅
- Magazyn Supabase + fallback do plików → Task 5-8. ✅
- API z bramką roli Admin (przez `profiles`, nie `user_metadata`) → Task 9. ✅
- Walidacja przed zapisem → Task 7 (`validateMapping`), użyta w Task 9. ✅
- Testy `pdf-coords`, `document-store`, walidacji → Task 2, 3, 7. ✅
- Wejście do edytora z `/documents` → Task 12. ✅

**Świadomie pominięte (zgodnie z „poza zakresem" w specu):** optimistic-lock przez `updated_at` (spec wymieniał jako opcję; pominięty dla prostoty — `saveMapping` robi czysty upsert; do dołożenia, jeśli wielu adminów edytuje naraz), upload nowych PDF, doprowadzanie reszty makiety `documents-page.tsx`.

**Uwaga wdrożeniowa:** na VPS ustaw `SUPABASE_SERVICE_ROLE_KEY` w środowisku oraz uruchom migrację z Taska 5 na produkcyjnej bazie przed pierwszym użyciem edytora.
