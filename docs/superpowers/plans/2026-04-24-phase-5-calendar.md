# Phase 5 — Calendar Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Calendar (Terminy) view to match the Claude Design "Wariant A" aesthetic, featuring a new toolbar, specialized grid views for week/day/month, and improved event styling with case type colors.

**Architecture:** Refactor `app/calendar/page.tsx` and components in `components/calendar/`. Implement a unified `CalendarToolbar` and restyle individual views. Fix existing TypeScript issues in `app/calendar/page.tsx` related to `eventTypeColors` and `CalendarEventType`. Use design tokens for all styling.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 3.4, Shadcn UI, Lucide React, `date-fns`.

---

## File structure

**Modify:**
- `app/calendar/page.tsx` — Main orchestrator, refactor toolbar into a sub-component, fix types.
- `components/calendar/day-view.tsx` — Restyle to match design.
- `components/calendar/week-view.tsx` — Restyle with time-grid and absolute positioning.
- `components/calendar/month-view.tsx` — Restyle grid and event previews.
- `components/calendar/list-view.tsx` — Restyle list items.

**Create:**
- `components/calendar/toolbar.tsx` — New unified toolbar with navigation and view switcher.

---

## Task 1: Fix Types and Create CalendarToolbar

**Files:**
- Modify: `app/calendar/page.tsx`
- Create: `components/calendar/toolbar.tsx`

- [ ] **Step 1: Fix TypeScript errors in `app/calendar/page.tsx`**

Ensure `CalendarEventType` and `CalendarEvent` are correctly defined and used. Fix the incompatible index signature error in `.next/types` (caused by exported constants that Next.js treats as page config).

- [ ] **Step 2: Implement `CalendarToolbar` component**

Include icon buttons for prev/next (28x28px), range title (15px/600), "Dzisiaj" button, view switcher (pill-style), and "Nowy termin" primary button.

- [ ] **Step 3: Integrate Toolbar into `CalendarPage`**

Replace the old navigation Card with the new `CalendarToolbar`.

- [ ] **Step 4: Commit**

```bash
git add app/calendar/page.tsx components/calendar/toolbar.tsx
git commit -m "feat(ui): fix calendar types and implement new toolbar"
```

---

## Task 2: Redesign Week View

**Files:**
- Modify: `components/calendar/week-view.tsx`

- [ ] **Step 1: Implement Week View Grid**

Layout: 60px left column for hours (8:00 - 17:00 in IBM Plex Mono) + 7 columns for days.
Headers: Day of week UPPERCASE + day number (18px/600). Highlight "Dzisiaj" with `brand-soft`.

- [ ] **Step 2: Implement Absolute Positioning for Events**

Position events based on time: `top: (startHour-8)*56px`, `height: duration*56px`.
Styling: `{type}20` background + `3px solid {type}` left border. Add `PILNE` red dot badge if priority is high.

- [ ] **Step 3: Commit**

```bash
git add components/calendar/week-view.tsx
git commit -m "feat(ui): redesign calendar week view with time grid and absolute events"
```

---

## Task 3: Redesign Day and Month Views

**Files:**
- Modify: `components/calendar/day-view.tsx`
- Modify: `components/calendar/month-view.tsx`

- [ ] **Step 1: Restyle Day View**

Apply the same time-grid logic as Week View but for a single column. Use larger headers.

- [ ] **Step 2: Restyle Month View**

Redesign the 7x5/6 grid. Event previews should be compact pills with case type colors. Highlight today's cell.

- [ ] **Step 3: Commit**

```bash
git add components/calendar/day-view.tsx components/calendar/month-view.tsx
git commit -m "feat(ui): redesign calendar day and month views"
```

---

## Task 4: Redesign List View and Final Integration

**Files:**
- Modify: `components/calendar/list-view.tsx`
- Modify: `app/calendar/page.tsx`

- [ ] **Step 1: Restyle List View**

Use a similar style to the Client List table: compact rows, status pills, and case type icons.

- [ ] **Step 2: Final Verification and Clean up**

Remove old legend and redundant Cards. Run `pnpm build` to verify no regressions.

- [ ] **Step 3: Commit**

```bash
git add components/calendar/list-view.tsx app/calendar/page.tsx
git commit -m "feat(ui): finalize calendar redesign and integrate list view"
```
