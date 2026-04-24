# Phase 3 — Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Dashboard to match the Claude Design "Wariant A" aesthetic, featuring a new greeting row, KPI strip, and a specialized grid for attention-required items and pipelines.

**Architecture:** Refactor `components/dashboard.tsx` into a modular structure using sub-components in `components/dashboard/`. Implement new UI components for stats, progress bars, and activity feeds using the design tokens. Integrate Supabase data for live counters and lists.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 3.4, Shadcn UI, Lucide React, Supabase.

---

## File structure

**Modify:**
- `components/dashboard.tsx` — Main orchestrator, data fetching, and grid layout.

**Create:**
- `components/dashboard/greeting-row.tsx` — Date, greeting, and global action buttons.
- `components/dashboard/stat-card.tsx` — Individual KPI cards with accent bars.
- `components/dashboard/attention-panel.tsx` — "Wymagają Twojej uwagi" list.
- `components/dashboard/pipeline-panel.tsx` — Visual case pipeline chart.
- `components/dashboard/today-appointments.tsx` — Right-column appointment list.
- `components/dashboard/mini-growth-chart.tsx` — Small bar chart for weekly cases.
- `components/dashboard/activity-feed.tsx` — Recent system activities.

---

## Task 1: Main Structure and Greeting Row

**Files:**
- Create: `components/dashboard/greeting-row.tsx`
- Modify: `components/dashboard.tsx`

- [ ] **Step 1: Implement GreetingRow component**

Include formatted date (IBM Plex Mono), welcome message, and buttons.

```tsx
"use client"

import { Button } from "@/components/ui/button"
import { Inbox, Plus } from "lucide-react"
import { format } from "date-fns"
import { pl } from "date-fns/locale"

export function GreetingRow({ name, stats }: { name: string, stats: { appointments: number, urgent: number } }) {
  const dateStr = format(new Date(), "EEEE, d MMMM yyyy", { locale: pl }).toUpperCase()
  
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        <p className="font-mono text-[11px] font-bold text-text-mute tracking-loosest mb-1">
          {dateStr}
        </p>
        <h1 className="text-[26px] font-bold text-text leading-tight">
          Dzień dobry, {name}.
        </h1>
        <p className="text-[15px] text-text-dim mt-1">
          Masz <span className="text-brand font-semibold">{stats.appointments} terminy</span> oraz <span className="text-warn font-semibold">{stats.urgent} spraw pilnych</span> na dzisiaj.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="default" className="gap-2">
          <Inbox className="size-4" />
          <span>Inbox</span>
        </Button>
        <Button variant="primary" size="default" className="gap-2">
          <Plus className="size-4" />
          <span>Dodaj klienta</span>
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update `dashboard.tsx` with new layout shell**

Remove old heading and replace with a clean grid container (`grid-cols-1 lg:grid-cols-[1.4fr_1fr]`).

- [ ] **Step 3: Commit**

```bash
git add components/dashboard.tsx components/dashboard/greeting-row.tsx
git commit -m "feat(ui): implement dashboard structure and greeting row"
```

---

## Task 2: KPI Strip with StatCards

**Files:**
- Create: `components/dashboard/stat-card.tsx`
- Modify: `components/dashboard.tsx`

- [ ] **Step 1: Create StatCard component**

Implement the card with 3px left accent bar and delta chip.

```tsx
export function StatCard({ label, value, delta, trend, colorClass }: { ... }) {
  return (
    <div className="bg-surface border border-border rounded-card p-4 relative overflow-hidden">
      <div className={cn("absolute left-0 top-0 bottom-0 w-[3px]", colorClass)} />
      <div className="flex justify-between items-start mb-2">
        <span className="text-[11px] font-bold text-text-mute uppercase tracking-semi-loose">{label}</span>
        {delta && (
          <div className={cn("px-1.5 py-0.5 rounded-pill text-[10.5px] font-bold", 
            trend === 'up' ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>
            {trend === 'up' ? '+' : '-'}{delta}
          </div>
        )}
      </div>
      <div className="text-[28px] font-bold text-text leading-none tracking-tight">
        {value}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Integrate KPI Strip into Dashboard**

Add a 4-column grid of `StatCard` components.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/stat-card.tsx components/dashboard.tsx
git commit -m "feat(ui): implement dashboard KPI strip"
```

---

## Task 3: Left Column: Attention Required and Pipeline

**Files:**
- Create: `components/dashboard/attention-panel.tsx`
- Create: `components/dashboard/pipeline-panel.tsx`

- [ ] **Step 1: Implement AttentionPanel**

List of 5 items with avatars and color-coded status.

- [ ] **Step 2: Implement PipelinePanel**

Visual bar chart showing case distribution (5 stages).

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/attention-panel.tsx components/dashboard/pipeline-panel.tsx
git commit -m "feat(ui): implement dashboard attention and pipeline panels"
```

---

## Task 4: Right Column: Appointments, Mini Chart, Activity

**Files:**
- Create: `components/dashboard/today-appointments.tsx`
- Create: `components/dashboard/mini-growth-chart.tsx`
- Create: `components/dashboard/activity-feed.tsx`

- [ ] **Step 1: Implement Right Column components**

Create the smaller panels for the sidebar-like dashboard column.

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/today-appointments.tsx components/dashboard/mini-growth-chart.tsx components/dashboard/activity-feed.tsx
git commit -m "feat(ui): implement dashboard right column components"
```

---

## Task 5: Data Integration and Final Polish

**Files:**
- Modify: `components/dashboard.tsx`

- [ ] **Step 1: Wire real data to components**

Connect `clients` and `quarterlyData` to the new components. Use proper skeleton loading states if possible.

- [ ] **Step 2: Verify Build and Responsiveness**

Run `pnpm build`. Check layout on smaller screens.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard.tsx
git commit -m "feat(ui): finalize dashboard data integration and polish"
```
