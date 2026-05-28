# Clients Review Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix critical and important issues found during the code review of `/clients` (list + details) so that the branch builds, the CSV export is safe, and the UI no longer shows fake data as if it were real.

**Architecture:** Surgical fixes on existing files. No new features. One shared helper module (`lib/client-utils.ts`) extracted to deduplicate inline helpers. TypeScript build passes as verification.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind, Shadcn UI.

---

## Scope

**In scope** (from review):
1. Missing `Card`/`CardContent` import — build-breaking
2. CSV export: no escaping, no BOM
3. `NotesPanel`: hardcoded mock notes visible to every client
4. `NotesPanel`: „Dodaj notatkę" button does nothing
5. Table column "Następny termin" actually shows application submission date
6. `showCompleted` dead state on `client-table.tsx`
7. Timeline dates without year
8. Duplicated `getInitials` and `getFlag*` helpers across components

**Out of scope** (deliberately deferred — require DB/schema changes or design decisions):
- `FinancesPanel` string-based payment heuristic (needs numeric `paid_amount` column)
- Panel duplication across tabs (design question — confirm with user first)
- Renaming `@/lib/superbase` → `supabase` (cross-cutting churn)
- Wiring `NotesPanel` submit to Supabase (needs new table + API)

---

## File structure

**Create:**
- `lib/client-utils.ts` — shared helpers: `getInitials`, `getFlagEmoji`, `CSV_BOM`, `escapeCsvCell`.

**Modify:**
- `app/clients/[id]/page.tsx` — add missing imports.
- `components/client-table.tsx` — use shared helpers, fix CSV escaping, rename column, remove dead state.
- `components/clients/details-header.tsx` — use shared helpers.
- `components/clients/notes-panel.tsx` — remove mock, disable submit with "w budowie" toast.
- `components/clients/timeline-panel.tsx` — include year in formatted dates.

---

## Task 1: Fix build-breaking import in client details page

**Files:**
- Modify: `app/clients/[id]/page.tsx:15`

- [ ] **Step 1: Add `Card` + `CardContent` import**

In `app/clients/[id]/page.tsx`, after line 15, add:

```tsx
import { Card, CardContent } from "@/components/ui/card"
```

- [ ] **Step 2: Verify typecheck passes for this file**

Run: `npx tsc --noEmit`
Expected: no more `Cannot find name 'Card'` / `Cannot find name 'CardContent'` errors referencing `app/clients/[id]/page.tsx`.

- [ ] **Step 3: Commit**

```bash
git add app/clients/[id]/page.tsx
git commit -m "fix(clients): add missing Card imports in details page"
```

---

## Task 2: Create shared client utils module

**Files:**
- Create: `lib/client-utils.ts`

- [ ] **Step 1: Write `lib/client-utils.ts`**

```ts
const COUNTRY_FLAGS: Array<[RegExp, string]> = [
  [/polsk/i, "🇵🇱"],
  [/ukrai/i, "🇺🇦"],
  [/biało|bialor/i, "🇧🇾"],
  [/gruz/i, "🇬🇪"],
  [/mołd|moldow/i, "🇲🇩"],
  [/rosj|rossi/i, "🇷🇺"],
  [/kazach/i, "🇰🇿"],
  [/uzbek/i, "🇺🇿"],
  [/indie|india/i, "🇮🇳"],
]

export function getFlagEmoji(country: string | null | undefined): string {
  if (!country) return "🏳️"
  for (const [pattern, flag] of COUNTRY_FLAGS) {
    if (pattern.test(country)) return flag
  }
  return "🌍"
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "??"
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)
}

export const CSV_BOM = "﻿"

export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return ""
  const str = String(value)
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add lib/client-utils.ts
git commit -m "refactor(clients): extract shared flag/initials/csv helpers"
```

---

## Task 3: Use shared helpers + fix CSV export in client table

**Files:**
- Modify: `components/client-table.tsx`

- [ ] **Step 1: Replace inline helpers and dead state**

In `components/client-table.tsx`:

1. Add import next to existing `cn` import:
```ts
import { getFlagEmoji, getInitials, CSV_BOM, escapeCsvCell } from "@/lib/client-utils"
```

2. Delete the local `getInitials` (lines 70-78) and `getFlagEmoji` (lines 80-91) definitions — the imports now supply them.

3. Delete the dead `showCompleted` state line:
```ts
const [showCompleted, setShowCompleted] = useState(false)
```
and in `filteredClients` (around line 211) remove the `matchesCompletedFilter` branch — simplify the return to `return matchesSearch && matchesStatus;`.

- [ ] **Step 2: Fix CSV export with escaping + BOM**

Replace the body of `exportToCSV` with:

```ts
const exportToCSV = () => {
  const headers = ["Klient", "ID", "Sprawa", "Status", "Data złożenia", "Doradca"]
  const rows = sortedClients.map((c) => [
    c.Name,
    c.id,
    c.CelPobytu,
    c.Status,
    c.DataZloWnio,
    c.Inspektor || c.Creator,
  ])

  const csvContent =
    CSV_BOM +
    [headers, ...rows]
      .map((row) => row.map(escapeCsvCell).join(","))
      .join("\r\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", "klienci.csv")
  link.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 3: Rename misleading column header**

Change the column header text on the sortable `DataZloWnio` header (currently "Następny termin") to "Data złożenia":

```tsx
<div className="flex items-center">Data złożenia <SortIcon column="DataZloWnio" /></div>
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors introduced. Pre-existing `lib/pdf-generator.ts` errors are unrelated.

- [ ] **Step 5: Commit**

```bash
git add components/client-table.tsx
git commit -m "fix(clients): safe CSV export, accurate column header, remove dead state"
```

---

## Task 4: Use shared helpers in details header

**Files:**
- Modify: `components/clients/details-header.tsx`

- [ ] **Step 1: Import shared helpers and delete local copies**

At the top of `components/clients/details-header.tsx`, add:

```ts
import { getInitials, getFlagEmoji } from "@/lib/client-utils"
```

Then remove the local `getInitials` (lines 17-25) and `getFlag` (lines 28-41) definitions inside the component body, and rename the call `getFlag(...)` to `getFlagEmoji(...)` at the JSX site.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add components/clients/details-header.tsx
git commit -m "refactor(clients): reuse shared flag/initials helpers in details header"
```

---

## Task 5: Remove fake notes, gate submit behind "w budowie" toast

**Files:**
- Modify: `components/clients/notes-panel.tsx`

- [ ] **Step 1: Replace mocks with real data only**

In `components/clients/notes-panel.tsx`:

1. Add toast import next to the existing imports:
```ts
import { toast } from "@/hooks/use-toast"
```

2. Replace the `notes` array construction (lines 46-66) with:

```tsx
const notes: NoteProps[] = []
if (client.Notes) {
  notes.push({
    author: client.Creator || "System",
    date: client.CreatedDate
      ? new Date(client.CreatedDate).toLocaleDateString("pl-PL")
      : "Początek",
    content: client.Notes,
  })
}
```

3. Replace `handleSubmitNote` (lines 68-73) with:

```ts
const handleSubmitNote = () => {
  if (!newNote.trim()) return
  toast({
    title: "Funkcja w budowie",
    description: "Zapis notatek zostanie dodany w kolejnej iteracji.",
  })
  setNewNote("")
}
```

4. In the JSX, render an empty state when there are no notes. Find the `{notes.map(...)}` block and wrap it:

```tsx
{notes.length === 0 ? (
  <p className="text-sm text-text-mute italic px-2">
    Brak notatek dla tego klienta.
  </p>
) : (
  notes.map((note, index) => (
    <NoteItem
      key={index}
      author={note.author}
      date={note.date}
      content={note.content}
    />
  ))
)}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add components/clients/notes-panel.tsx
git commit -m "fix(clients): remove hardcoded fake notes, show build-in-progress toast on submit"
```

---

## Task 6: Add year to timeline dates

**Files:**
- Modify: `components/clients/timeline-panel.tsx`

- [ ] **Step 1: Include year in formatted dates**

In `components/clients/timeline-panel.tsx`, change each `toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })` call in the `stages` array (lines 81, 87, 93, 99) to:

```ts
toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: '2-digit' })
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add components/clients/timeline-panel.tsx
git commit -m "fix(clients): include year in timeline dates"
```

---

## Task 7: Final verification

- [ ] **Step 1: Full typecheck**

Run: `npx tsc --noEmit`
Expected: the 4 `app/clients/[id]/page.tsx` errors are gone. Pre-existing unrelated errors in `lib/pdf-generator.ts` may remain — leave them (out of scope).

- [ ] **Step 2: Next.js build**

Run: `npm run build`
Expected: build succeeds. If it fails on something outside `/clients`, note it but don't fix it (out of scope).

- [ ] **Step 3: Report**

Print a summary: which files changed, what tests/builds pass, remaining known issues listed as out-of-scope in this plan.
