# Document Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a PDF document generator that overlays client data from Supabase onto original government form PDFs using coordinate-based field mappings defined in JSON config files.

**Architecture:** Each document type has a JSON mapping file in `mappings/` listing fields with page/x/y coordinates and CRM data keys. A server-side generator loads the original PDF, embeds NotoSans (for Polish diacritics), resolves client values, draws text at each coordinate, and returns filled PDF bytes. A Next.js API route wires this to the UI.

**Tech Stack:** pdf-lib 1.17.1, @pdf-lib/fontkit, Next.js App Router API routes, Supabase, TypeScript, fs (Node.js)

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `package.json` | Modify | Add `@pdf-lib/fontkit` dependency |
| `public/fonts/NotoSans-Regular.ttf` | Create | Font with Polish diacritic support |
| `lib/document-types.ts` | Create | Shared TypeScript interfaces (DocumentMapping, FieldMapping) |
| `lib/document-resolver.ts` | Create | Resolves `dataKey\|transform` → string from Client |
| `mappings/index.ts` | Create | Registry of available template IDs + names |
| `mappings/wniosek-pobyt-czasowy.json` | Create | Example mapping (placeholder coords — update after AI vision) |
| `lib/document-generator.ts` | Create | Core engine: loads PDF + JSON + font, draws text, returns Uint8Array |
| `app/api/documents/generate/route.ts` | Create | POST `{ templateId, clientId }` → PDF response |
| `components/documents-page.tsx` | Modify | Wire "Generuj dokument" button to new API route |

---

## Task 1: Install @pdf-lib/fontkit and add NotoSans font

**Files:**
- Modify: `package.json`
- Create: `public/fonts/NotoSans-Regular.ttf`

- [ ] **Step 1: Install @pdf-lib/fontkit**

```bash
npm install @pdf-lib/fontkit
```

Expected output: `added 1 package` (or similar, no errors)

- [ ] **Step 2: Download NotoSans-Regular.ttf**

Download from: https://github.com/notofonts/latin-greek-cyrillic/raw/main/fonts/NotoSans/unhinted/ttf/NotoSans-Regular.ttf

Place at: `public/fonts/NotoSans-Regular.ttf`

Verify file exists and is ~300–500KB.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json public/fonts/NotoSans-Regular.ttf
git commit -m "feat: add @pdf-lib/fontkit and NotoSans font for Polish diacritic support"
```

---

## Task 2: Create shared TypeScript interfaces

**Files:**
- Create: `lib/document-types.ts`

- [ ] **Step 1: Create `lib/document-types.ts`**

```typescript
export interface FieldMapping {
  page: number
  x: number
  y: number
  dataKey: string
  fontSize: number
  maxWidth?: number
}

export interface DocumentMapping {
  id: string
  name: string
  pdfPath: string
  fields: FieldMapping[]
}

export interface DocumentTemplate {
  id: string
  name: string
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors related to `document-types.ts`

- [ ] **Step 3: Commit**

```bash
git add lib/document-types.ts
git commit -m "feat: add shared DocumentMapping TypeScript interfaces"
```

---

## Task 3: Create document-resolver.ts

**Files:**
- Create: `lib/document-resolver.ts`

This module takes a `Client` object and a `dataKey` string like `"Name|split_last"` and returns a plain string value ready to draw on the PDF.

- [ ] **Step 1: Create `lib/document-resolver.ts`**

```typescript
import type { Client } from "@/lib/superbase"

type Transform =
  | "split_first"
  | "split_last"
  | "uppercase"
  | "year"
  | "month"
  | "day"
  | "address_street"
  | "address_number"
  | "address_zip"
  | "address_city"

function applyTransform(value: string, transform: Transform): string {
  switch (transform) {
    case "split_first":
      return value.split(" ")[0] ?? ""
    case "split_last":
      return value.split(" ").slice(-1)[0] ?? ""
    case "uppercase":
      return value.toUpperCase()
    case "year":
      return value.split("-")[0] ?? ""
    case "month":
      return value.split("-")[1] ?? ""
    case "day":
      return value.split("-")[2] ?? ""
    case "address_street": {
      const m = value.match(/ul\.\s+([^0-9,]+)/i)
      return m ? m[1].trim() : value
    }
    case "address_number": {
      const m = value.match(/ul\.[^0-9]+([0-9]+[^\s,]*)/)
      return m ? m[1].trim() : ""
    }
    case "address_zip": {
      const m = value.match(/\d{2}-\d{3}/)
      return m ? m[0] : ""
    }
    case "address_city": {
      const m = value.match(/\d{2}-\d{3}\s+([^,]+)/)
      return m ? m[1].trim() : ""
    }
    default:
      return value
  }
}

export function resolveField(client: Client, dataKey: string): string {
  const [key, transform] = dataKey.split("|") as [keyof Client, Transform | undefined]
  const raw = client[key]
  if (raw === null || raw === undefined) return ""
  const value = String(raw)
  if (!transform) return value
  return applyTransform(value, transform)
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Manual smoke-test in browser console**

Start dev server (`npm run dev`), open browser console on any page, and run:

```javascript
// Simulate in browser — not a real test, just sanity check
const client = { Name: "Jan Kowalski", Birthday: "1990-03-15", KrajPoch: "Ukraina", Adres: "ul. Marszałkowska 1, 00-001 Warszawa" }
// Expected: "Kowalski"
console.log(client.Name.split(" ").slice(-1)[0])
// Expected: "1990"
console.log(client.Birthday.split("-")[0])
// Expected: "00-001"
console.log(client.Adres.match(/\d{2}-\d{3}/)?.[0])
```

- [ ] **Step 4: Commit**

```bash
git add lib/document-resolver.ts
git commit -m "feat: add document field resolver with transform support"
```

---

## Task 4: Create mappings registry and example JSON

**Files:**
- Create: `mappings/index.ts`
- Create: `mappings/wniosek-pobyt-czasowy.json`

- [ ] **Step 1: Create `mappings/index.ts`**

```typescript
import type { DocumentTemplate } from "@/lib/document-types"

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: "wniosek-pobyt-czasowy",
    name: "Wniosek o udzielenie zezwolenia na pobyt czasowy i pracę",
  },
]
```

- [ ] **Step 2: Create `mappings/wniosek-pobyt-czasowy.json`**

These are **placeholder coordinates**. Replace x/y values with real ones after running the AI vision prompt on PDF screenshots.

```json
{
  "id": "wniosek-pobyt-czasowy",
  "name": "Wniosek o udzielenie zezwolenia na pobyt czasowy i pracę",
  "pdfPath": "/forms/wniosek-pobyt-czasowy.pdf",
  "fields": [
    {
      "page": 1,
      "x": 200,
      "y": 720,
      "dataKey": "Name|split_last",
      "fontSize": 10,
      "maxWidth": 180
    },
    {
      "page": 1,
      "x": 200,
      "y": 700,
      "dataKey": "Name|split_first",
      "fontSize": 10,
      "maxWidth": 150
    },
    {
      "page": 1,
      "x": 200,
      "y": 680,
      "dataKey": "Birthday|day",
      "fontSize": 10
    },
    {
      "page": 1,
      "x": 240,
      "y": 680,
      "dataKey": "Birthday|month",
      "fontSize": 10
    },
    {
      "page": 1,
      "x": 280,
      "y": 680,
      "dataKey": "Birthday|year",
      "fontSize": 10
    },
    {
      "page": 1,
      "x": 200,
      "y": 660,
      "dataKey": "KrajPoch|uppercase",
      "fontSize": 10,
      "maxWidth": 180
    },
    {
      "page": 1,
      "x": 200,
      "y": 640,
      "dataKey": "Phone",
      "fontSize": 10
    },
    {
      "page": 1,
      "x": 200,
      "y": 620,
      "dataKey": "Email",
      "fontSize": 10,
      "maxWidth": 200
    }
  ]
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add mappings/index.ts mappings/wniosek-pobyt-czasowy.json
git commit -m "feat: add mapping registry and placeholder mapping for wniosek-pobyt-czasowy"
```

---

## Task 5: Create document-generator.ts

**Files:**
- Create: `lib/document-generator.ts`

- [ ] **Step 1: Create `lib/document-generator.ts`**

```typescript
import fs from "fs/promises"
import path from "path"
import { PDFDocument } from "pdf-lib"
import fontkit from "@pdf-lib/fontkit"
import type { Client } from "@/lib/superbase"
import type { DocumentMapping, FieldMapping } from "@/lib/document-types"
import { resolveField } from "@/lib/document-resolver"

function truncateToWidth(
  text: string,
  maxWidth: number,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  fontSize: number,
): string {
  if (font.widthOfTextAtSize(text, fontSize) <= maxWidth) return text
  let truncated = text
  while (truncated.length > 0 && font.widthOfTextAtSize(truncated + "…", fontSize) > maxWidth) {
    truncated = truncated.slice(0, -1)
  }
  return truncated + "…"
}

export async function generateDocument(templateId: string, client: Client): Promise<Uint8Array> {
  const mappingPath = path.join(process.cwd(), "mappings", `${templateId}.json`)
  const mappingRaw = await fs.readFile(mappingPath, "utf-8")
  const mapping: DocumentMapping = JSON.parse(mappingRaw)

  const pdfRelative = mapping.pdfPath.startsWith("/") ? mapping.pdfPath.slice(1) : mapping.pdfPath
  const pdfPath = path.join(process.cwd(), "public", pdfRelative)
  const pdfBytes = await fs.readFile(pdfPath)

  const fontPath = path.join(process.cwd(), "public", "fonts", "NotoSans-Regular.ttf")
  const fontBytes = await fs.readFile(fontPath)

  const pdfDoc = await PDFDocument.load(pdfBytes)
  pdfDoc.registerFontkit(fontkit)
  let font
  try {
    font = await pdfDoc.embedFont(fontBytes)
  } catch {
    console.warn("NotoSans load failed, falling back to Helvetica (Polish diacritics may not render)")
    const { StandardFonts } = await import("pdf-lib")
    font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  }

  const pages = pdfDoc.getPages()

  for (const field of mapping.fields) {
    const value = resolveField(client, field.dataKey)
    if (!value) continue

    const page = pages[field.page - 1]
    if (!page) continue

    const text = field.maxWidth
      ? truncateToWidth(value, field.maxWidth, font, field.fontSize)
      : value

    page.drawText(text, {
      x: field.x,
      y: field.y,
      size: field.fontSize,
      font,
    })
  }

  return pdfDoc.save()
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors. If `@pdf-lib/fontkit` types are missing, add `declare module "@pdf-lib/fontkit"` to a `types.d.ts` file at root.

- [ ] **Step 3: Commit**

```bash
git add lib/document-generator.ts
git commit -m "feat: add PDF document generator engine with fontkit and coordinate overlay"
```

---

## Task 6: Create API route

**Files:**
- Create: `app/api/documents/generate/route.ts`

- [ ] **Step 1: Create `app/api/documents/generate/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server"
import { generateDocument } from "@/lib/document-generator"
import { getClients } from "@/lib/superbase"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { templateId, clientId } = body as { templateId: string; clientId: string }

  if (!templateId || !clientId) {
    return NextResponse.json({ error: "templateId and clientId are required" }, { status: 400 })
  }

  const clients = await getClients()
  const client = clients.find((c) => c.id === clientId)

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 })
  }

  let pdfBytes: Uint8Array
  try {
    pdfBytes = await generateDocument(templateId, client)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: `Generation failed: ${message}` }, { status: 500 })
  }

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${templateId}-${clientId}.pdf"`,
    },
  })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Manual smoke test**

```bash
npm run dev
```

Then in browser console or terminal:

```bash
curl -X POST http://localhost:3000/api/documents/generate \
  -H "Content-Type: application/json" \
  -d '{"templateId":"wniosek-pobyt-czasowy","clientId":"<paste-a-real-client-id-from-supabase>"}' \
  --output test-output.pdf
```

Expected: `test-output.pdf` created, opens in PDF viewer, shows overlaid text at placeholder positions.

If the PDF file is missing from `/public/forms/`, you'll get `500: Generation failed: ENOENT...` — that's expected until you place the real PDF there. The rest of the pipeline is working.

- [ ] **Step 4: Commit**

```bash
git add app/api/documents/generate/route.ts
git commit -m "feat: add POST /api/documents/generate API route"
```

---

## Task 7: Wire up documents-page.tsx

**Files:**
- Modify: `components/documents-page.tsx`

The current "Generuj dokument" button in `PreviewView` (line ~497) calls `onNext(client)` which just changes the step. Replace the download buttons in `PreviewView` with a real fetch call.

- [ ] **Step 1: Add `generateAndDownload` function to `PreviewView`**

In `components/documents-page.tsx`, add this function inside `PreviewView` (after the existing state/variables):

```typescript
const [isGenerating, setIsGenerating] = useState(false)

async function generateAndDownload() {
  setIsGenerating(true)
  try {
    const res = await fetch("/api/documents/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId: template.id, clientId: client.id }),
    })
    if (!res.ok) {
      const err = await res.json()
      alert(`Błąd generowania: ${err.error}`)
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${template.id}-${client.Name?.replace(/\s+/g, "_") ?? client.id}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } finally {
    setIsGenerating(false)
  }
}
```

- [ ] **Step 2: Wire the "Pobierz PDF" button in `PreviewView`**

Find the two "Pobierz PDF" buttons in `PreviewView` (lines ~559 and ~637). Replace both `<button>` elements with:

```tsx
<button
  onClick={generateAndDownload}
  disabled={isGenerating}
  className="inline-flex items-center gap-1.5 px-3 h-8 rounded-btn text-[12.5px] font-semibold text-white cursor-pointer disabled:opacity-50"
  style={{ background: "var(--brand)", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}
>
  {isGenerating ? (
    <>Generowanie…</>
  ) : (
    <><Download size={13} /> Pobierz PDF</>
  )}
</button>
```

- [ ] **Step 3: Wire the "Generuj dokument" button in `ConfigureView`**

In `ConfigureView` (line ~497), the button currently calls `onNext(client)`. This is correct — it moves to the preview step. No change needed here; the actual download happens in `PreviewView`.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: End-to-end manual test**

```bash
npm run dev
```

1. Navigate to Documents page
2. Select "Wniosek o udzielenie zezwolenia na pobyt czasowy i pracę"
3. Select any client
4. Click "Generuj dokument" → reaches preview step
5. Click "Pobierz PDF" → browser downloads a PDF
6. Open PDF — should show the original government form with client data overlaid at placeholder coordinates

> Note: If `/public/forms/wniosek-pobyt-czasowy.pdf` does not exist yet, the download will fail with an error alert. Place the real PDF there and re-test.

- [ ] **Step 6: Commit**

```bash
git add components/documents-page.tsx
git commit -m "feat: wire documents-page download to PDF generation API"
```

---

## Task 8: Place real PDF and calibrate coordinates

This task happens after running the AI vision prompt on PDF screenshots.

**Files:**
- Create: `public/forms/wniosek-pobyt-czasowy.pdf`
- Modify: `mappings/wniosek-pobyt-czasowy.json`

- [ ] **Step 1: Place official PDF**

Copy the official government PDF to:
```
public/forms/wniosek-pobyt-czasowy.pdf
```

Add to `.gitignore` if you don't want to commit government PDFs to git:
```
public/forms/*.pdf
```

- [ ] **Step 2: Take page screenshots**

Open the PDF in a browser (e.g., drag into Chrome). Take a full-page screenshot of each page. Aim for 595px wide (1:1 point mapping) or note the actual pixel dimensions for accurate conversion.

- [ ] **Step 3: Run AI vision prompt**

Use the prompt from `docs/superpowers/specs/2026-05-28-document-generator-design.md` (AI Prompt Template section). Attach all screenshots. The AI returns a complete JSON.

- [ ] **Step 4: Replace mappings/wniosek-pobyt-czasowy.json**

Paste the AI-generated JSON into `mappings/wniosek-pobyt-czasowy.json`. Run dev server, download a test PDF, and visually verify each field lands in the right place.

- [ ] **Step 5: Fine-tune coordinates**

For each field that's off by a few pixels, adjust `x`/`y` in the JSON and re-download. Typical adjustment range: ±5–15pt.

- [ ] **Step 6: Commit**

```bash
git add mappings/wniosek-pobyt-czasowy.json
git commit -m "feat: calibrate wniosek-pobyt-czasowy field coordinates from PDF scan"
```

---

## Adding Future Document Types (reference)

For each new form:
1. Place PDF in `public/forms/<id>.pdf`
2. Run AI vision prompt → get JSON
3. Save to `mappings/<id>.json`
4. Add entry to `mappings/index.ts` → `DOCUMENT_TEMPLATES`
5. Add entry to `DOC_TEMPLATES` in `components/documents-page.tsx`
6. Test and calibrate coordinates
