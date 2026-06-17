# Document Template PDF Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins create `/documents/admin` templates by uploading a PDF into Supabase Storage, then map and generate documents from that uploaded template.

**Architecture:** A server-only helper owns template Storage paths, validation, upload, cleanup, and byte loading. The mapping row stores an application proxy URL (`/api/documents/templates/<id>/pdf`) so the bucket can stay private while the mapping editor and generator use one stable source.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Supabase JS v2, Vitest, pdf-lib.

## Global Constraints

- Keep existing `/forms/...` template paths working.
- Use a dedicated template Storage bucket named `document-templates`.
- Store uploaded files under `templates/<templateId>.pdf`.
- Protect upload with `requireDocumentsAdmin`.
- Do not expose service-role credentials to client code.
- Do not create a mapping if PDF upload fails.
- If mapping creation fails after upload, attempt Storage cleanup.
- Follow repository style: two-space indentation, double quotes, no semicolons.

---

## File Structure

- Create `lib/document-template-storage.ts`: server-side constants and pure helpers for template IDs, proxy paths, Storage object paths, upload validation, upload cleanup, download, and PDF source detection.
- Create `lib/document-template-storage.test.ts`: unit coverage for path construction, proxy detection, PDF validation, and source parsing.
- Modify `lib/document-generator.ts`: replace inline local-file loading with a helper that supports local `/forms/...` and app proxy template paths.
- Modify `app/api/documents/mappings/route.ts`: branch on `Content-Type` to keep JSON creation and add multipart PDF upload creation.
- Create `app/api/documents/templates/[id]/pdf/route.ts`: stream private Storage PDF bytes through the app.
- Modify `components/documents-admin-page.tsx`: replace manual path input with PDF file selection and `FormData` submission.
- Modify `lib/document-store.test.ts`: keep current JSON validation behavior covered if needed after API changes.

---

### Task 1: Storage Path And Validation Helpers

**Files:**
- Create: `lib/document-template-storage.ts`
- Test: `lib/document-template-storage.test.ts`

**Interfaces:**
- Produces: `DOCUMENT_TEMPLATE_BUCKET: "document-templates"`
- Produces: `DOCUMENT_TEMPLATE_MAX_BYTES: number`
- Produces: `documentTemplateObjectPath(templateId: string): string`
- Produces: `documentTemplateProxyPath(templateId: string): string`
- Produces: `parseDocumentTemplateProxyPath(pdfPath: string): string | null`
- Produces: `validateDocumentTemplatePdfFile(file: Pick<File, "name" | "type" | "size"> | null | undefined): string[]`

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, expect, it } from "vitest"
import {
  DOCUMENT_TEMPLATE_BUCKET,
  documentTemplateObjectPath,
  documentTemplateProxyPath,
  parseDocumentTemplateProxyPath,
  validateDocumentTemplatePdfFile,
} from "@/lib/document-template-storage"

describe("document template storage paths", () => {
  it("builds stable bucket object and proxy paths from a template id", () => {
    expect(DOCUMENT_TEMPLATE_BUCKET).toBe("document-templates")
    expect(documentTemplateObjectPath("wniosek-nowy")).toBe("templates/wniosek-nowy.pdf")
    expect(documentTemplateProxyPath("wniosek-nowy")).toBe("/api/documents/templates/wniosek-nowy/pdf")
  })

  it("encodes proxy path segments and decodes them when parsing", () => {
    expect(documentTemplateProxyPath("wniosek nowy")).toBe("/api/documents/templates/wniosek%20nowy/pdf")
    expect(parseDocumentTemplateProxyPath("/api/documents/templates/wniosek%20nowy/pdf")).toBe("wniosek nowy")
  })

  it("returns null for non-template proxy paths", () => {
    expect(parseDocumentTemplateProxyPath("/forms/wniosek.pdf")).toBeNull()
    expect(parseDocumentTemplateProxyPath("https://example.com/file.pdf")).toBeNull()
  })
})

describe("validateDocumentTemplatePdfFile", () => {
  it("accepts a PDF by MIME type", () => {
    expect(validateDocumentTemplatePdfFile({ name: "x", type: "application/pdf", size: 1024 })).toEqual([])
  })

  it("accepts a PDF by extension when MIME type is missing", () => {
    expect(validateDocumentTemplatePdfFile({ name: "x.PDF", type: "", size: 1024 })).toEqual([])
  })

  it("rejects missing, non-PDF, empty, and oversized files", () => {
    expect(validateDocumentTemplatePdfFile(null)).toContain("Brak pliku PDF")
    expect(validateDocumentTemplatePdfFile({ name: "x.txt", type: "text/plain", size: 1024 })).toContain("Plik musi byc PDF")
    expect(validateDocumentTemplatePdfFile({ name: "x.pdf", type: "application/pdf", size: 0 })).toContain("Plik PDF jest pusty")
    expect(validateDocumentTemplatePdfFile({ name: "x.pdf", type: "application/pdf", size: 26 * 1024 * 1024 })).toContain("Plik PDF jest za duzy (max 25MB)")
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- lib/document-template-storage.test.ts`

Expected: FAIL because `@/lib/document-template-storage` does not exist.

- [ ] **Step 3: Implement the helper**

Create `lib/document-template-storage.ts` with:

```typescript
import "server-only"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const DOCUMENT_TEMPLATE_BUCKET = "document-templates"
export const DOCUMENT_TEMPLATE_PREFIX = "templates"
export const DOCUMENT_TEMPLATE_MAX_BYTES = 25 * 1024 * 1024

type PdfFileLike = Pick<File, "name" | "type" | "size">

export function documentTemplateObjectPath(templateId: string): string {
  return `${DOCUMENT_TEMPLATE_PREFIX}/${templateId}.pdf`
}

export function documentTemplateProxyPath(templateId: string): string {
  return `/api/documents/templates/${encodeURIComponent(templateId)}/pdf`
}

export function parseDocumentTemplateProxyPath(pdfPath: string): string | null {
  const match = pdfPath.match(/^\/api\/documents\/templates\/([^/]+)\/pdf$/)
  return match ? decodeURIComponent(match[1]) : null
}

export function validateDocumentTemplatePdfFile(file: PdfFileLike | null | undefined): string[] {
  if (!file) return ["Brak pliku PDF"]

  const errors: string[] = []
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  if (!isPdf) errors.push("Plik musi byc PDF")
  if (file.size <= 0) errors.push("Plik PDF jest pusty")
  if (file.size > DOCUMENT_TEMPLATE_MAX_BYTES) errors.push("Plik PDF jest za duzy (max 25MB)")
  return errors
}

export async function uploadDocumentTemplatePdf(templateId: string, file: File): Promise<string> {
  const path = documentTemplateObjectPath(templateId)
  const { error } = await getSupabaseAdmin()
    .storage
    .from(DOCUMENT_TEMPLATE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: "application/pdf",
      upsert: true,
    })

  if (error) throw new Error(`Upload PDF nie powiodl sie: ${error.message}`)
  return path
}

export async function removeDocumentTemplatePdf(templateId: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .storage
    .from(DOCUMENT_TEMPLATE_BUCKET)
    .remove([documentTemplateObjectPath(templateId)])
  if (error) throw new Error(`Cleanup PDF nie powiodl sie: ${error.message}`)
}

export async function downloadDocumentTemplatePdf(templateId: string): Promise<Uint8Array> {
  const { data, error } = await getSupabaseAdmin()
    .storage
    .from(DOCUMENT_TEMPLATE_BUCKET)
    .download(documentTemplateObjectPath(templateId))

  if (error) throw new Error(`Odczyt PDF nie powiodl sie: ${error.message}`)
  return new Uint8Array(await data.arrayBuffer())
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- lib/document-template-storage.test.ts`

Expected: PASS.

---

### Task 2: Generator PDF Source Loading

**Files:**
- Modify: `lib/document-generator.ts`
- Test: `lib/document-template-storage.test.ts`

**Interfaces:**
- Consumes: `parseDocumentTemplateProxyPath(pdfPath: string): string | null`
- Consumes: `downloadDocumentTemplatePdf(templateId: string): Promise<Uint8Array>`
- Produces: `loadDocumentTemplatePdfBytes(pdfPath: string): Promise<Uint8Array>`

- [ ] **Step 1: Write the failing tests**

Append to `lib/document-template-storage.test.ts`:

```typescript
import { resolveDocumentTemplateSource } from "@/lib/document-template-storage"

describe("resolveDocumentTemplateSource", () => {
  it("detects local public form paths", () => {
    expect(resolveDocumentTemplateSource("/forms/x.pdf")).toEqual({
      kind: "local",
      publicPath: "forms/x.pdf",
    })
  })

  it("detects Supabase-backed template proxy paths", () => {
    expect(resolveDocumentTemplateSource("/api/documents/templates/wniosek/pdf")).toEqual({
      kind: "storage",
      templateId: "wniosek",
    })
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- lib/document-template-storage.test.ts`

Expected: FAIL because `resolveDocumentTemplateSource` is not exported.

- [ ] **Step 3: Implement source resolution and generator loading**

Add to `lib/document-template-storage.ts`:

```typescript
export type DocumentTemplateSource =
  | { kind: "local"; publicPath: string }
  | { kind: "storage"; templateId: string }

export function resolveDocumentTemplateSource(pdfPath: string): DocumentTemplateSource {
  const templateId = parseDocumentTemplateProxyPath(pdfPath)
  if (templateId) return { kind: "storage", templateId }

  const publicPath = pdfPath.startsWith("/") ? pdfPath.slice(1) : pdfPath
  return { kind: "local", publicPath }
}
```

Update `lib/document-generator.ts` imports and PDF loading:

```typescript
import { downloadDocumentTemplatePdf, resolveDocumentTemplateSource } from "@/lib/document-template-storage"
```

Add above `generateDocument`:

```typescript
export async function loadDocumentTemplatePdfBytes(pdfPath: string): Promise<Uint8Array> {
  const source = resolveDocumentTemplateSource(pdfPath)
  if (source.kind === "storage") {
    return downloadDocumentTemplatePdf(source.templateId)
  }

  const pdfPathOnDisk = path.join(process.cwd(), "public", source.publicPath)
  return fs.readFile(pdfPathOnDisk)
}
```

Replace existing PDF byte loading in `generateDocument` with:

```typescript
const pdfBytes = await loadDocumentTemplatePdfBytes(mapping.pdfPath)
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- lib/document-template-storage.test.ts`

Expected: PASS.

---

### Task 3: Multipart Mapping Creation API

**Files:**
- Modify: `app/api/documents/mappings/route.ts`

**Interfaces:**
- Consumes: `uploadDocumentTemplatePdf(templateId: string, file: File): Promise<string>`
- Consumes: `removeDocumentTemplatePdf(templateId: string): Promise<void>`
- Consumes: `documentTemplateProxyPath(templateId: string): string`
- Consumes: `validateDocumentTemplatePdfFile(file): string[]`
- Produces: `POST /api/documents/mappings` accepts `multipart/form-data` with `id`, `name`, and `pdf`.

- [ ] **Step 1: Add multipart branch after admin gate**

In `app/api/documents/mappings/route.ts`, import:

```typescript
import {
  documentTemplateProxyPath,
  removeDocumentTemplatePdf,
  uploadDocumentTemplatePdf,
  validateDocumentTemplatePdfFile,
} from "@/lib/document-template-storage"
```

Add helper in the route file:

```typescript
async function createMappingFromFormData(req: NextRequest) {
  const formData = await req.formData()
  const id = String(formData.get("id") ?? "").trim()
  const name = String(formData.get("name") ?? "").trim()
  const pdf = formData.get("pdf")
  const file = pdf instanceof File ? pdf : null

  const baseErrors = validateDocumentTemplateInput({ id, name, pdfPath: documentTemplateProxyPath(id || "missing") })
  const fileErrors = validateDocumentTemplatePdfFile(file)
  const errors = [...baseErrors.filter(error => error !== "Brak pdfPath"), ...fileErrors]
  if (errors.length || !file) {
    return NextResponse.json({ error: "Walidacja", details: errors }, { status: 400 })
  }

  await uploadDocumentTemplatePdf(id, file)
  try {
    const mapping = await createEmptyMapping({ id, name, pdfPath: documentTemplateProxyPath(id) })
    return NextResponse.json(mapping, { status: 201 })
  } catch (err: unknown) {
    let cleanupMessage = ""
    try {
      await removeDocumentTemplatePdf(id)
    } catch (cleanupErr: unknown) {
      cleanupMessage = cleanupErr instanceof Error ? ` Cleanup: ${cleanupErr.message}` : " Cleanup nie powiodl sie."
    }
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: `${message}${cleanupMessage}` }, { status: 500 })
  }
}
```

At the start of `POST` after the gate, add:

```typescript
const contentType = req.headers.get("content-type") ?? ""
if (contentType.includes("multipart/form-data")) {
  return createMappingFromFormData(req)
}
```

- [ ] **Step 2: Run focused tests**

Run: `npm test -- lib/document-template-storage.test.ts lib/document-store.test.ts`

Expected: PASS.

---

### Task 4: PDF Proxy Endpoint

**Files:**
- Create: `app/api/documents/templates/[id]/pdf/route.ts`

**Interfaces:**
- Consumes: `downloadDocumentTemplatePdf(templateId: string): Promise<Uint8Array>`
- Produces: `GET /api/documents/templates/[id]/pdf` returning `application/pdf`.

- [ ] **Step 1: Create the route**

Create `app/api/documents/templates/[id]/pdf/route.ts`:

```typescript
import { NextResponse } from "next/server"
import { downloadDocumentTemplatePdf } from "@/lib/document-template-storage"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const pdfBytes = await downloadDocumentTemplatePdf(id)
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${id}.pdf"`,
        "Cache-Control": "private, max-age=60",
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    const status = message.toLowerCase().includes("not found") ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
```

- [ ] **Step 2: Run TypeScript/build check**

Run: `npm run build`

Expected: Route type-checks. If unrelated existing build errors appear, record them and continue with focused tests.

---

### Task 5: Admin UI Upload Form

**Files:**
- Modify: `components/documents-admin-page.tsx`
- Uses existing `DocumentTemplateInput` state for `id` and `name`.

**Interfaces:**
- Consumes: `POST /api/documents/mappings` multipart with fields `id`, `name`, `pdf`.

- [ ] **Step 1: Add selected file state**

Import icon:

```typescript
import { ArrowLeft, Database, Edit3, FilePlus2, ListChecks, Plus, Save, Trash2, Upload } from "lucide-react"
```

Add state:

```typescript
const [templatePdfFile, setTemplatePdfFile] = useState<File | null>(null)
```

- [ ] **Step 2: Submit multipart form data**

Replace `handleCreateTemplate` body construction with:

```typescript
if (!templatePdfFile) {
  setStatus("Wybierz plik PDF")
  setIsSavingTemplate(false)
  return
}

const formData = new FormData()
formData.set("id", templateForm.id)
formData.set("name", templateForm.name)
formData.set("pdf", templatePdfFile)

const headers = await getAuthHeaders()
const res = await fetch("/api/documents/mappings", {
  method: "POST",
  headers,
  body: formData,
})
```

After successful creation, add:

```typescript
setTemplatePdfFile(null)
```

- [ ] **Step 3: Replace path input with PDF input**

Replace the `Sciezka PDF` label with:

```tsx
<label className="text-[11px] text-text-mute">
  Plik PDF
  <input
    required
    type="file"
    accept="application/pdf,.pdf"
    onChange={e => setTemplatePdfFile(e.target.files?.[0] ?? null)}
    className="mt-1 w-full rounded-btn border border-border bg-bg px-3 py-2 text-[13px] text-text file:mr-3 file:rounded-btn file:border-0 file:bg-surface-hover file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-text"
  />
  {templatePdfFile && (
    <span className="mt-1 block truncate text-[11px] text-text-dim">
      {templatePdfFile.name}
    </span>
  )}
</label>
```

Change button label:

```tsx
<Upload size={14} /> Wgraj PDF i utworz mapping
```

- [ ] **Step 4: Run focused tests**

Run: `npm test -- lib/document-template-storage.test.ts lib/document-store.test.ts`

Expected: PASS.

---

### Task 6: Verification And Cleanup

**Files:**
- Review all modified files.

- [ ] **Step 1: Run unit tests**

Run: `npm test`

Expected: PASS.

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: PASS, or report missing Next lint script/config if the project cannot run it.

- [ ] **Step 3: Run production build**

Run: `npm run build`

Expected: PASS, or report any pre-existing unrelated errors separately from this feature.

- [ ] **Step 4: Final git review**

Run: `git diff -- app/api/documents/mappings/route.ts app/api/documents/templates/[id]/pdf/route.ts components/documents-admin-page.tsx lib/document-generator.ts lib/document-template-storage.ts lib/document-template-storage.test.ts docs/superpowers/plans/2026-06-18-document-template-pdf-upload.md`

Expected: Diff only contains the planned upload feature and plan file.
