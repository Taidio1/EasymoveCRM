# Phase 1 — Shell: Sidebar + Topbar Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the application shell (Sidebar and Topbar) to match the Claude Design "Wariant A" (Urząd/Enterprise) aesthetic, including the brand logo, search bar, navigation items, and theme toggle.

**Architecture:** Update `components/sidebar.tsx`, `components/top-navbar.tsx`, and `components/main-layout.tsx` to implement the new layout and styling. Use the design tokens established in Phase 0. Implement collapsible state logic for the sidebar.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 3.4, Shadcn UI, Lucide React, `next-themes`.

---

## File structure

**Modify:**
- `components/sidebar.tsx` — Full redesign: gradient logo, search button with shortcut, nav items with badges, "Today" section placeholder, user card at the bottom.
- `components/top-navbar.tsx` — Full redesign: breadcrumbs, page title/subtitle, actions slot, theme toggle, notification bell.
- `components/main-layout.tsx` — Adjust layout for new sidebar widths (240px / 60px).

---

## Task 1: Redesign Sidebar Header and Search

**Files:**
- Modify: `components/sidebar.tsx`

- [x] **Step 1: Update Sidebar imports and layout**

Add `Search`, `Plus`, `Bell`, `Inbox` from `lucide-react`. Update the container classes to support 240px/60px width.

- [x] **Step 2: Implement brand logo square**

Create a 28x28px gradient square with the letter "E".

```tsx
<div className="flex items-center gap-3 px-2 py-4">
  <div className="size-7 shrink-0 flex items-center justify-center rounded-chip bg-gradient-to-br from-brand to-brand-deep text-white text-lg font-bold shadow-brand-soft">
    E
  </div>
  {isOpen && (
    <div className="flex flex-col">
      <span className="text-[14px] font-bold leading-none text-text">EasyMove</span>
      <span className="text-[10px] text-text-mute font-medium">CRM · Legal</span>
    </div>
  )}
</div>
```

- [x] **Step 3: Implement Search button with ⌘K hint**

Replace the current search with a button-like search trigger.

```tsx
<div className="px-2 mb-4">
  <button className="flex items-center gap-2 w-full h-8 px-2 rounded-btn border border-border bg-bg hover:bg-surface-hover transition-colors group">
    <Search className="size-3.5 text-text-dim group-hover:text-text" />
    {isOpen && (
      <>
        <span className="text-xs text-text-dim group-hover:text-text flex-1 text-left">Szukaj...</span>
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-surface px-1.5 font-mono text-[10px] font-medium text-text-mute">
          ⌘K
        </kbd>
      </>
    )}
  </button>
</div>
```

- [x] **Step 4: Commit**

```bash
git add components/sidebar.tsx
git commit -m "feat(ui): redesign sidebar header and search trigger"
```

---

## Task 2: Redesign Sidebar Navigation and Sections

**Files:**
- Modify: `components/sidebar.tsx`

- [x] **Step 1: Update navigation items styling**

Map the icons as per spec §2.3. Style active state with `brand-soft` bg and 2px left border.

```tsx
const navItems = [
  { title: "Pulpit", href: "/", icon: LayoutDashboard },
  { title: "Klienci", href: "/clients", icon: Users, badge: "247" },
  { title: "Terminy", href: "/calendar", icon: Calendar, badge: "4" },
  { title: "Raporty", href: "/reports", icon: BarChart3 },
  { title: "Dokumenty", href: "/reports", icon: FileText }, // Placeholder href
]
```

- [x] **Step 2: Implement "Today" section placeholder**

Add a static placeholder section for "Dzisiaj".

- [x] **Step 3: Redesign User Card at the bottom**

Add user avatar (gradient), name, role, and logout menu.

- [x] **Step 4: Commit**

```bash
git add components/sidebar.tsx
git commit -m "feat(ui): redesign sidebar navigation and user card"
```

---

## Task 3: Redesign Topbar

**Files:**
- Modify: `components/top-navbar.tsx`

- [x] **Step 1: Implement Topbar layout (60px height)**

Remove the old search. Implement page title 18px/600 and subtitle 12px.

- [x] **Step 2: Implement Theme Toggle and Notifications**

Use sun/moon icons for theme toggle and a bell with a red dot.

- [x] **Step 3: Commit**

```bash
git add components/top-navbar.tsx
git commit -m "feat(ui): redesign topbar with title, theme toggle and notifications"
```

---

## Task 4: Finalize Shell Layout

**Files:**
- Modify: `components/main-layout.tsx`

- [x] **Step 1: Adjust Main Content padding and transitions**

Ensure the main content area adjusts correctly to sidebar width changes.

- [x] **Step 2: Verify Build and Theme Switching**

Run `pnpm build` and verify that theme switching doesn't cause flashes.

- [x] **Step 3: Commit**

```bash
git add components/main-layout.tsx
git commit -m "feat(ui): finalize shell layout and transitions"
```
