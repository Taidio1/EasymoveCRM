# Phase 4 — Clients List and Details Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Clients list and details views to match the Claude Design "Wariant A" aesthetic, featuring a new filter bar, detailed table rows, a comprehensive sub-header for details, and specialized panels for timeline, contact, and finances.

**Architecture:** Refactor `components/client-table.tsx` and `app/clients/[id]/page.tsx` into modular components. Create a new `components/clients/` directory for sub-components. Use design tokens for all styling. Ensure sidebar "Dzisiaj" inbox is wired to real data.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 3.4, Shadcn UI, Lucide React, Supabase.

---

## File structure

**Modify:**
- `components/client-table.tsx` — Refactor to use new `FilterBar` and updated table row styling.
- `app/clients/[id]/page.tsx` — Full restyle of the details page using new sub-components.
- `components/sidebar.tsx` — Wire "Dzisiaj" section to real Supabase data.

**Create:**
- `components/clients/filter-bar.tsx` — Status chips with counters and search.
- `components/clients/details-header.tsx` — Detail page sub-header with avatar and actions.
- `components/clients/timeline-panel.tsx` — Visual case timeline.
- `components/clients/contact-panel.tsx` — Contact information panel.
- `components/clients/docs-checklist-panel.tsx` — Document status checklist.
- `components/clients/finances-panel.tsx` — Financial status and progress.
- `components/clients/notes-panel.tsx` — Activity/notes feed for the client.

---

## Task 1: Redesign Client List (Filter Bar & Table)

**Files:**
- Create: `components/clients/filter-bar.tsx`
- Modify: `components/client-table.tsx`

- [ ] **Step 1: Implement FilterBar component**

Include status chips (Wszyscy, Pilne, Aktywne, Oczekujące) with live counters and search input.

```tsx
export function FilterBar({ counts, ...props }: { counts: Record<string, number>, ... }) {
  // ... implement chips and search
}
```

- [ ] **Step 2: Refactor `client-table.tsx` columns and row styling**

Update columns: Client, ID, Case, Stage, Next deadline, Documents, Advisor.
Apply row styling: Avatar with case type color, name + flag, ID mono, status pill UPPERCASE.
**Add dynamic sorting:** Implement sorting logic for the "Data złożenia wniosku" column (and others if possible) with indicator arrows in the header.

- [ ] **Step 3: Implement footer with export**

Add total count and "Export CSV" button at the bottom.

- [ ] **Step 4: Commit**

```bash
git add components/clients/filter-bar.tsx components/client-table.tsx
git commit -m "feat(ui): redesign client list with filter bar and enhanced table rows"
```

---

## Task 2: Redesign Client Details (Header & Tabs)

**Files:**
- Create: `components/clients/details-header.tsx`
- Modify: `app/clients/[id]/page.tsx`

- [ ] **Step 1: Implement DetailsHeader component**

Include back button, gradient avatar, name, flag, status pill, meta row, and actions (Email, Call, New action).

- [ ] **Step 2: Restructure `app/clients/[id]/page.tsx` layout**

Implement the 1fr : 320px grid and tab system (Przegląd, Dokumenty, Historia, Notatki, Finanse).

- [ ] **Step 3: Commit**

```bash
git add components/clients/details-header.tsx app/clients/[id]/page.tsx
git commit -m "feat(ui): redesign client details header and main layout"
```

---

## Task 3: Implement Left Column Panels (Timeline & Notes)

**Files:**
- Create: `components/clients/timeline-panel.tsx`
- Create: `components/clients/notes-panel.tsx`

- [ ] **Step 1: Implement TimelinePanel**

Vertical timeline with 80px mono date, node with status color, title, and sub-text.

- [ ] **Step 2: Implement NotesPanel**

List of notes in cards with author and timestamp.

- [ ] **Step 3: Commit**

```bash
git add components/clients/timeline-panel.tsx components/clients/notes-panel.tsx
git commit -m "feat(ui): implement client timeline and notes panels"
```

---

## Task 4: Implement Right Column Panels (Contact, Docs, Finances)

**Files:**
- Create: `components/clients/contact-panel.tsx`
- Create: `components/clients/docs-checklist-panel.tsx`
- Create: `components/clients/finances-panel.tsx`

- [ ] **Step 1: Implement ContactPanel**

Grid of items with icons, uppercase labels, and values.

- [ ] **Step 2: Implement DocsChecklistPanel**

Checklist of required documents with ✓/⚠ indicators.

- [ ] **Step 3: Implement FinancesPanel**

Show total value, paid amount, remaining balance, and a progress bar.

- [ ] **Step 4: Commit**

```bash
git add components/clients/contact-panel.tsx components/clients/docs-checklist-panel.tsx components/clients/finances-panel.tsx
git commit -m "feat(ui): implement client contact, docs checklist, and finances panels"
```

---

## Task 5: Sidebar Integration and Final Polish

**Files:**
- Modify: `components/sidebar.tsx`
- Modify: `app/clients/[id]/page.tsx`
- Modify: `components/client-table.tsx`

- [ ] **Step 1: Wire Sidebar "Dzisiaj" inbox**

Connect the sidebar tasks to real Supabase data (terminy/deadlines).

- [ ] **Step 2: Final Data Wiring and Refinement**

Ensure all details tabs show live data. Perform a final smoke check and responsive test.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(ui): finalize client redesign and sidebar data integration"
```
