# Edycja inline danych klienta — Plan implementacji

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Przywrócić możliwość edycji danych klienta na stronie szczegółów `/clients/[id]` poprzez edycję inline w panelach, z pełną parytetowością pól względem starego modalu.

**Architecture:** Strona szczegółów trzyma `client` w `useState` i wystawia jedną funkcję `handleSave(patch)` wołającą istniejące `updateClient`. Każdy panel dostaje `client` + `onSave`, zarządza lokalnym trybem edycji przez hook `usePanelEditor`, a całą logikę czystą (normalizacja, walidacja, diff patcha) trzymamy w `lib/` (testowalne pod istniejącym vitest w środowisku node). `TimelinePanel` pozostaje read-only i odświeża się przez współdzielony stan.

**Tech Stack:** Next.js 15, React 19, TypeScript, react-hook-form (istniejący modal), Zod, shadcn/ui, Supabase, vitest.

---

## ⚠️ Uwaga o commitach

Użytkownik wyraźnie poprosił, aby **nie commitować ani nie pushować nic na GitHub** podczas tej pracy. Dlatego ten plan **nie zawiera kroków `git commit`**. Po każdym zadaniu uruchamiamy testy/typecheck zamiast commita. Jeśli na końcu pojawi się decyzja o commitach, robimy to dopiero po wyraźnej zgodzie.

---

## Środowisko testowe (ważne)

`vitest.config.ts` ma `environment: "node"` i `include: ["lib/**/*.test.ts"]`. W projekcie **nie ma** `@testing-library/react` ani środowiska DOM. Konsekwencje:

- Testy jednostkowe piszemy **tylko dla czystych funkcji w `lib/**/*.test.ts`**.
- Hook `usePanelEditor` i komponenty paneli **nie są** testowane jednostkowo — są cienką warstwą spinającą przetestowane funkcje z `lib/`. Weryfikujemy je ręcznie (Task 13).
- Komendy: `npm test` (uruchamia `vitest run`), `npx tsc --noEmit` (typecheck).

---

## Struktura plików

**Nowe (logika czysta, testowana):**
- `lib/client-schema.ts` — wyciągnięty `clientFormSchema`, `ClientFormValues`, per-panel pick-schematy, `validateWith()`.
- `lib/client-editor.ts` — `diffClientPatch()` (zwraca tylko zmienione pola).
- testy: `lib/client-schema.test.ts`, `lib/client-editor.test.ts`, rozszerzenie `lib/client-utils.test.ts`.

**Nowe (warstwa React, glue):**
- `hooks/use-panel-editor.ts` — hook trybu edycji.
- `components/clients/edit-actions.tsx` — wspólny pasek akcji (Edytuj / Zapisz / Anuluj).
- `components/clients/case-data-panel.tsx` — nowy panel danych sprawy.

**Modyfikowane:**
- `lib/client-utils.ts` — dodanie `isYes`, `emptyToNull`, `toDateInputValue`.
- `app/clients/[id]/page.tsx` — `handleSave`, przekazanie `onSave`, osadzenie `CaseDataPanel`.
- `components/clients/contact-panel.tsx`, `finances-panel.tsx`, `notes-panel.tsx`, `docs-checklist-panel.tsx`, `details-header.tsx` — tryb edycji.
- `components/client-details-modal.tsx` — import `clientFormSchema`/`isYes` z modułów współdzielonych (dedup).

---

## Task 1: Czyste helpery w `lib/client-utils.ts`

**Files:**
- Modify: `lib/client-utils.ts`
- Test: `lib/client-utils.test.ts` (utwórz)

- [ ] **Step 1: Napisz failing test**

Utwórz `lib/client-utils.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { isYes, emptyToNull, toDateInputValue } from "@/lib/client-utils"

describe("isYes", () => {
  it("rozpoznaje wartości prawdziwe", () => {
    expect(isYes(true)).toBe(true)
    expect(isYes("true")).toBe(true)
    expect(isYes("Yes")).toBe(true)
    expect(isYes("yes")).toBe(true)
    expect(isYes(1)).toBe(true)
    expect(isYes("1")).toBe(true)
  })
  it("rozpoznaje wartości fałszywe", () => {
    expect(isYes(false)).toBe(false)
    expect(isYes(null)).toBe(false)
    expect(isYes(undefined)).toBe(false)
    expect(isYes("")).toBe(false)
    expect(isYes("no")).toBe(false)
  })
})

describe("emptyToNull", () => {
  it("zamienia pusty/whitespace string na null", () => {
    expect(emptyToNull("")).toBeNull()
    expect(emptyToNull("   ")).toBeNull()
  })
  it("zachowuje niepusty string (przycięty)", () => {
    expect(emptyToNull("  abc ")).toBe("abc")
  })
})

describe("toDateInputValue", () => {
  it("konwertuje ISO na yyyy-MM-dd", () => {
    expect(toDateInputValue("2026-06-18T10:30:00.000Z")).toBe("2026-06-18")
    expect(toDateInputValue("2026-06-18")).toBe("2026-06-18")
  })
  it("zwraca pusty string dla null/undefined/pustego", () => {
    expect(toDateInputValue(null)).toBe("")
    expect(toDateInputValue(undefined)).toBe("")
    expect(toDateInputValue("")).toBe("")
  })
})
```

- [ ] **Step 2: Uruchom test — ma FAILować**

Run: `npm test -- lib/client-utils.test.ts`
Expected: FAIL — `isYes`/`emptyToNull`/`toDateInputValue` nie istnieją.

- [ ] **Step 3: Zaimplementuj helpery**

Dopisz na końcu `lib/client-utils.ts`:

```ts
export function isYes(value: unknown): boolean {
  if (value === true || value === "true") return true
  if (typeof value === "string" && value.toLowerCase() === "yes") return true
  if (value === 1 || value === "1") return true
  return false
}

export function emptyToNull(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

export function toDateInputValue(value: string | null | undefined): string {
  if (!value) return ""
  // ISO timestamp lub data — bierzemy pierwsze 10 znaków yyyy-MM-dd
  return value.slice(0, 10)
}
```

- [ ] **Step 4: Uruchom test — ma PRZEJŚĆ**

Run: `npm test -- lib/client-utils.test.ts`
Expected: PASS.

---

## Task 2: Współdzielony schemat w `lib/client-schema.ts`

**Files:**
- Create: `lib/client-schema.ts`
- Test: `lib/client-schema.test.ts`
- Modify: `components/client-details-modal.tsx` (import schematu zamiast lokalnej definicji)

- [ ] **Step 1: Napisz failing test**

Utwórz `lib/client-schema.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { clientFormSchema, contactSchema, validateWith } from "@/lib/client-schema"

describe("clientFormSchema", () => {
  it("odrzuca zbyt krótkie Name", () => {
    const result = clientFormSchema.safeParse({ Name: "A", Status: "Aktywny" })
    expect(result.success).toBe(false)
  })
  it("przyjmuje poprawne minimum", () => {
    const result = clientFormSchema.safeParse({ Name: "Anna", Status: "Aktywny" })
    expect(result.success).toBe(true)
  })
})

describe("validateWith", () => {
  it("zwraca null gdy brak błędów", () => {
    expect(validateWith(contactSchema, { Email: "a@b.pl", Phone: "", Adres: "", Firma: "", Inspektor: "" })).toBeNull()
  })
  it("zwraca mapę błędów per pole dla błędnego e-maila", () => {
    const errors = validateWith(contactSchema, { Email: "nie-email", Phone: "", Adres: "", Firma: "", Inspektor: "" })
    expect(errors).not.toBeNull()
    expect(errors?.Email).toBeTruthy()
  })
})
```

- [ ] **Step 2: Uruchom test — ma FAILować**

Run: `npm test -- lib/client-schema.test.ts`
Expected: FAIL — moduł nie istnieje.

- [ ] **Step 3: Utwórz `lib/client-schema.ts`**

```ts
import * as z from "zod"

// Pełny schemat klienta — źródło prawdy dla modalu i edycji inline w panelach.
export const clientFormSchema = z.object({
  Name: z.string().min(2, { message: "Imię i nazwisko musi mieć co najmniej 2 znaki." }),
  Status: z.string().min(1, { message: "Status jest wymagany." }),
  CelPobytu: z.string().optional(),
  PodLegPob: z.string().optional(),
  KrajPoch: z.string().optional(),
  Phone: z.string().optional(),
  Adres: z.string().nullable().optional(),
  StatusPla: z.string().optional(),
  Email: z.string().email({ message: "Niepoprawny adres e-mail." }).optional().or(z.literal("")),
  Birthday: z.string().optional(),
  Notes: z.string().optional(),
  Creator: z.string().optional(),
  TotalSpend: z.string().optional(),
  NumerSprawy: z.string().optional(),
  Inspektor: z.string().optional(),
  Firma: z.string().optional(),
  DataZloWnio: z.string().optional(),
  DataWydWni: z.string().optional(),
  DataOdbKartyPob: z.string().optional(),
  DataOdbDecyzji: z.string().optional(),
  DataZakLegPob: z.string().optional(),
  FormWni: z.boolean().default(false),
  ZalNrJed: z.boolean().default(false),
  KopiaPasz: z.boolean().default(false),
  ZalBlue: z.boolean().default(false),
  CzteZdjecia: z.boolean().default(false),
  Pelnomocnictwo: z.boolean().default(false),
})

export type ClientFormValues = z.infer<typeof clientFormSchema>

// Per-panel pick-schematy (walidacja tylko pól danego panelu).
export const headerSchema = clientFormSchema.pick({ Name: true, Status: true, CelPobytu: true, KrajPoch: true })
export const contactSchema = clientFormSchema.pick({ Email: true, Phone: true, Adres: true, Firma: true, Inspektor: true })
export const financesSchema = clientFormSchema.pick({ TotalSpend: true, StatusPla: true })
export const notesSchema = clientFormSchema.pick({ Notes: true })
export const caseDataSchema = clientFormSchema.pick({
  NumerSprawy: true, PodLegPob: true, Birthday: true,
  DataZloWnio: true, DataWydWni: true, DataOdbKartyPob: true, DataOdbDecyzji: true, DataZakLegPob: true,
})

// Waliduje draft danym schematem. Zwraca mapę { pole: komunikat } lub null gdy OK.
export function validateWith<T extends z.ZodTypeAny>(
  schema: T,
  draft: unknown,
): Record<string, string> | null {
  const result = schema.safeParse(draft)
  if (result.success) return null
  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "")
    if (key && !errors[key]) errors[key] = issue.message
  }
  return errors
}
```

- [ ] **Step 4: Uruchom test — ma PRZEJŚĆ**

Run: `npm test -- lib/client-schema.test.ts`
Expected: PASS.

- [ ] **Step 5: Dedup w modalu — importuj wspólny schemat**

W `components/client-details-modal.tsx` usuń lokalną definicję `clientFormSchema` (linie 49–83, tj. blok `const clientFormSchema = z.object({...})` oraz `type ClientFormValues = z.infer<...>`) i zamiast tego dodaj import na górze pliku (obok pozostałych importów z `@/lib`):

```ts
import { clientFormSchema, type ClientFormValues } from "@/lib/client-schema"
```

Pozostała część modalu (użycie `clientFormSchema`, `ClientFormValues`) działa bez zmian. Lokalny `import * as z from "zod"` można zostawić, jeśli `z` jest jeszcze używany gdzie indziej w pliku; jeśli nie — usuń go.

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: brak nowych błędów (w szczególności w `client-details-modal.tsx`).

---

## Task 3: `diffClientPatch` w `lib/client-editor.ts`

Zwraca tylko te pola, które różnią się od oryginału — aby do `updateClient` szły wyłącznie zmienione kolumny.

**Files:**
- Create: `lib/client-editor.ts`
- Test: `lib/client-editor.test.ts`

- [ ] **Step 1: Napisz failing test**

```ts
import { describe, expect, it } from "vitest"
import { diffClientPatch } from "@/lib/client-editor"
import type { Client } from "@/lib/superbase"

const original = { id: "1", Name: "Anna", Email: "a@b.pl", Phone: null, FormWni: false } as unknown as Client

describe("diffClientPatch", () => {
  it("zwraca tylko zmienione pola", () => {
    const patch = diffClientPatch(original, { Email: "nowy@b.pl", Phone: null })
    expect(patch).toEqual({ Email: "nowy@b.pl" })
  })
  it("zwraca pusty obiekt gdy nic się nie zmieniło", () => {
    const patch = diffClientPatch(original, { Email: "a@b.pl", Phone: null })
    expect(patch).toEqual({})
  })
  it("wykrywa zmianę boolean", () => {
    const patch = diffClientPatch(original, { FormWni: true })
    expect(patch).toEqual({ FormWni: true })
  })
})
```

- [ ] **Step 2: Uruchom test — ma FAILować**

Run: `npm test -- lib/client-editor.test.ts`
Expected: FAIL — moduł nie istnieje.

- [ ] **Step 3: Utwórz `lib/client-editor.ts`**

```ts
import type { Client } from "@/lib/superbase"

// Zwraca podzbiór `next` zawierający tylko pola różniące się od `original`.
export function diffClientPatch(original: Client, next: Partial<Client>): Partial<Client> {
  const patch: Partial<Client> = {}
  for (const key of Object.keys(next) as Array<keyof Client>) {
    if (next[key] !== original[key]) {
      patch[key] = next[key] as any
    }
  }
  return patch
}
```

- [ ] **Step 4: Uruchom test — ma PRZEJŚĆ**

Run: `npm test -- lib/client-editor.test.ts`
Expected: PASS.

---

## Task 4: Hook `usePanelEditor`

Cienka warstwa React spinająca `validateWith`, `diffClientPatch` i `onSave`. Bez testu jednostkowego (środowisko node bez DOM) — weryfikacja ręczna w Task 13.

**Files:**
- Create: `hooks/use-panel-editor.ts`

- [ ] **Step 1: Utwórz hook**

```ts
"use client"

import { useState } from "react"
import type { Client } from "@/lib/superbase"

export interface UsePanelEditorOptions<TDraft extends Record<string, any>> {
  // Tworzy świeży draft z aktualnego klienta (wołane przy każdym wejściu w edycję).
  initial: () => TDraft
  // Buduje pełny patch (znormalizowane wartości) z draftu.
  toPatch: (draft: TDraft) => Partial<Client>
  // Zapis — woła handleSave ze strony; rzuca wyjątek przy błędzie.
  onSave: (patch: Partial<Client>) => Promise<void>
  // Opcjonalna walidacja — zwraca mapę błędów lub null.
  validate?: (draft: TDraft) => Record<string, string> | null
}

export interface PanelEditor<TDraft> {
  isEditing: boolean
  draft: TDraft
  errors: Record<string, string>
  isSaving: boolean
  startEdit: () => void
  cancel: () => void
  setField: <K extends keyof TDraft>(key: K, value: TDraft[K]) => void
  submit: () => Promise<void>
}

export function usePanelEditor<TDraft extends Record<string, any>>(
  options: UsePanelEditorOptions<TDraft>,
): PanelEditor<TDraft> {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<TDraft>(options.initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)

  const startEdit = () => {
    setDraft(options.initial())
    setErrors({})
    setIsEditing(true)
  }

  const cancel = () => {
    setErrors({})
    setIsEditing(false)
  }

  const setField = <K extends keyof TDraft>(key: K, value: TDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const submit = async () => {
    const validationErrors = options.validate?.(draft) ?? null
    if (validationErrors && Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors({})
    setIsSaving(true)
    try {
      await options.onSave(options.toPatch(draft))
      setIsEditing(false)
    } catch {
      // onSave pokazuje własny toast; zostajemy w edycji z zachowanym draftem.
    } finally {
      setIsSaving(false)
    }
  }

  return { isEditing, draft, errors, isSaving, startEdit, cancel, setField, submit }
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: brak błędów.

---

## Task 5: Komponent `EditActions`

Wspólny pasek przycisków w nagłówku panelu.

**Files:**
- Create: `components/clients/edit-actions.tsx`

- [ ] **Step 1: Utwórz komponent**

```tsx
"use client"

import { Button } from "@/components/ui/button"
import { Pencil, Check, X, Loader2 } from "lucide-react"

interface EditActionsProps {
  isEditing: boolean
  isSaving: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
}

export function EditActions({ isEditing, isSaving, onEdit, onSave, onCancel }: EditActionsProps) {
  if (!isEditing) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-text-mute hover:text-text"
        onClick={onEdit}
        aria-label="Edytuj"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-text-mute hover:text-text"
        onClick={onCancel}
        disabled={isSaving}
      >
        <X className="h-3.5 w-3.5 mr-1" />
        Anuluj
      </Button>
      <Button
        size="sm"
        className="h-7 px-2 bg-brand hover:bg-brand-hover text-white"
        onClick={onSave}
        disabled={isSaving}
      >
        {isSaving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
        Zapisz
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: brak błędów.

---

## Task 6: `handleSave` na stronie + przekazanie `onSave`

**Files:**
- Modify: `app/clients/[id]/page.tsx`

- [ ] **Step 1: Dodaj `handleSave` i zaktualizuj typ propsów paneli**

W `app/clients/[id]/page.tsx`, w komponencie `ClientDetailsPage`, dodaj import i funkcję zapisu. Dopisz import na górze:

```tsx
import { Client, getClientById, updateClient } from "@/lib/superbase"
```

Wewnątrz komponentu, po deklaracji stanów (`client`, `isLoading`), dodaj:

```tsx
const handleSave = async (patch: Partial<Client>): Promise<void> => {
  if (!client) return
  if (Object.keys(patch).length === 0) return
  try {
    const updated = await updateClient(client.id, patch)
    setClient(updated)
    toast({ title: "Zapisano", description: "Dane klienta zostały zaktualizowane." })
  } catch (error) {
    console.error("Błąd zapisu klienta:", error)
    toast({
      title: "Błąd zapisu",
      description: "Nie udało się zapisać zmian. Spróbuj ponownie.",
      variant: "destructive",
    })
    throw error // pozwala panelowi pozostać w trybie edycji
  }
}
```

- [ ] **Step 2: Przekaż `onSave` do paneli edytowalnych**

Zmodyfikuj renderowanie paneli, dodając prop `onSave={handleSave}` do paneli edytowalnych oraz osadź nowy `CaseDataPanel` w prawej kolumnie zakładki „Przegląd". Zaktualizuj sekcję `TabsContent value="overview"`:

```tsx
<TabsContent value="overview" className="mt-8 border-none p-0 outline-none">
  <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
    <div className="flex flex-col gap-12">
      <TimelinePanel client={client} />
      <div className="h-px bg-border/60" />
      <NotesPanel client={client} onSave={handleSave} />
    </div>
    <div className="flex flex-col gap-6">
      <ContactPanel client={client} onSave={handleSave} />
      <CaseDataPanel client={client} onSave={handleSave} />
      <DocsChecklistPanel client={client} onSave={handleSave} />
      <FinancesPanel client={client} onSave={handleSave} />
    </div>
  </div>
</TabsContent>
```

Dodaj import nowego panelu na górze:

```tsx
import { CaseDataPanel } from "@/components/clients/case-data-panel"
```

Zaktualizuj też `DetailsHeader` (Task 11 doda mu `onSave`):

```tsx
<DetailsHeader client={client} onSave={handleSave} />
```

W zakładkach `documents`, `notes`, `finance` przekaż `onSave={handleSave}` do tych samych paneli (`DocsChecklistPanel`, `ContactPanel`, `NotesPanel`, `FinancesPanel`), aby edycja działała spójnie również tam.

- [ ] **Step 3: Typecheck (oczekiwane błędy propsów do czasu Tasków 7–12)**

Run: `npx tsc --noEmit`
Expected: błędy „Property 'onSave' does not exist" dla paneli — znikną po Taskach 7–12. To oczekiwane na tym etapie.

---

## Task 7: Edycja w `ContactPanel`

**Files:**
- Modify: `components/clients/contact-panel.tsx`

- [ ] **Step 1: Przepisz panel z trybem edycji**

Zastąp całą zawartość `components/clients/contact-panel.tsx`:

```tsx
"use client"

import { type Client } from "@/lib/superbase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Phone, MapPin, Building2, UserCircle } from "lucide-react"
import { usePanelEditor } from "@/hooks/use-panel-editor"
import { EditActions } from "@/components/clients/edit-actions"
import { contactSchema, validateWith } from "@/lib/client-schema"
import { emptyToNull } from "@/lib/client-utils"

interface ContactPanelProps {
  client: Client
  onSave: (patch: Partial<Client>) => Promise<void>
}

interface ContactDraft {
  Email: string
  Phone: string
  Adres: string
  Firma: string
  Inspektor: string
}

const FIELDS: Array<{ key: keyof ContactDraft; label: string; icon: typeof Mail; type?: string }> = [
  { key: "Email", label: "E-mail", icon: Mail, type: "email" },
  { key: "Phone", label: "Telefon", icon: Phone },
  { key: "Adres", label: "Adres", icon: MapPin },
  { key: "Firma", label: "Firma", icon: Building2 },
  { key: "Inspektor", label: "Inspektor", icon: UserCircle },
]

export function ContactPanel({ client, onSave }: ContactPanelProps) {
  const editor = usePanelEditor<ContactDraft>({
    initial: () => ({
      Email: client.Email ?? "",
      Phone: client.Phone ?? "",
      Adres: client.Adres ?? "",
      Firma: client.Firma ?? "",
      Inspektor: client.Inspektor ?? "",
    }),
    validate: (draft) => validateWith(contactSchema, draft),
    toPatch: (draft) => ({
      Email: emptyToNull(draft.Email),
      Phone: emptyToNull(draft.Phone),
      Adres: emptyToNull(draft.Adres),
      Firma: emptyToNull(draft.Firma),
      Inspektor: emptyToNull(draft.Inspektor),
    }),
    onSave,
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Kontakt</CardTitle>
        <EditActions
          isEditing={editor.isEditing}
          isSaving={editor.isSaving}
          onEdit={editor.startEdit}
          onSave={editor.submit}
          onCancel={editor.cancel}
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {FIELDS.map(({ key, label, icon: Icon, type }) => (
          <div key={key} className="flex items-start gap-3">
            <div className="mt-0.5 text-text-mute">
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex flex-col gap-0.5 flex-1">
              <span className="text-[10px] text-text-mute uppercase font-semibold tracking-wider">{label}</span>
              {editor.isEditing ? (
                <div className="flex flex-col gap-1">
                  <Input
                    type={type ?? "text"}
                    value={editor.draft[key]}
                    onChange={(e) => editor.setField(key, e.target.value)}
                    className="h-8 text-[13px]"
                  />
                  {editor.errors[key] && (
                    <span className="text-[11px] text-danger">{editor.errors[key]}</span>
                  )}
                </div>
              ) : (
                <span className="text-[13px] font-medium text-text">{client[key] || "Brak danych"}</span>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: brak błędów w `contact-panel.tsx` ani w stronie dla tego panelu.

---

## Task 8: Edycja w `DocsChecklistPanel` (checkboxy)

**Files:**
- Modify: `components/clients/docs-checklist-panel.tsx`

- [ ] **Step 1: Przepisz panel z trybem edycji**

Zastąp całą zawartość `components/clients/docs-checklist-panel.tsx`:

```tsx
"use client"

import { type Client } from "@/lib/superbase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { usePanelEditor } from "@/hooks/use-panel-editor"
import { EditActions } from "@/components/clients/edit-actions"
import { isYes } from "@/lib/client-utils"

interface DocsChecklistPanelProps {
  client: Client
  onSave: (patch: Partial<Client>) => Promise<void>
}

type DocKey = "FormWni" | "ZalNrJed" | "KopiaPasz" | "ZalBlue" | "CzteZdjecia" | "Pelnomocnictwo"

const DOCS: Array<{ key: DocKey; label: string }> = [
  { key: "FormWni", label: "Formularz wniosku" },
  { key: "ZalNrJed", label: "Załącznik nr 1" },
  { key: "KopiaPasz", label: "Kopia paszportu" },
  { key: "ZalBlue", label: "Załącznik niebieski" },
  { key: "CzteZdjecia", label: "4 zdjęcia" },
  { key: "Pelnomocnictwo", label: "Pełnomocnictwo" },
]

type DocsDraft = Record<DocKey, boolean>

export function DocsChecklistPanel({ client, onSave }: DocsChecklistPanelProps) {
  const editor = usePanelEditor<DocsDraft>({
    initial: () => ({
      FormWni: isYes(client.FormWni),
      ZalNrJed: isYes(client.ZalNrJed),
      KopiaPasz: isYes(client.KopiaPasz),
      ZalBlue: isYes(client.ZalBlue),
      CzteZdjecia: isYes(client.CzteZdjecia),
      Pelnomocnictwo: isYes(client.Pelnomocnictwo),
    }),
    toPatch: (draft) => ({ ...draft }),
    onSave,
  })

  const completedCount = DOCS.filter((d) => isYes(client[d.key])).length

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Dokumenty</CardTitle>
        <div className="flex items-center gap-2">
          {!editor.isEditing && (
            <span className="text-xs font-semibold text-text-mute">{completedCount}/{DOCS.length}</span>
          )}
          <EditActions
            isEditing={editor.isEditing}
            isSaving={editor.isSaving}
            onEdit={editor.startEdit}
            onSave={editor.submit}
            onCancel={editor.cancel}
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {DOCS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-text">{label}</span>
            {editor.isEditing ? (
              <Checkbox
                checked={editor.draft[key]}
                onCheckedChange={(value) => editor.setField(key, value === true)}
              />
            ) : isYes(client[key]) ? (
              <CheckCircle2 className="w-4 h-4 text-success" />
            ) : (
              <AlertCircle className="w-4 h-4 text-warn" />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: brak błędów w `docs-checklist-panel.tsx`.

---

## Task 9: Edycja w `FinancesPanel`

Edytowalne: `TotalSpend` (string liczbowy) i `StatusPla`. Wartości pochodne (zapłacono/pozostało/%) liczą się jak dotąd z `client`.

**Files:**
- Modify: `components/clients/finances-panel.tsx`

- [ ] **Step 1: Przepisz panel z trybem edycji**

Zastąp całą zawartość `components/clients/finances-panel.tsx`:

```tsx
"use client"

import { type Client } from "@/lib/superbase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePanelEditor } from "@/hooks/use-panel-editor"
import { EditActions } from "@/components/clients/edit-actions"
import { emptyToNull } from "@/lib/client-utils"

interface FinancesPanelProps {
  client: Client
  onSave: (patch: Partial<Client>) => Promise<void>
}

interface FinancesDraft {
  TotalSpend: string
  StatusPla: string
}

export function FinancesPanel({ client, onSave }: FinancesPanelProps) {
  const editor = usePanelEditor<FinancesDraft>({
    initial: () => ({
      TotalSpend: client.TotalSpend ?? "",
      StatusPla: client.StatusPla ?? "",
    }),
    toPatch: (draft) => ({
      TotalSpend: emptyToNull(draft.TotalSpend),
      StatusPla: emptyToNull(draft.StatusPla),
    }),
    onSave,
  })

  const totalSpendStr = client.TotalSpend?.replace(/[^\d.-]/g, "") || "0"
  const total = parseFloat(totalSpendStr) || 0

  let paid = 0
  const statusLower = client.StatusPla?.toLowerCase() ?? ""
  if (statusLower.includes("opłacon") || statusLower.includes("zapłacon")) {
    paid = total
  } else if (statusLower.includes("zaliczka")) {
    paid = total * 0.5
  }

  const remaining = total - paid
  const percentage = total > 0 ? Math.round((paid / total) * 100) : 0
  const isPaid = statusLower.includes("opłacon") || statusLower.includes("zapłacon")

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Finanse</CardTitle>
        <EditActions
          isEditing={editor.isEditing}
          isSaving={editor.isSaving}
          onEdit={editor.startEdit}
          onSave={editor.submit}
          onCancel={editor.cancel}
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {editor.isEditing ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] text-text-mute uppercase font-semibold tracking-wider">Wartość całkowita (PLN)</Label>
              <Input
                value={editor.draft.TotalSpend}
                onChange={(e) => editor.setField("TotalSpend", e.target.value)}
                className="h-8 text-[13px]"
                placeholder="np. 1500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] text-text-mute uppercase font-semibold tracking-wider">Status płatności</Label>
              <Input
                value={editor.draft.StatusPla}
                onChange={(e) => editor.setField("StatusPla", e.target.value)}
                className="h-8 text-[13px]"
                placeholder="np. Opłacone / Zaliczka"
              />
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-text-mute">Status</span>
                {client.StatusPla ? (
                  <Badge variant={isPaid ? "success" : "warn"}>{client.StatusPla}</Badge>
                ) : (
                  <span className="font-semibold text-text">Brak danych</span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-text-mute">Opłacono {percentage}%</span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-border">
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-text-mute">Wartość całkowita</span>
                <span className="font-semibold text-text">{total.toLocaleString("pl-PL", { style: "currency", currency: "PLN" })}</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-text-mute">Zapłacono</span>
                <span className="font-semibold text-success">{paid.toLocaleString("pl-PL", { style: "currency", currency: "PLN" })}</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-text-mute">Pozostało</span>
                <span className="font-semibold text-text">{remaining.toLocaleString("pl-PL", { style: "currency", currency: "PLN" })}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: brak błędów w `finances-panel.tsx`.

---

## Task 10: Edycja w `NotesPanel` (pole `Notes`)

Zgodnie z decyzją: edytujemy pojedyncze pole `Notes`. Istniejący stub „Dodaj notatkę" (toast „Funkcja w budowie") zostaje zastąpiony rzeczywistą edycją pola.

**Files:**
- Modify: `components/clients/notes-panel.tsx`

- [ ] **Step 1: Przepisz panel z trybem edycji pola `Notes`**

Zastąp całą zawartość `components/clients/notes-panel.tsx`:

```tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Client } from "@/lib/superbase"
import { User, MessageSquare } from "lucide-react"
import { usePanelEditor } from "@/hooks/use-panel-editor"
import { EditActions } from "@/components/clients/edit-actions"
import { emptyToNull } from "@/lib/client-utils"

interface NotesPanelProps {
  client: Client
  onSave: (patch: Partial<Client>) => Promise<void>
}

interface NotesDraft {
  Notes: string
}

export function NotesPanel({ client, onSave }: NotesPanelProps) {
  const editor = usePanelEditor<NotesDraft>({
    initial: () => ({ Notes: client.Notes ?? "" }),
    toPatch: (draft) => ({ Notes: emptyToNull(draft.Notes) }),
    onSave,
  })

  const author = client.Creator || "System"
  const date = client.CreatedDate ? new Date(client.CreatedDate).toLocaleDateString("pl-PL") : "Początek"

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-6 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-bold uppercase tracking-widest text-text-mute flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Notatki
        </CardTitle>
        <EditActions
          isEditing={editor.isEditing}
          isSaving={editor.isSaving}
          onEdit={editor.startEdit}
          onSave={editor.submit}
          onCancel={editor.cancel}
        />
      </CardHeader>
      <CardContent className="px-0 flex flex-col gap-6">
        {editor.isEditing ? (
          <Textarea
            placeholder="Notatka dotycząca klienta..."
            className="min-h-[140px] resize-none border-border-strong focus-visible:ring-brand/30 bg-surface/20 rounded-card text-sm p-4"
            value={editor.draft.Notes}
            onChange={(e) => editor.setField("Notes", e.target.value)}
          />
        ) : client.Notes ? (
          <div className="p-4 rounded-card border border-border bg-surface/30 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center">
                <User className="h-3 w-3 text-brand" />
              </div>
              <span className="text-xs font-semibold text-text">{author}</span>
              <span className="text-[10px] text-text-mute font-mono uppercase">{date}</span>
            </div>
            <p className="text-sm text-text-dim leading-relaxed whitespace-pre-wrap">{client.Notes}</p>
          </div>
        ) : (
          <p className="text-sm text-text-mute italic px-2">Brak notatek dla tego klienta.</p>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: brak błędów w `notes-panel.tsx`.

---

## Task 11: Edycja w `DetailsHeader`

Edytowalne: `Name`, `Status`, `CelPobytu`, `KrajPoch`. Przyciski akcji (E-mail/Zadzwoń/Nowa akcja) zostają; dokładamy edycję.

**Files:**
- Modify: `components/clients/details-header.tsx`

- [ ] **Step 1: Przepisz nagłówek z trybem edycji**

Zastąp całą zawartość `components/clients/details-header.tsx`:

```tsx
"use client"

import { ArrowLeft, Mail, Phone, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Client } from "@/lib/superbase"
import { getInitials, getFlagEmoji, emptyToNull } from "@/lib/client-utils"
import { usePanelEditor } from "@/hooks/use-panel-editor"
import { EditActions } from "@/components/clients/edit-actions"
import { headerSchema, validateWith } from "@/lib/client-schema"

interface DetailsHeaderProps {
  client: Client
  onSave: (patch: Partial<Client>) => Promise<void>
}

interface HeaderDraft {
  Name: string
  Status: string
  CelPobytu: string
  KrajPoch: string
}

export function DetailsHeader({ client, onSave }: DetailsHeaderProps) {
  const router = useRouter()

  const editor = usePanelEditor<HeaderDraft>({
    initial: () => ({
      Name: client.Name ?? "",
      Status: client.Status ?? "",
      CelPobytu: client.CelPobytu ?? "",
      KrajPoch: client.KrajPoch ?? "",
    }),
    validate: (draft) => validateWith(headerSchema, draft),
    toPatch: (draft) => ({
      Name: draft.Name.trim(),
      Status: draft.Status.trim(),
      CelPobytu: emptyToNull(draft.CelPobytu),
      KrajPoch: emptyToNull(draft.KrajPoch),
    }),
    onSave,
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 -ml-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-text-dim hover:text-text h-8 px-2 flex items-center gap-1.5"
          onClick={() => router.push("/clients")}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-[13px] font-medium">Powrót</span>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-[44px] h-[44px] rounded-full bg-gradient-to-br from-brand to-brand-deep flex items-center justify-center text-white font-semibold text-sm shrink-0 shadow-sm">
            {getInitials(client.Name)}
          </div>

          {editor.isEditing ? (
            <div className="flex flex-col gap-2 min-w-[280px]">
              <div className="flex flex-col gap-1">
                <Input
                  value={editor.draft.Name}
                  onChange={(e) => editor.setField("Name", e.target.value)}
                  className="h-9 text-lg font-bold"
                  placeholder="Imię i nazwisko"
                />
                {editor.errors.Name && <span className="text-[11px] text-danger">{editor.errors.Name}</span>}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <Input value={editor.draft.Status} onChange={(e) => editor.setField("Status", e.target.value)} className="h-8 text-xs" placeholder="Status" />
                  {editor.errors.Status && <span className="text-[11px] text-danger">{editor.errors.Status}</span>}
                </div>
                <Input value={editor.draft.CelPobytu} onChange={(e) => editor.setField("CelPobytu", e.target.value)} className="h-8 text-xs" placeholder="Cel pobytu" />
                <Input value={editor.draft.KrajPoch} onChange={(e) => editor.setField("KrajPoch", e.target.value)} className="h-8 text-xs" placeholder="Kraj pochodzenia" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-text leading-none">{client.Name}</h1>
                <span className="text-xl leading-none" title={client.KrajPoch || "Nieznany"}>
                  {getFlagEmoji(client.KrajPoch || client.country_name)}
                </span>
                <Badge variant="outline" className="uppercase text-[10px] font-bold px-1.5 py-0 h-5 border-brand/20 text-brand bg-brand-soft tracking-wider rounded-pill">
                  {client.Status}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs-plus text-text-dim">
                <span className="font-mono text-text-mute tracking-tight">ID: {String(client.id).substring(0, 8)}</span>
                <span className="w-1 h-1 rounded-full bg-border-strong shrink-0" />
                <span className="font-medium text-text-dim">{client.CelPobytu || "Brak typu"}</span>
                <span className="w-1 h-1 rounded-full bg-border-strong shrink-0" />
                <span className="text-text-dim">{client.KrajPoch || client.country_name || "Brak kraju"}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-2 md:mt-0">
          <EditActions
            isEditing={editor.isEditing}
            isSaving={editor.isSaving}
            onEdit={editor.startEdit}
            onSave={editor.submit}
            onCancel={editor.cancel}
          />
          {!editor.isEditing && (
            <>
              <Button variant="outline" size="sm" className="h-9 px-4 text-[13px] font-medium border-border-strong hover:bg-surface-hover text-text-dim hover:text-text">
                <Mail className="mr-2 h-4 w-4" />
                E-mail
              </Button>
              <Button variant="outline" size="sm" className="h-9 px-4 text-[13px] font-medium border-border-strong hover:bg-surface-hover text-text-dim hover:text-text">
                <Phone className="mr-2 h-4 w-4" />
                Zadzwoń
              </Button>
              <Button size="sm" className="h-9 px-4 text-[13px] font-semibold bg-brand hover:bg-brand-hover text-white shadow-btn-primary border-none rounded-btn">
                <Plus className="mr-2 h-4 w-4" />
                Nowa akcja
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: brak błędów w `details-header.tsx`.

---

## Task 12: Nowy `CaseDataPanel` (dane sprawy)

Pola: `NumerSprawy`, `PodLegPob`, `Birthday`, oraz daty `DataZloWnio`, `DataWydWni`, `DataOdbKartyPob`, `DataOdbDecyzji`, `DataZakLegPob`. Daty edytowane przez `<Input type="date">`.

**Files:**
- Create: `components/clients/case-data-panel.tsx`
- (Osadzenie w stronie zrobione już w Task 6, Step 2.)

- [ ] **Step 1: Utwórz panel**

```tsx
"use client"

import { type Client } from "@/lib/superbase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePanelEditor } from "@/hooks/use-panel-editor"
import { EditActions } from "@/components/clients/edit-actions"
import { caseDataSchema, validateWith } from "@/lib/client-schema"
import { emptyToNull, toDateInputValue } from "@/lib/client-utils"

interface CaseDataPanelProps {
  client: Client
  onSave: (patch: Partial<Client>) => Promise<void>
}

interface CaseDraft {
  NumerSprawy: string
  PodLegPob: string
  Birthday: string
  DataZloWnio: string
  DataWydWni: string
  DataOdbKartyPob: string
  DataOdbDecyzji: string
  DataZakLegPob: string
}

const TEXT_FIELDS: Array<{ key: "NumerSprawy" | "PodLegPob"; label: string }> = [
  { key: "NumerSprawy", label: "Numer sprawy" },
  { key: "PodLegPob", label: "Podstawa legalnego pobytu" },
]

const DATE_FIELDS: Array<{ key: keyof CaseDraft; label: string }> = [
  { key: "Birthday", label: "Data urodzenia" },
  { key: "DataZloWnio", label: "Data złożenia wniosku" },
  { key: "DataWydWni", label: "Data wydania wniosku" },
  { key: "DataOdbKartyPob", label: "Data odbioru karty pobytu" },
  { key: "DataOdbDecyzji", label: "Data odbioru decyzji" },
  { key: "DataZakLegPob", label: "Data zakończenia legalnego pobytu" },
]

function displayDate(value: string | null | undefined): string {
  const v = toDateInputValue(value)
  if (!v) return "Brak danych"
  return new Date(v).toLocaleDateString("pl-PL")
}

export function CaseDataPanel({ client, onSave }: CaseDataPanelProps) {
  const editor = usePanelEditor<CaseDraft>({
    initial: () => ({
      NumerSprawy: client.NumerSprawy ?? "",
      PodLegPob: client.PodLegPob ?? "",
      Birthday: toDateInputValue(client.Birthday),
      DataZloWnio: toDateInputValue(client.DataZloWnio),
      DataWydWni: toDateInputValue(client.DataWydWni),
      DataOdbKartyPob: toDateInputValue(client.DataOdbKartyPob),
      DataOdbDecyzji: toDateInputValue(client.DataOdbDecyzji),
      DataZakLegPob: toDateInputValue(client.DataZakLegPob),
    }),
    validate: (draft) => validateWith(caseDataSchema, draft),
    toPatch: (draft) => ({
      NumerSprawy: emptyToNull(draft.NumerSprawy),
      PodLegPob: emptyToNull(draft.PodLegPob),
      Birthday: emptyToNull(draft.Birthday),
      DataZloWnio: emptyToNull(draft.DataZloWnio),
      DataWydWni: emptyToNull(draft.DataWydWni),
      DataOdbKartyPob: emptyToNull(draft.DataOdbKartyPob),
      DataOdbDecyzji: emptyToNull(draft.DataOdbDecyzji),
      DataZakLegPob: emptyToNull(draft.DataZakLegPob),
    }),
    onSave,
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Dane sprawy</CardTitle>
        <EditActions
          isEditing={editor.isEditing}
          isSaving={editor.isSaving}
          onEdit={editor.startEdit}
          onSave={editor.submit}
          onCancel={editor.cancel}
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {TEXT_FIELDS.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-1">
            <Label className="text-[10px] text-text-mute uppercase font-semibold tracking-wider">{label}</Label>
            {editor.isEditing ? (
              <Input
                value={editor.draft[key]}
                onChange={(e) => editor.setField(key, e.target.value)}
                className="h-8 text-[13px]"
              />
            ) : (
              <span className="text-[13px] font-medium text-text">{client[key] || "Brak danych"}</span>
            )}
          </div>
        ))}

        {DATE_FIELDS.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-1">
            <Label className="text-[10px] text-text-mute uppercase font-semibold tracking-wider">{label}</Label>
            {editor.isEditing ? (
              <Input
                type="date"
                value={editor.draft[key]}
                onChange={(e) => editor.setField(key, e.target.value)}
                className="h-8 text-[13px]"
              />
            ) : (
              <span className="text-[13px] font-medium text-text">{displayDate(client[key as keyof Client] as string | null)}</span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: brak błędów. Wszystkie propsy `onSave` paneli ze strony są już spełnione.

---

## Task 13: Pełna weryfikacja

**Files:** brak zmian — tylko uruchomienie.

- [ ] **Step 1: Pełny zestaw testów jednostkowych**

Run: `npm test`
Expected: PASS — wszystkie testy, w tym nowe `client-utils`, `client-schema`, `client-editor`.

- [ ] **Step 2: Typecheck całości**

Run: `npx tsc --noEmit`
Expected: brak błędów.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: build kończy się sukcesem.

- [ ] **Step 4: Weryfikacja ręczna w przeglądarce**

Uruchom `npm run dev`, wejdź na `/clients`, otwórz dowolnego klienta i sprawdź:
- Każdy panel (Kontakt, Dane sprawy, Dokumenty, Finanse, Notatki, nagłówek) ma ikonę „Edytuj".
- Wejście w edycję pokazuje pola; „Anuluj" przywraca widok bez zmian.
- „Zapisz" zapisuje (toast „Zapisano"), wartości się aktualizują, a `TimelinePanel` odzwierciedla zmienione daty.
- Walidacja: pusta nazwa / błędny e-mail blokuje zapis i pokazuje komunikat.
- Błąd zapisu (np. odłączenie sieci) → toast błędu, panel zostaje w edycji z zachowanymi danymi.
- Checkboxy dokumentów zapisują się i licznik `x/6` się aktualizuje.

---

## Self-Review (wykonane przy pisaniu planu)

**Pokrycie specu:**
- Mapowanie pól → Taski 7–12 (każdy panel + nowy CaseDataPanel). ✓
- Pojedyncze źródło prawdy + `handleSave` → Task 6. ✓
- Hook `usePanelEditor` → Task 4. ✓
- Wspólny pasek akcji → Task 5. ✓
- Walidacja dedup ze starym modalem (`lib/client-schema.ts`, import w modalu) → Task 2. ✓
- Konwersja dat ISO↔yyyy-MM-dd → Task 1 (`toDateInputValue`), użycie w Task 12. ✓
- Obsługa błędów (toast + pozostanie w edycji) → Task 6 (`throw`) + Task 4 (catch). ✓
- TimelinePanel read-only, odświeżany stanem → Task 6 (współdzielony `client`). ✓
- NotesPanel = pojedyncze pole `Notes` → Task 10. ✓
- CaseDataPanel w prawej kolumnie „Przegląd" → Task 6 Step 2. ✓
- Testy → Taski 1–3 (czyste funkcje) + Task 13 (weryfikacja ręczna glue). ✓

**Odchylenie od specu (uzasadnione):** spec zakładał testy hooka `usePanelEditor`; środowisko vitest (node, bez DOM/testing-library) tego nie pozwala bez nowych zależności (YAGNI). Logikę testowalną przeniesiono do `lib/` i tam pokryto testami; hook to cienka warstwa weryfikowana ręcznie.

**Spójność typów:** `handleSave`/`onSave: (patch: Partial<Client>) => Promise<void>` użyte identycznie w stronie i wszystkich panelach. `PanelEditor`/`usePanelEditor` API spójne między Task 4 a Taskami 7–12. `isYes`, `emptyToNull`, `toDateInputValue` zdefiniowane w Task 1 i używane konsekwentnie.

**Placeholdery:** brak TBD/TODO; każdy krok zawiera pełny kod lub konkretną komendę z oczekiwanym wynikiem.
