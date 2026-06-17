# PDF Document Composer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dodać edytowalny flow generowania PDF w `/documents` — admin wybiera klienta (lub wpisuje dane ręcznie), trafia do panelu WYSIWYG z wgranymi danymi, może poprawić treść/pozycję/fontSize i wygenerować PDF — bez zapisywania tych zmian do mappingu.

**Architecture:** Wartości pól (DANE) stają się efemerycznymi nadpisaniami per‑generowanie (`FieldOverride[]`), przekazywanymi tylko w body `POST /generate`; pozycje mappingu (MAPPING) idą osobnym kanałem `PUT /mappings/[id]` i nie są ruszane. Logika precedencji i zasiewania wartości żyje w czystym module `lib/document-overrides.ts` (testowalna pod vitest). WYSIWYG‑rendering canvasu jest wyciągnięty ze `mapping-editor.tsx` do współdzielonego `<PdfFieldLayer>`, używanego przez edytor pozycji i nowy `<DocumentComposer>` osadzony w stronie `/documents`.

**Tech Stack:** Next.js 15 App Router, TypeScript, React 18, pdf-lib + @pdf-lib/fontkit (generowanie), pdfjs-dist (podgląd), Supabase, Vitest (node env, `lib/**/*.test.ts`).

---

## File Structure

**Tworzone:**
- `lib/document-overrides.ts` — czysty moduł: typ `FieldOverride` (re‑export z document-types), `seedValues`, `fieldValue`, `fieldGeometry`, `buildOverrides`.
- `lib/document-overrides.test.ts` — testy jednostkowe powyższego.
- `components/pdf-field-layer.tsx` — współdzielona warstwa canvas (PdfCanvas + znaczniki + pozycjonowany podgląd + drag).
- `components/document-composer.tsx` — panel edycji DANYCH (WYSIWYG) dla flow generowania.

**Modyfikowane:**
- `lib/document-types.ts` — dodanie interfejsu `FieldOverride`.
- `lib/document-generator.ts` — `generateDocument` przyjmuje `overrides`, używa helperów.
- `app/api/documents/generate/route.ts` — body przyjmuje `overrides`, `client` opcjonalny.
- `components/mapping-editor.tsx` — rewire renderingu na `<PdfFieldLayer>` (bez zmian funkcjonalnych).
- `components/documents-page.tsx` — kroki `browse → select → compose`, flaga dostępności, usunięcie martwej makiety.

---

## Task 1: Typ `FieldOverride` + czysty moduł logiki overrides

**Files:**
- Modify: `lib/document-types.ts`
- Create: `lib/document-overrides.ts`
- Test: `lib/document-overrides.test.ts`

- [ ] **Step 1: Dodaj typ `FieldOverride` do `lib/document-types.ts`**

Dopisz na końcu pliku (po `DocumentTemplate`):

```ts
export interface FieldOverride {
  value: string        // finalna treść pola (bez reaplikacji transformacji resolveField)
  x?: number           // nudge pozycji per-dokument (opcjonalny)
  y?: number
  fontSize?: number    // per-dokument (opcjonalny)
}
```

- [ ] **Step 2: Napisz failing test `lib/document-overrides.test.ts`**

```ts
import { describe, it, expect } from "vitest"
import { seedValues, fieldValue, fieldGeometry, buildOverrides } from "@/lib/document-overrides"
import type { FieldMapping } from "@/lib/document-types"
import type { Client } from "@/lib/superbase"

const client = { Name: "Jan Kowalski", CelPobytu: "Praca" } as unknown as Client

const nameField: FieldMapping = { page: 1, x: 10, y: 20, dataKey: "Name", fontSize: 11 }
const upperField: FieldMapping = { page: 1, x: 30, y: 40, dataKey: "Name|uppercase", fontSize: 9 }

describe("seedValues", () => {
  it("seeds from client via resolveField", () => {
    expect(seedValues(client, [nameField, upperField])).toEqual(["Jan Kowalski", "JAN KOWALSKI"])
  })
  it("seeds empty strings when client is null (manual entry)", () => {
    expect(seedValues(null, [nameField, upperField])).toEqual(["", ""])
  })
})

describe("fieldValue", () => {
  it("override value wins over client (no transform reapplied)", () => {
    expect(fieldValue(upperField, client, { value: "anna nowak" })).toBe("anna nowak")
  })
  it("empty override value is respected (renders nothing)", () => {
    expect(fieldValue(nameField, client, { value: "" })).toBe("")
  })
  it("falls back to resolveField when no override and client present", () => {
    expect(fieldValue(nameField, client, undefined)).toBe("Jan Kowalski")
  })
  it("returns empty string when no override and no client", () => {
    expect(fieldValue(nameField, null, undefined)).toBe("")
  })
})

describe("fieldGeometry", () => {
  it("uses override coords/fontSize when present", () => {
    expect(fieldGeometry(nameField, { value: "x", x: 99, y: 88, fontSize: 7 }))
      .toEqual({ x: 99, y: 88, fontSize: 7 })
  })
  it("falls back to mapping geometry when override absent", () => {
    expect(fieldGeometry(nameField, undefined)).toEqual({ x: 10, y: 20, fontSize: 11 })
  })
  it("falls back per-property when override omits a coord", () => {
    expect(fieldGeometry(nameField, { value: "x", x: 99 })).toEqual({ x: 99, y: 20, fontSize: 11 })
  })
})

describe("buildOverrides", () => {
  it("maps values and merges sparse position overrides by index", () => {
    const result = buildOverrides(["A", "B", "C"], { 1: { x: 5, y: 6 }, 2: { fontSize: 8 } })
    expect(result).toEqual([
      { value: "A" },
      { value: "B", x: 5, y: 6 },
      { value: "C", fontSize: 8 },
    ])
  })
})
```

- [ ] **Step 3: Uruchom test — ma FAIL (brak modułu)**

Run: `npm run test -- document-overrides`
Expected: FAIL — `Cannot find module '@/lib/document-overrides'`.

- [ ] **Step 4: Zaimplementuj `lib/document-overrides.ts`**

```ts
import type { Client } from "@/lib/superbase"
import type { FieldMapping, FieldOverride } from "@/lib/document-types"
import { resolveField } from "@/lib/document-resolver"

export type { FieldOverride }

// CLIENT-side: zasiej edytowalne wartości z wybranego klienta (lub puste dla trybu ręcznego)
export function seedValues(client: Client | null, fields: FieldMapping[]): string[] {
  return fields.map(f => (client ? resolveField(client, f.dataKey) : ""))
}

// SERVER-side: finalna wartość pola; override jest dosłowny (transform NIE reaplikowany)
export function fieldValue(
  field: FieldMapping,
  client: Client | null,
  override: FieldOverride | undefined,
): string {
  if (override) return override.value
  return client ? resolveField(client, field.dataKey) : ""
}

// SERVER-side: geometria z opcjonalnym nudge per-dokument
export function fieldGeometry(
  field: FieldMapping,
  override: FieldOverride | undefined,
): { x: number; y: number; fontSize: number } {
  return {
    x: override?.x ?? field.x,
    y: override?.y ?? field.y,
    fontSize: override?.fontSize ?? field.fontSize,
  }
}

// CLIENT-side: zbuduj payload overrides z wartości + rzadkich nudge'ów pozycji
export function buildOverrides(
  values: string[],
  pos: Record<number, { x?: number; y?: number; fontSize?: number }>,
): FieldOverride[] {
  return values.map((value, i) => {
    const p = pos[i]
    const ov: FieldOverride = { value }
    if (p?.x != null) ov.x = p.x
    if (p?.y != null) ov.y = p.y
    if (p?.fontSize != null) ov.fontSize = p.fontSize
    return ov
  })
}
```

- [ ] **Step 5: Uruchom test — ma PASS**

Run: `npm run test -- document-overrides`
Expected: PASS (wszystkie przypadki). Uwaga: `document-resolver` importuje `Client` jako `import type`, więc nie uruchamia runtime'owego klienta Supabase — testy działają w środowisku node bez zmiennych env.

- [ ] **Step 6: Commit**

```bash
git add lib/document-types.ts lib/document-overrides.ts lib/document-overrides.test.ts
git commit -m "feat: add FieldOverride type and pure overrides logic"
```

---

## Task 2: Generator używa overrides

**Files:**
- Modify: `lib/document-generator.ts`

- [ ] **Step 1: Zamień ciało `generateDocument` i importy**

Usuń import `resolveField` (logika przeniesiona do helperów). Zmień górne importy z:

```ts
import { resolveField } from "@/lib/document-resolver"
import { layoutGrid } from "@/lib/pdf-coords"
import { getMapping } from "@/lib/document-store"
```

na:

```ts
import { layoutGrid } from "@/lib/pdf-coords"
import { getMapping } from "@/lib/document-store"
import { fieldValue, fieldGeometry } from "@/lib/document-overrides"
import type { FieldOverride } from "@/lib/document-types"
```

Zmień sygnaturę i pętlę. Zastąp całą funkcję `generateDocument` (linie 26–65) tym:

```ts
export async function generateDocument(
  templateId: string,
  client: Client | null,
  overrides?: FieldOverride[],
): Promise<Uint8Array> {
  const mapping: DocumentMapping = await getMapping(templateId)

  const pdfRelative = mapping.pdfPath.startsWith("/") ? mapping.pdfPath.slice(1) : mapping.pdfPath
  const pdfPath = path.join(process.cwd(), "public", pdfRelative)
  const pdfBytes = await fs.readFile(pdfPath)

  const fontPath = path.join(process.cwd(), "public", "fonts", "NotoSans-Regular.ttf")
  const fontBytes = await fs.readFile(fontPath)

  const pdfDoc = await PDFDocument.load(pdfBytes)
  pdfDoc.registerFontkit(fontkit)

  let font: PDFFont
  try {
    font = await pdfDoc.embedFont(fontBytes)
  } catch {
    console.warn("NotoSans load failed, falling back to Helvetica (Polish diacritics may not render)")
    font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  }

  const pages = pdfDoc.getPages()

  mapping.fields.forEach((field, i) => {
    const ov = overrides?.[i]
    const value = fieldValue(field, client, ov)
    if (!value) return

    const page = pages[field.page - 1]
    if (!page) return

    const geom = fieldGeometry(field, ov)
    const merged: FieldMapping = { ...field, x: geom.x, y: geom.y, fontSize: geom.fontSize }

    if (field.type === "grid") {
      drawGridField(page, value, merged, font)
    } else {
      const text = merged.maxWidth ? truncateToWidth(value, merged.maxWidth, font, geom.fontSize) : value
      page.drawText(text, { x: geom.x, y: geom.y, size: geom.fontSize, font })
    }
  })

  return pdfDoc.save()
}
```

(`Client` jest już importowany jako `import type { Client }` na górze pliku — pozostaje. `FieldMapping` też jest już importowany.)

- [ ] **Step 2: Sprawdź typecheck i istniejące testy**

Run: `npx tsc --noEmit && npm run test`
Expected: brak błędów typów; testy `lib/` przechodzą (w tym `document-overrides`, `document-store`, `pdf-coords`).

- [ ] **Step 3: Commit**

```bash
git add lib/document-generator.ts
git commit -m "feat: generateDocument accepts per-field overrides"
```

---

## Task 3: API `/generate` przyjmuje overrides

**Files:**
- Modify: `app/api/documents/generate/route.ts`

- [ ] **Step 1: Zastąp zawartość route**

```ts
import { NextRequest, NextResponse } from "next/server"
import { generateDocument } from "@/lib/document-generator"
import type { Client } from "@/lib/superbase"
import type { FieldOverride } from "@/lib/document-types"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { templateId, client, overrides } = body as {
    templateId: string
    client?: Client | null
    overrides?: FieldOverride[]
  }

  if (!templateId || (!client && !overrides)) {
    return NextResponse.json(
      { error: "templateId and (client or overrides) are required" },
      { status: 400 },
    )
  }

  let pdfBytes: Uint8Array
  try {
    pdfBytes = await generateDocument(templateId, client ?? null, overrides)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: `Generation failed: ${message}` }, { status: 500 })
  }

  const namePart = client?.id ?? "reczne"
  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${templateId}-${namePart}.pdf"`,
    },
  })
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: brak błędów. Stare wywołanie z `mapping-editor` (`{ templateId, client: sample }`) wciąż działa — `overrides` undefined → ścieżka `resolveField`.

- [ ] **Step 3: Commit**

```bash
git add app/api/documents/generate/route.ts
git commit -m "feat: /generate API accepts overrides, client optional"
```

---

## Task 4: Wyciągnij `<PdfFieldLayer>` i przepnij `mapping-editor`

**Files:**
- Create: `components/pdf-field-layer.tsx`
- Modify: `components/mapping-editor.tsx`

> Cel: przenieść (bez zmiany logiki) rendering canvasu — wrapper, `PdfCanvas`, znaczniki pól, pozycjonowany podgląd tekstu (grid/text), drag — do współdzielonego komponentu. Warstwy specyficzne dla edycji POZYCJI (overlay stawiania pól, znacznik pierwszej kratki grida) zostają w `mapping-editor` jako `children` osadzone w środku wrappera.

- [ ] **Step 1: Utwórz `components/pdf-field-layer.tsx`**

```tsx
"use client"

import { type CSSProperties, type MouseEvent as ReactMouseEvent, type ReactNode, useRef } from "react"
import dynamic from "next/dynamic"
import { pointToPixel, pixelToPoint, layoutGrid, type PageDims } from "@/lib/pdf-coords"
import type { FieldMapping } from "@/lib/document-types"

// pdfjs-dist dotyka globali przeglądarki — ładuj wyłącznie po stronie klienta.
const PdfCanvas = dynamic(() => import("@/components/pdf-canvas").then(m => m.PdfCanvas), {
  ssr: false,
})

function previewStyle(
  x: number,
  y: number,
  fontSizePt: number,
  d: PageDims,
  maxWidthPt?: number,
): CSSProperties {
  const scale = d.imageHeightPx / d.pageHeightPt
  const base: CSSProperties = {
    position: "absolute",
    left: x,
    top: y,
    // pdf-lib kotwiczy tekst po linii bazowej; dociągamy baseline do punktu
    // (zamiast dołu ramki), żeby podgląd pokrywał się z realnym PDF.
    lineHeight: 1,
    transform: "translateY(-0.8em)",
    fontSize: fontSizePt * scale,
    fontFamily: "NotoSansPreview, var(--font-sans), sans-serif",
    color: "#111",
    whiteSpace: "nowrap",
    pointerEvents: "none",
    zIndex: 2,
  }
  if (maxWidthPt != null) {
    return { ...base, display: "inline-block", maxWidth: maxWidthPt * scale, overflow: "hidden", textOverflow: "ellipsis" }
  }
  return base
}

export interface PdfFieldLayerProps {
  pdfUrl: string
  page: number
  fields: { f: FieldMapping; idx: number }[] // przefiltrowane do strony, z oryginalnym idx
  valueOf: (idx: number) => string           // wartość renderowana dla pola idx ("" = brak podglądu)
  dims: PageDims | null
  onReady: (d: PageDims) => void
  selected: number
  onSelect: (idx: number) => void
  editable: boolean                          // czy znaczniki można przeciągać
  onMove?: (idx: number, x: number, y: number) => void
  children?: ReactNode                       // dodatkowe nakładki (overlay stawiania pól itp.)
}

export function PdfFieldLayer(props: PdfFieldLayerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  function startDrag(e: ReactMouseEvent, idx: number) {
    if (!props.editable || !props.onMove) return
    e.preventDefault()
    props.onSelect(idx)
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const move = (ev: MouseEvent) => {
      if (!props.dims) return
      const rect = wrapper.getBoundingClientRect()
      const pt = pixelToPoint(ev.clientX - rect.left, ev.clientY - rect.top, props.dims)
      props.onMove!(idx, pt.x, pt.y)
    }
    const up = () => {
      window.removeEventListener("mousemove", move)
      window.removeEventListener("mouseup", up)
    }
    window.addEventListener("mousemove", move)
    window.addEventListener("mouseup", up)
  }

  return (
    <div ref={wrapperRef} style={{ position: "relative", display: "inline-block" }}>
      <PdfCanvas pdfUrl={props.pdfUrl} page={props.page} onReady={props.onReady} />
      {props.children}
      {props.dims &&
        props.fields.map(({ f, idx }) => {
          const px = pointToPixel(f.x, f.y, props.dims!)
          const value = props.valueOf(idx)
          return (
            <div key={idx}>
              <div
                onMouseDown={e => startDrag(e, idx)}
                onClick={() => props.onSelect(idx)}
                title={f.dataKey}
                style={{
                  position: "absolute",
                  left: px.x,
                  top: px.y,
                  width: 12,
                  height: 12,
                  marginLeft: -6,
                  marginTop: -6,
                  borderRadius: "50%",
                  cursor: props.editable ? "grab" : "pointer",
                  background: f.type === "grid" ? "var(--success)" : "var(--brand)",
                  boxShadow: idx === props.selected ? "0 0 0 3px white" : "none",
                  zIndex: 3,
                }}
              />
              {value &&
                (f.type === "grid"
                  ? layoutGrid(value, f).map((g, gi) => {
                      const gp = pointToPixel(g.x, g.y, props.dims!)
                      return (
                        <span key={gi} style={previewStyle(gp.x, gp.y, f.fontSize, props.dims!)}>
                          {g.char}
                        </span>
                      )
                    })
                  : (
                      <span style={previewStyle(px.x, px.y, f.fontSize, props.dims!, f.maxWidth)}>{value}</span>
                    ))}
            </div>
          )
        })}
    </div>
  )
}
```

- [ ] **Step 2: Przepnij `mapping-editor.tsx` na `<PdfFieldLayer>`**

W `components/mapping-editor.tsx`:

1. Dodaj import po istniejących importach:

```ts
import { PdfFieldLayer } from "@/components/pdf-field-layer"
```

2. Usuń lokalną funkcję `previewStyle` (linie 22–50) — jest teraz w `pdf-field-layer.tsx`.

3. Usuń import `pointToPixel` z linii `import { pointToPixel, pixelToPoint, layoutGrid, type PageDims } from "@/lib/pdf-coords"` jeśli nieużywany po zmianach — `pixelToPoint` zostaje (używa go `placePoint`), `layoutGrid`/`pointToPixel` mogą zniknąć z tego pliku, bo używa ich teraz layer. Po edycjach uruchom typecheck i usuń nieużywane importy zgłoszone przez kompilator. Docelowo zostaw: `import { pixelToPoint, type PageDims } from "@/lib/pdf-coords"`.

4. Zastąp blok renderujący canvas (obecnie wrapper `<div style={{ position: "relative", display: "inline-block" }}>` z `PdfCanvas`, overlay `placePoint`, znacznikiem grid i `pageFields.map(...)`, tj. linie ~194–272) tym:

```tsx
<PdfFieldLayer
  pdfUrl={mapping.pdfPath}
  page={page}
  fields={pageFields}
  valueOf={idx => (sample ? resolveField(sample, mapping.fields[idx].dataKey) : "")}
  dims={dims}
  onReady={setDims}
  selected={selected}
  onSelect={setSelected}
  editable
  onMove={(idx, x, y) => updateField(idx, { x, y })}
>
  {/* warstwa do stawiania nowych pól (aktywna tylko w trybie text/grid) */}
  <div
    onClick={placePoint}
    style={{
      position: "absolute",
      inset: 0,
      zIndex: 1,
      cursor: mode === "select" ? "default" : "crosshair",
      pointerEvents: mode === "select" ? "none" : "auto",
    }}
  />

  {/* znacznik pierwszej kratki w trybie grid */}
  {dims && gridFirstClick && (() => {
    const gp = pointToPixel(gridFirstClick.x, gridFirstClick.y, dims)
    return (
      <div
        style={{
          position: "absolute",
          left: gp.x,
          top: gp.y,
          width: 12,
          height: 12,
          marginLeft: -6,
          marginTop: -6,
          borderRadius: "50%",
          background: "var(--warn)",
          pointerEvents: "none",
          zIndex: 4,
        }}
      />
    )
  })()}
</PdfFieldLayer>
```

Uwaga: znacznik grida nadal używa `pointToPixel`, więc zostaw `import { pixelToPoint, pointToPixel, type PageDims } from "@/lib/pdf-coords"` (oba: `pixelToPoint` dla `placePoint`, `pointToPixel` dla znacznika grida).

5. Usuń metodę `startDrag` (linie ~432–448) — jest teraz w layerze.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: brak błędów; brak nieużywanych importów (`layoutGrid` usunięty z mapping-editor, jeśli nigdzie indziej nieużywany).

- [ ] **Step 4: Manualna weryfikacja edytora pozycji (regresja)**

Run: `npm run dev`, otwórz `http://localhost:3000/documents/wniosek-pobyt-czasowy/edit`.
Sprawdź:
- Strona PDF się renderuje, znaczniki pól widoczne.
- Wybór „Klient‑próbka" pokazuje pozycjonowany podgląd tekstu (grid na str. 1, pola adresowe na str. 2 itd.).
- Przeciąganie znacznika zmienia x/y w panelu (drag działa).
- Tryby „+ Text" / „+ Grid" nadal stawiają nowe pola (overlay placement działa).
- „Zapisz" i „Generuj prawdziwy PDF" działają jak wcześniej.

- [ ] **Step 5: Commit**

```bash
git add components/pdf-field-layer.tsx components/mapping-editor.tsx
git commit -m "refactor: extract PdfFieldLayer shared by mapping editor"
```

---

## Task 5: `<DocumentComposer>` — panel edycji DANYCH

**Files:**
- Create: `components/document-composer.tsx`

- [ ] **Step 1: Utwórz `components/document-composer.tsx`**

```tsx
"use client"

import { useState } from "react"
import { ChevronLeft, Download } from "lucide-react"
import { resolveField } from "@/lib/document-resolver"
import { PdfFieldLayer } from "@/components/pdf-field-layer"
import { seedValues, buildOverrides } from "@/lib/document-overrides"
import type { PageDims } from "@/lib/pdf-coords"
import type { Client } from "@/lib/superbase"
import type { DocumentMapping } from "@/lib/document-types"

type Pos = Record<number, { x?: number; y?: number; fontSize?: number }>

interface Props {
  templateId: string
  mapping: DocumentMapping
  client: Client | null
  onBack: () => void
  onNew: () => void
}

export function DocumentComposer({ templateId, mapping, client, onBack, onNew }: Props) {
  const [values, setValues] = useState<string[]>(() => seedValues(client, mapping.fields))
  const [pos, setPos] = useState<Pos>({})
  const [page, setPage] = useState(1)
  const [dims, setDims] = useState<PageDims | null>(null)
  const [selected, setSelected] = useState(-1)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // pozycje/fontSize z naniesionym nudge — odzwierciedlane w podglądzie na żywo
  const effectiveFields = mapping.fields.map((f, i) => ({
    ...f,
    x: pos[i]?.x ?? f.x,
    y: pos[i]?.y ?? f.y,
    fontSize: pos[i]?.fontSize ?? f.fontSize,
  }))
  const pageFields = effectiveFields.map((f, idx) => ({ f, idx })).filter(({ f }) => f.page === page)

  function setValue(idx: number, v: string) {
    setValues(vs => vs.map((x, i) => (i === idx ? v : x)))
  }
  function setPosField(idx: number, patch: { x?: number; y?: number; fontSize?: number }) {
    setPos(p => ({ ...p, [idx]: { ...p[idx], ...patch } }))
  }

  async function generate(): Promise<string | null> {
    setIsGenerating(true)
    setError(null)
    try {
      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, overrides: buildOverrides(values, pos) }),
      })
      if (!res.ok) {
        const e = await res.json()
        setError(`Błąd generowania: ${e.error}`)
        return null
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
      return url
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleDownload() {
    const url = pdfUrl ?? (await generate())
    if (!url) return
    const a = document.createElement("a")
    a.href = url
    a.download = `${templateId}-${client?.Name?.replace(/\s+/g, "_") ?? "reczne"}.pdf`
    a.click()
  }

  const sel = selected >= 0 ? mapping.fields[selected] : null

  return (
    <div className="flex h-screen">
      {/* ta sama czcionka co w generowanym PDF (osadzona NotoSans) */}
      <style>{`@font-face{font-family:'NotoSansPreview';src:url('/fonts/NotoSans-Regular.ttf') format('truetype');font-display:swap;}`}</style>

      <div className="flex-1 overflow-auto p-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 h-8 rounded-btn border border-border bg-transparent text-text text-[12.5px] font-medium hover:bg-surface-hover transition-colors mb-4 cursor-pointer"
        >
          <ChevronLeft size={13} /> Wróć do wyboru
        </button>
        <PdfFieldLayer
          pdfUrl={mapping.pdfPath}
          page={page}
          fields={pageFields}
          valueOf={idx => values[idx] ?? ""}
          dims={dims}
          onReady={setDims}
          selected={selected}
          onSelect={setSelected}
          editable
          onMove={(idx, x, y) => setPosField(idx, { x, y })}
        />
      </div>

      <aside className="w-80 border-l border-border overflow-auto p-4">
        <div className="mb-3 flex items-center gap-2">
          <label className="text-[11px] text-text-mute">Strona</label>
          <input
            type="number"
            min={1}
            value={page}
            onChange={e => setPage(parseInt(e.target.value) || 1)}
            className="w-16 bg-surface border border-border rounded px-2 py-1 text-[12px]"
          />
          <span className="text-[11px] text-text-mute">
            {client ? client.Name : "Dane ręczne"}
          </span>
        </div>

        {/* Lista pól bieżącej strony — edycja treści */}
        <div className="flex flex-col gap-2 mb-4">
          {pageFields.map(({ f, idx }) => (
            <div
              key={idx}
              className="border rounded p-2"
              style={{ borderColor: idx === selected ? "var(--brand)" : "var(--border)" }}
            >
              <label className="block text-[10.5px] text-text-mute mb-1 font-mono truncate" title={f.dataKey}>
                {f.dataKey || "(pole ręczne)"}
              </label>
              <input
                value={values[idx] ?? ""}
                onFocusCapture={() => setSelected(idx)}
                onChange={e => setValue(idx, e.target.value)}
                className="w-full bg-surface border border-border rounded px-2 py-1 text-[12px]"
              />
            </div>
          ))}
          {pageFields.length === 0 && (
            <div className="text-[11px] text-text-mute">Brak pól na tej stronie.</div>
          )}
        </div>

        {/* Geometria zaznaczonego pola (nudge per-dokument) */}
        {sel && (
          <div className="border border-border rounded p-3 mb-4">
            <div className="text-[11px] font-bold text-text-mute uppercase mb-2">
              Wyrównanie pola #{selected}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-[11px] text-text-mute">
                x
                <input
                  type="number"
                  value={pos[selected]?.x ?? sel.x}
                  onChange={e => setPosField(selected, { x: parseFloat(e.target.value) })}
                  className="w-full bg-surface border border-border rounded px-2 py-1 text-[12px]"
                />
              </label>
              <label className="text-[11px] text-text-mute">
                y
                <input
                  type="number"
                  value={pos[selected]?.y ?? sel.y}
                  onChange={e => setPosField(selected, { y: parseFloat(e.target.value) })}
                  className="w-full bg-surface border border-border rounded px-2 py-1 text-[12px]"
                />
              </label>
              <label className="text-[11px] text-text-mute">
                fontSize
                <input
                  type="number"
                  value={pos[selected]?.fontSize ?? sel.fontSize}
                  onChange={e => setPosField(selected, { fontSize: parseFloat(e.target.value) })}
                  className="w-full bg-surface border border-border rounded px-2 py-1 text-[12px]"
                />
              </label>
            </div>
            <div className="text-[10.5px] text-text-mute mt-2">
              Zmiany pozycji dotyczą tylko tego dokumentu — nie zapisują się do mappingu.
            </div>
          </div>
        )}

        <button
          onClick={() => generate()}
          disabled={isGenerating}
          className="w-full h-9 rounded bg-[var(--brand)] text-white text-[13px] font-semibold mb-2 disabled:opacity-50"
        >
          {isGenerating ? "Generowanie…" : "Generuj"}
        </button>
        <button
          onClick={handleDownload}
          disabled={isGenerating}
          className="w-full h-9 rounded border border-border text-[13px] font-medium mb-2 inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <Download size={13} /> Pobierz PDF
        </button>
        <button
          onClick={onNew}
          className="w-full h-9 rounded border border-border text-[13px] font-medium mb-3"
        >
          Nowy dokument
        </button>

        {error && <div className="text-[11px] text-red-500 mb-2">{error}</div>}
        {pdfUrl && <iframe src={pdfUrl} className="w-full h-64 border border-border rounded" title="PDF" />}
      </aside>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: brak błędów.

- [ ] **Step 3: Commit**

```bash
git add components/document-composer.tsx
git commit -m "feat: DocumentComposer panel for per-document data editing"
```

---

## Task 6: Przepnij stronę `/documents` (browse → select → compose)

**Files:**
- Modify: `components/documents-page.tsx`

> Cel: realny flow zamiast makiety. Lista szablonów z flagą dostępności; krok wyboru klienta z opcją „ręcznie"; krok kompozycji z `<DocumentComposer>`. Usunąć martwą makietę.

- [ ] **Step 1: Importy i stała dostępności**

Na górze `components/documents-page.tsx`:

1. Zmień import ikon — usuń nieużywane po edycjach (`Mail`, `Download`, `ArrowRight` mogą zostać tylko jeśli używane; po zmianach zostaw te realnie używane: `FileText, Search, ChevronLeft, ArrowRight, ChevronRight`). Po edycjach uruchom typecheck i usuń to, co kompilator zgłosi jako nieużywane.

2. Dodaj importy:

```ts
import { DocumentComposer } from "@/components/document-composer"
import type { DocumentMapping } from "@/lib/document-types"
```

3. Dodaj pod stałą `COLOR_VARS` (lub tuż nad `DOC_TEMPLATES`):

```ts
// Szablony z realnym mappingiem + PDF (reszta wyszarzona, dodawana z czasem).
const AVAILABLE_TEMPLATES = new Set<string>(["wniosek-pobyt-czasowy"])
```

- [ ] **Step 2: `BrowseView` + `TemplateCard` — wyszarz niedostępne**

Zastąp funkcję `TemplateCard` (linie ~219–257) tą wersją (dodaje obsługę `available`):

```tsx
function TemplateCard({ t, col, onSelect }: { t: DocTemplate; col: string; onSelect: (t: DocTemplate) => void }) {
  const [hovered, setHovered] = useState(false)
  const available = AVAILABLE_TEMPLATES.has(t.id)

  return (
    <div
      onClick={() => available && onSelect(t)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="bg-surface rounded-card p-[18px] relative overflow-hidden transition-all duration-150"
      style={{
        border: `1px solid ${hovered && available ? col : 'var(--border)'}`,
        opacity: available ? 1 : 0.5,
        cursor: available ? 'pointer' : 'not-allowed',
      }}
    >
      <div className="flex items-start justify-between mb-3.5">
        <div
          className="w-10 h-10 rounded-[10px] flex items-center justify-center"
          style={{ background: col + '20', color: col }}
        >
          <FileText size={20} />
        </div>
        {available && t.popularnosc && (
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-pill tracking-wide"
            style={{ background: 'var(--success-soft)', color: 'var(--success)', letterSpacing: '0.05em' }}
          >
            {t.popularnosc.toUpperCase()}
          </span>
        )}
        {!available && (
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-pill tracking-wide"
            style={{ background: 'var(--warn-soft)', color: 'var(--warn)', letterSpacing: '0.05em' }}
          >
            WKRÓTCE
          </span>
        )}
      </div>
      <div className="text-[10px] text-text-mute uppercase font-bold tracking-loosest mb-1">{t.kategoria}</div>
      <h3 className="font-display text-[18px] font-medium text-text tracking-semi-tight leading-snug mb-1.5">{t.nazwa}</h3>
      <p className="text-[12px] text-text-dim leading-relaxed mb-3.5">{t.opis}</p>
      <div className="flex items-center justify-between text-[11px] text-text-mute">
        <span className="font-mono">{t.pola.length} pól</span>
        <span className="font-semibold flex items-center gap-1" style={{ color: available ? col : 'var(--text-mute)' }}>
          {available ? <>Generuj <ArrowRight size={12} /></> : 'Niedostępny'}
        </span>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Zastąp `ConfigureView` lekkim `SelectView`**

Usuń całą funkcję `ConfigureView` (linie ~259–526) oraz stałą `FIELD_DEFS` (linie ~54–73) i wklej w miejsce `ConfigureView`:

```tsx
// ─── select view (wybór klienta lub dane ręczne) ───────────────────────────────

interface SelectProps {
  template: DocTemplate
  clients: Client[]
  loadingClients: boolean
  onBack: () => void
  onNext: (client: Client | null) => void
}

function SelectView({ template, clients, loadingClients, onBack, onNext }: SelectProps) {
  const [client, setClient] = useState<Client | null>(null)
  const [clientSearch, setClientSearch] = useState('')
  const col = COLOR_VARS[template.kolor]

  const filteredClients = clients.filter(c => {
    if (!clientSearch) return true
    const q = clientSearch.toLowerCase()
    return (
      c.Name?.toLowerCase().includes(q) ||
      c.NumerSprawy?.toLowerCase().includes(q) ||
      c.KrajPoch?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-6 max-w-3xl mx-auto w-full overflow-auto">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 px-3 h-8 rounded-btn border border-border bg-transparent text-text text-[12.5px] font-medium hover:bg-surface-hover transition-colors mb-5 cursor-pointer"
      >
        <ChevronLeft size={13} /> Wróć do szablonów
      </button>

      <div className="flex items-start gap-4 mb-7">
        <div className="w-14 h-14 rounded-[12px] flex items-center justify-center shrink-0" style={{ background: col + '20', color: col }}>
          <FileText size={26} />
        </div>
        <div>
          <div className="text-[11px] text-text-mute uppercase font-bold tracking-loosest mb-1">{template.kategoria}</div>
          <h1 className="font-display text-[28px] font-medium text-text tracking-tightest leading-tight">{template.nazwa}</h1>
          <p className="text-[13px] text-text-dim mt-1.5">{template.opis}</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-card p-[18px] mb-4">
        <div className="text-[11px] text-text-mute uppercase font-bold tracking-loosest mb-2.5">Klient</div>
        {!client ? (
          <div>
            <p className="text-[13px] text-text-dim mb-2.5">Wybierz klienta — jego dane zasilą pola dokumentu — albo pomiń i wpisz dane ręcznie.</p>
            <div className="flex items-center gap-1.5 bg-bg border border-border rounded-btn px-2.5 mb-2">
              <Search size={12} className="text-text-mute shrink-0" />
              <input
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
                placeholder="Szukaj klienta..."
                className="flex-1 h-8 bg-transparent border-none outline-none text-text text-[12px] font-sans placeholder:text-text-mute"
              />
            </div>
            <div className="border border-border rounded-btn overflow-hidden max-h-72 overflow-y-auto">
              {loadingClients ? (
                <div className="p-6 text-center text-[13px] text-text-mute">Ładowanie klientów…</div>
              ) : filteredClients.length === 0 ? (
                <div className="p-6 text-center text-[13px] text-text-mute">Nie znaleziono klientów</div>
              ) : filteredClients.map(c => {
                const sprawaColor = COLOR_VARS[getSprawaColor(c.CelPobytu)]
                return (
                  <div
                    key={c.id}
                    onClick={() => setClient(c)}
                    className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-surface-hover transition-colors border-b border-border last:border-b-0"
                  >
                    <div className="w-7 h-7 rounded-chip flex items-center justify-center text-[10.5px] font-semibold shrink-0" style={{ background: sprawaColor + '20', color: sprawaColor }}>
                      {getInitials(c.Name || 'KL')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-text truncate">{c.Name || 'Brak nazwy'}</div>
                      <div className="text-[11px] text-text-dim font-mono">{c.NumerSprawy || c.id}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-2.5 bg-bg rounded-btn border border-border">
            <div className="w-10 h-10 rounded-btn flex items-center justify-center text-[13px] font-semibold text-white shrink-0" style={{ background: COLOR_VARS[getSprawaColor(client.CelPobytu)] }}>
              {getInitials(client.Name || 'KL')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold text-text">{client.Name || 'Brak nazwy'}</div>
              <div className="text-[11px] text-text-dim font-mono">{client.NumerSprawy || client.id} · {client.CelPobytu || '—'}</div>
            </div>
            <button onClick={() => setClient(null)} className="px-2.5 h-6 text-[11px] font-medium text-text border border-border rounded-btn bg-transparent hover:bg-surface-hover shrink-0 cursor-pointer">
              Zmień
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onNext(client)}
          className="h-10 px-5 rounded-btn text-[13px] font-semibold text-white inline-flex items-center justify-center gap-1.5 cursor-pointer"
          style={{ background: 'var(--brand)' }}
        >
          Podgląd
        </button>
        {!client && (
          <button
            onClick={() => onNext(null)}
            className="h-10 px-5 rounded-btn text-[13px] font-medium border border-border bg-transparent text-text hover:bg-surface-hover cursor-pointer"
          >
            Wpisz dane ręcznie
          </button>
        )}
      </div>
    </div>
  )
}
```

(„Podgląd" przy braku wybranego klienta także przechodzi dalej z `null` = tryb ręczny; przycisk „Wpisz dane ręcznie" jest jawnym skrótem.)

- [ ] **Step 4: Usuń `PreviewView` i martwe pomocnicze**

Usuń:
- całą funkcję `PreviewView` (linie ~528–628),
- funkcje `DocSection`, `DocGrid`, `DocRow` (linie ~630–659).

- [ ] **Step 5: Przepisz root `DocumentsPage`**

Zastąp funkcję `DocumentsPage` (linie ~663–705) tą wersją:

```tsx
export default function DocumentsPage() {
  const [step, setStep] = useState<'browse' | 'select' | 'compose'>('browse')
  const [template, setTemplate] = useState<DocTemplate | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [mapping, setMapping] = useState<DocumentMapping | null>(null)
  const [mappingError, setMappingError] = useState<string | null>(null)

  useEffect(() => {
    getClients()
      .then(data => setClients(data))
      .catch(console.error)
      .finally(() => setLoadingClients(false))
  }, [])

  async function chooseTemplate(t: DocTemplate) {
    setTemplate(t)
    setMappingError(null)
    setMapping(null)
    try {
      const res = await fetch(`/api/documents/mappings/${t.id}`)
      if (!res.ok) {
        const e = await res.json()
        setMappingError(e.error ?? 'Nie udało się wczytać mappingu')
        return
      }
      setMapping((await res.json()) as DocumentMapping)
      setStep('select')
    } catch {
      setMappingError('Nie udało się wczytać mappingu')
    }
  }

  if (step === 'select' && template) {
    return (
      <SelectView
        template={template}
        clients={clients}
        loadingClients={loadingClients}
        onBack={() => setStep('browse')}
        onNext={c => { setClient(c); setStep('compose') }}
      />
    )
  }

  if (step === 'compose' && template && mapping) {
    return (
      <DocumentComposer
        templateId={template.id}
        mapping={mapping}
        client={client}
        onBack={() => setStep('select')}
        onNew={() => { setStep('browse'); setTemplate(null); setClient(null); setMapping(null) }}
      />
    )
  }

  return (
    <>
      {mappingError && (
        <div className="m-6 p-3 rounded-card border border-border text-[12px] text-red-500">
          {mappingError}
        </div>
      )}
      <BrowseView onSelect={chooseTemplate} />
    </>
  )
}
```

- [ ] **Step 6: Typecheck + lint nieużywanych**

Run: `npx tsc --noEmit`
Expected: brak błędów. Usuń wszelkie nieużywane importy/zmienne zgłoszone przez kompilator (np. `Check`, `Mail`, `Download` z lucide jeśli już nieużywane; helper `statusStyle`/`RECENT_DOCS` zostają, bo używa ich `BrowseView`).

- [ ] **Step 7: Commit**

```bash
git add components/documents-page.tsx
git commit -m "feat: real document flow in /documents (browse -> select -> compose)"
```

---

## Task 7: Weryfikacja end-to-end i finalne sprawdzenie

**Files:** (brak zmian kodu — weryfikacja)

- [ ] **Step 1: Pełny test suite + typecheck + build**

Run: `npm run test && npx tsc --noEmit && npm run build`
Expected: testy `lib/` PASS, brak błędów typów, build przechodzi.

- [ ] **Step 2: Manualny scenariusz „klient z bazy"**

Run: `npm run dev`, otwórz `http://localhost:3000/documents`.
- Kafelek „Wniosek o pobyt czasowy i pracę" jest klikalny; pozostałe wyszarzone z „WKRÓTCE".
- Kliknij dostępny → krok wyboru → wybierz klienta → „Podgląd".
- W panelu: pola wstępnie wypełnione danymi klienta; podgląd pozycjonowany na PDF.
- Zmień treść pola → podgląd się aktualizuje. Przeciągnij znacznik / zmień x/y/fontSize → podgląd się przesuwa.
- „Generuj" → iframe z PDF; „Pobierz PDF" → plik się pobiera; treść/pozycje zgodne z podglądem.

- [ ] **Step 3: Manualny scenariusz „dane ręczne"**

- Wróć do szablonów → wejdź ponownie → nie wybieraj klienta → „Wpisz dane ręcznie".
- Pola są puste; wpisz wartości ręcznie; „Generuj" → PDF zawiera wpisane dane.

- [ ] **Step 4: Weryfikacja rozdziału DANE/MAPPING**

- Po wygenerowaniu i nudge'u pozycji w composerze, otwórz `/documents/wniosek-pobyt-czasowy/edit` — pozycje pól w mappingu są **niezmienione** (nudge był efemeryczny). Potwierdza, że DANE nie wyciekły do MAPPING.

- [ ] **Step 5: Finalny commit (jeśli pozostały drobne poprawki)**

```bash
git add -A
git commit -m "chore: verify end-to-end document composer flow"
```

---

## Self-Review (wypełnione przez autora planu)

**Spec coverage:**
- FieldOverride + precedencja → Task 1 (helpery + testy), Task 2 (generator). ✔
- API `overrides`, `client` opcjonalny → Task 3. ✔
- Wspólny `<PdfFieldLayer>` → Task 4. ✔
- `<DocumentComposer>` (seed z klienta/puste, edycja treści, nudge x/y/fontSize, Generuj/Pobierz) → Task 5. ✔
- Flow `/documents` (browse z flagą dostępności, select z opcją ręczną, compose), usunięcie makiety → Task 6. ✔
- Obsługa błędów (mapping fetch, generate, puste pola, pusty PDF) → Task 6 (mappingError), Task 5 (error), Task 2 (skip pustych). ✔
- Testy: generator/seeding (Task 1, czyste helpery; generator wired w Task 2), parytet podglądu (wspólny layer, Task 4), composer payload (`buildOverrides` test, Task 1). ✔
- YAGNI: brak zapisu DANYCH, brak DOCX/ODT, brak endpointu listy, brak clientId w URL. ✔

**Type consistency:** `FieldOverride` jednolite (document-types → re-export w document-overrides → generator/route/composer). Sygnatury `seedValues/fieldValue/fieldGeometry/buildOverrides` zgodne między Task 1 a użyciami w Task 2/5. `PdfFieldLayerProps` zgodne między Task 4 (def) a Task 4/5 (użycie). Kroki kompozycji `'browse' | 'select' | 'compose'` spójne w Task 6.

**Placeholder scan:** brak TBD/TODO; każdy krok z kodem zawiera pełny kod; komendy i oczekiwane wyniki podane.
