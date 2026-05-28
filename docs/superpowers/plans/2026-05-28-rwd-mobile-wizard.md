# RWD, Mobile View & Add Client Wizard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement full RWD (mobile layout with bottom nav) and replace the scrollable add-client modal with a 3-step wizard, exactly matching the Claude Design prototype (Variant A).

**Architecture:** `useIsMobile` hook drives a branch in `MainLayout` that renders `MobileTopbar + MobileNav` on `< 768px` and the existing `Sidebar + TopNavbar` on desktop. The `AddClientWizard` replaces `CreateClientModal` in `client-table.tsx` with the same props interface and same Supabase `addClient()` call.

**Tech Stack:** Next.js App Router, Tailwind CSS (project-specific tokens: `bg-surface`, `text-text`, `text-brand`, `border-border`), `react-hook-form`, `zod`, `lucide-react`, Supabase.

---

## File Map

| Action | File |
|---|---|
| **Create** | `hooks/use-is-mobile.ts` |
| **Create** | `components/mobile-topbar.tsx` |
| **Create** | `components/mobile-nav.tsx` |
| **Modify** | `components/main-layout.tsx` |
| **Create** | `components/add-client-wizard.tsx` |
| **Modify** | `components/client-table.tsx` (lines 17, 256–259) |
| **Delete** | `components/create-client-modal.tsx` |

---

## Task 1: `hooks/use-is-mobile.ts`

**Files:**
- Create: `hooks/use-is-mobile.ts`

- [ ] **Step 1: Create the file**

```ts
// hooks/use-is-mobile.ts
import { useState, useEffect } from "react"

// Initializes to false for SSR safety — no hydration mismatch in Next.js.
// After mount, syncs to actual viewport width and tracks resize.
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [breakpoint])

  return isMobile
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors related to `hooks/use-is-mobile.ts`

- [ ] **Step 3: Commit**

```bash
git add hooks/use-is-mobile.ts
git commit -m "feat(rwd): add useIsMobile hook"
```

---

## Task 2: `components/mobile-topbar.tsx`

**Files:**
- Create: `components/mobile-topbar.tsx`

- [ ] **Step 1: Create the file**

```tsx
// components/mobile-topbar.tsx
"use client"

import { Search, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import { usePathname } from "next/navigation"

const PAGE_TITLES: Record<string, string> = {
  "/": "Pulpit",
  "/clients": "Klienci",
  "/calendar": "Terminy",
  "/reports": "Raporty",
  "/settings": "Ustawienia",
}

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  const match = Object.keys(PAGE_TITLES)
    .filter(k => k !== "/" && pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0]
  return match ? PAGE_TITLES[match] : "EasyMove"
}

export function MobileTopbar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const title = getPageTitle(pathname)

  return (
    <header className="h-14 flex-shrink-0 bg-surface border-b border-border flex items-center px-4 gap-3">
      <div
        className="w-[26px] h-[26px] rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-deep))" }}
      >
        E
      </div>
      <span className="flex-1 text-[15px] font-semibold tracking-[-0.01em] truncate text-text">
        {title}
      </span>
      <button
        onClick={() => window.dispatchEvent(new CustomEvent("open-cmdk"))}
        className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-text-dim hover:text-text transition-colors"
        aria-label="Wyszukaj"
      >
        <Search size={16} />
      </button>
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-text-dim hover:text-text transition-colors"
        aria-label="Zmień motyw"
      >
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </header>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/mobile-topbar.tsx
git commit -m "feat(rwd): add MobileTopbar component"
```

---

## Task 3: `components/mobile-nav.tsx`

**Files:**
- Create: `components/mobile-nav.tsx`

- [ ] **Step 1: Create the file**

```tsx
// components/mobile-nav.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, Calendar, FileText, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/",         label: "Pulpit",    icon: LayoutDashboard, exact: true  },
  { href: "/clients",  label: "Klienci",   icon: Users,           exact: false },
  { href: "/calendar", label: "Terminy",   icon: Calendar,        exact: false },
  { href: "/reports",  label: "Dokumenty", icon: FileText,        exact: false },
  { href: "/reports",  label: "Raporty",   icon: BarChart3,       exact: false },
] as const

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 h-[60px] bg-surface border-t border-border flex">
      {NAV_ITEMS.map((item, i) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href)
        const Icon = item.icon
        return (
          <Link
            key={`${item.href}-${i}`}
            href={item.href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-[3px] relative",
              isActive ? "text-brand" : "text-text-mute"
            )}
          >
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-0.5 bg-brand rounded-full" />
            )}
            <Icon size={21} />
            <span className={cn(
              "text-[9.5px] tracking-wide",
              isActive ? "font-semibold" : "font-normal"
            )}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/mobile-nav.tsx
git commit -m "feat(rwd): add MobileNav bottom tab bar"
```

---

## Task 4: Update `components/main-layout.tsx`

**Files:**
- Modify: `components/main-layout.tsx`

- [ ] **Step 1: Replace the entire file content**

```tsx
// components/main-layout.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Sidebar from "@/components/sidebar"
import TopNavbar from "@/components/top-navbar"
import { useSidebar } from "@/components/sidebar-provider"
import { CommandMenu } from "@/components/command-menu"
import { MobileTopbar } from "@/components/mobile-topbar"
import { MobileNav } from "@/components/mobile-nav"
import { useIsMobile } from "@/hooks/use-is-mobile"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebar()
  const [isMounted, setIsMounted] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen">
        <MobileTopbar />
        <main className="flex-1 overflow-y-auto pb-[68px] bg-bg transition-colors duration-300">
          <div className="max-w-[1600px] mx-auto p-4">
            {children}
          </div>
        </main>
        <MobileNav />
        <CommandMenu />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-bg transition-colors duration-300">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
      <CommandMenu />
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Start dev server and test responsive layout**

Run: `npm run dev`

Open `http://localhost:3000` in browser. Resize window below 768px.
Expected:
- `< 768px`: MobileTopbar (56px top bar with "E" logo + search + moon icon) + content + MobileNav (bottom bar with 5 tabs)
- `≥ 768px`: existing Sidebar + TopNavbar layout unchanged

- [ ] **Step 4: Commit**

```bash
git add components/main-layout.tsx
git commit -m "feat(rwd): wire mobile layout into MainLayout"
```

---

## Task 5: `components/add-client-wizard.tsx`

**Files:**
- Create: `components/add-client-wizard.tsx`

This is the largest task. Complete the full file in one write — do not split across commits.

- [ ] **Step 1: Create the file with the complete implementation**

```tsx
// components/add-client-wizard.tsx
"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { ChevronLeft, ArrowRight, Plus, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { addClient } from "@/lib/superbase"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-is-mobile"
import type { ReactNode } from "react"

// ─── Schema ──────────────────────────────────────────────────────────────────

const schema = z.object({
  Name:          z.string().min(2, "Imię i nazwisko musi mieć co najmniej 2 znaki."),
  Email:         z.string().optional(),
  Phone:         z.string().optional(),
  KrajPoch:      z.string().optional(),
  Status:        z.string().min(1, "Status jest wymagany."),
  DataZloWnio:   z.string().optional(),
  Birthday:      z.string().optional(),
  CelPobytu:     z.string().optional(),
  PodLegPob:     z.string().optional(),
  Notes:         z.string().optional(),
  FormWni:       z.boolean().default(false),
  ZalNrJed:      z.boolean().default(false),
  KopiaPasz:     z.boolean().default(false),
  ZalBlue:       z.boolean().default(false),
  CzteZdjecia:   z.boolean().default(false),
  Pelnomocnictwo: z.boolean().default(false),
})

type WizardValues = z.infer<typeof schema>

// ─── Constants ───────────────────────────────────────────────────────────────

const STEP_LABELS = ["Dane kontaktowe", "Szczegóły sprawy", "Notatki i dokumenty"] as const

const CHECKBOXES: { field: keyof Pick<WizardValues, "FormWni" | "ZalNrJed" | "KopiaPasz" | "ZalBlue" | "CzteZdjecia" | "Pelnomocnictwo">; label: string }[] = [
  { field: "FormWni",        label: "Formularz wniosku" },
  { field: "ZalNrJed",       label: "Załącznik nr 1"    },
  { field: "KopiaPasz",      label: "Kopia paszportu"   },
  { field: "ZalBlue",        label: "Niebieska karta"   },
  { field: "CzteZdjecia",    label: "4 zdjęcia"         },
  { field: "Pelnomocnictwo", label: "Pełnomocnictwo"    },
]

const DEFAULT_VALUES: WizardValues = {
  Name: "", Email: "", Phone: "", KrajPoch: "",
  Status: "W trakcie", DataZloWnio: "", Birthday: "",
  CelPobytu: "", PodLegPob: "", Notes: "",
  FormWni: false, ZalNrJed: false, KopiaPasz: false,
  ZalBlue: false, CzteZdjecia: false, Pelnomocnictwo: false,
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface AddClientWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClientCreated?: () => void
}

// ─── Shared style helpers (defined outside component to avoid re-creation) ───

const chevronSvg = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// ─── Component ───────────────────────────────────────────────────────────────

export function AddClientWizard({ open, onOpenChange, onClientCreated }: AddClientWizardProps) {
  const [step, setStep]           = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSmallMobile             = useIsMobile(560)
  const isXSmall                  = useIsMobile(380)
  const { user }                  = useAuth()

  const { register, watch, setValue, handleSubmit, reset, formState: { errors } } = useForm<WizardValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  })

  // ── Close / reset ──────────────────────────────────────────────────────────
  const handleClose = () => {
    reset(DEFAULT_VALUES)
    setStep(0)
    onOpenChange(false)
  }

  // ── Escape key ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (values: WizardValues) => {
    setIsSubmitting(true)
    try {
      await addClient({ ...values, Creator: user?.email ?? "" })
      toast({ title: "Klient dodany", description: `${values.Name} został dodany do systemu.` })
      onClientCreated?.()
      handleClose()
    } catch {
      toast({ title: "Błąd", description: "Nie udało się dodać klienta.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  // ── Shared class helpers ───────────────────────────────────────────────────
  const inputCls = "w-full h-10 px-3 rounded-lg border border-border bg-bg text-text text-[13.5px] outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors"
  const selectCls = cn(inputCls, "cursor-pointer appearance-none")
  const labelCls  = "block text-[11.5px] font-medium text-text-dim mb-[7px] tracking-[0.01em]"
  const grid2     = cn("grid gap-3", isSmallMobile ? "grid-cols-1" : "grid-cols-2")
  const padCls    = isSmallMobile ? "px-5 pt-5 pb-3" : "px-7 pt-6 pb-3"

  const SelectWrap = ({ children }: { children: ReactNode }) => (
    <div className="relative">
      {children}
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-mute">
        {chevronSvg}
      </div>
    </div>
  )

  // ── Step panels ────────────────────────────────────────────────────────────
  const steps = [

    /* Step 1 — Dane kontaktowe */
    <div key={0} className={cn("flex flex-col gap-[15px]", padCls)}>
      <div>
        <label className={labelCls}>Imię i nazwisko <span className="text-danger">*</span></label>
        <input
          {...register("Name")}
          placeholder="Jan Kowalski"
          className={cn(inputCls, "ring-2 ring-brand/20 border-brand")}
          autoFocus
        />
        {errors.Name && (
          <p className="text-[11px] text-danger mt-1">{errors.Name.message}</p>
        )}
      </div>
      <div className={grid2}>
        <div>
          <label className={labelCls}>Email</label>
          <input {...register("Email")} type="email" placeholder="jan@example.com" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Telefon</label>
          <input {...register("Phone")} placeholder="+48 123 456 789" className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Kraj pochodzenia</label>
        <input {...register("KrajPoch")} placeholder="np. Ukraina" className={inputCls} />
      </div>
    </div>,

    /* Step 2 — Szczegóły sprawy */
    <div key={1} className={cn("flex flex-col gap-[15px]", padCls)}>
      <div>
        <label className={labelCls}>Status <span className="text-danger">*</span></label>
        <SelectWrap>
          <select {...register("Status")} className={selectCls}>
            <option value="W trakcie">W trakcie</option>
            <option value="Oczekiwanie">Oczekiwanie</option>
            <option value="Analiza">Analiza</option>
            <option value="Pilne">Pilne</option>
            <option value="Zakończona">Zakończona</option>
          </select>
        </SelectWrap>
      </div>
      <div className={grid2}>
        <div>
          <label className={labelCls}>Data złożenia wniosku <span className="text-danger">*</span></label>
          <input {...register("DataZloWnio")} type="date" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Data urodzenia</label>
          <input {...register("Birthday")} type="date" className={inputCls} />
        </div>
      </div>
      <div className={grid2}>
        <div>
          <label className={labelCls}>Cel pobytu</label>
          <SelectWrap>
            <select {...register("CelPobytu")} className={selectCls}>
              <option value="">Wybierz cel pobytu</option>
              <option value="praca">Praca</option>
              <option value="nauka">Nauka</option>
              <option value="rodzina">Rodzina</option>
              <option value="turystyka">Turystyka</option>
              <option value="inne">Inne</option>
            </select>
          </SelectWrap>
        </div>
        <div>
          <label className={labelCls}>Podstawa legalnego pobytu</label>
          <SelectWrap>
            <select {...register("PodLegPob")} className={selectCls}>
              <option value="">Wybierz podstawę</option>
              <option value="pobyt_czasowy">Pobyt czasowy</option>
              <option value="pobyt_staly">Pobyt stały</option>
              <option value="wiza">Wiza krajowa</option>
              <option value="bezwizowy">Ruch bezwizowy</option>
              <option value="karta">Karta pobytu</option>
            </select>
          </SelectWrap>
        </div>
      </div>
    </div>,

    /* Step 3 — Notatki i dokumenty */
    <div key={2} className={cn("flex flex-col gap-[15px]", padCls)}>
      <div>
        <label className={labelCls}>Notatki</label>
        <textarea
          {...register("Notes")}
          rows={3}
          placeholder="Dodatkowe informacje o kliencie..."
          className={cn(inputCls, "h-auto py-2.5 resize-none leading-[1.55]")}
        />
      </div>
      <div>
        <label className={labelCls}>Dodaj pliki</label>
        <button
          type="button"
          className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border text-text-dim text-[12.5px] hover:border-brand hover:text-brand transition-colors"
        >
          <Plus size={13} /> Dodaj dokument
        </button>
      </div>
      <div>
        <label className={labelCls}>Dokumenty do zgromadzenia</label>
        <div className={cn("grid gap-[9px]", isSmallMobile ? "grid-cols-1" : "grid-cols-2")}>
          {CHECKBOXES.map(({ field, label }) => {
            const checked = watch(field) as boolean
            return (
              <label
                key={field}
                className="flex items-center gap-[9px] cursor-pointer text-[13px] text-text select-none"
              >
                <button
                  type="button"
                  onClick={() => setValue(field, !checked)}
                  className={cn(
                    "w-[17px] h-[17px] rounded-[4px] flex-shrink-0 border-[1.5px] flex items-center justify-center transition-all",
                    checked
                      ? "bg-brand border-brand"
                      : "bg-transparent border-border hover:border-brand"
                  )}
                  aria-checked={checked}
                  role="checkbox"
                >
                  {checked && <Check size={9} strokeWidth={2.5} className="text-white" />}
                </button>
                {label}
              </label>
            )
          })}
        </div>
      </div>
    </div>,
  ]

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
      className={cn(
        "fixed inset-0 z-[300] bg-black/65 backdrop-blur-sm flex",
        isSmallMobile ? "items-end justify-center" : "items-center justify-center p-5"
      )}
    >
      <div className={cn(
        "bg-surface-raised border border-border-strong flex flex-col overflow-hidden w-full",
        "shadow-[0_32px_80px_rgba(0,0,0,0.55)]",
        isSmallMobile
          ? "rounded-t-[18px] max-h-[94svh]"
          : "max-w-[540px] rounded-2xl"
      )}>

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className={cn(
          "border-b border-border flex-shrink-0",
          isSmallMobile ? "px-5 pt-[18px] pb-4" : "px-7 pt-5 pb-4"
        )}>
          {/* Title row */}
          <div className="flex items-start justify-between mb-[18px]">
            <div>
              <h2 className="m-0 text-[17px] font-semibold tracking-[-0.01em] text-text">
                Dodaj nowego klienta
              </h2>
              <p className="m-0 mt-1 text-xs text-text-dim">
                Krok {step + 1} z 3 — {STEP_LABELS[step]}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-7 h-7 rounded-[7px] border border-border flex items-center justify-center text-text-dim hover:text-text transition-colors flex-shrink-0"
              aria-label="Zamknij"
            >
              <X size={14} />
            </button>
          </div>

          {/* Step indicator */}
          <div className="relative">
            {/* Progress track */}
            <div className="absolute top-3 left-[13px] right-[13px] h-0.5 bg-border rounded-full z-0">
              <div
                className="h-full bg-brand rounded-full transition-[width] duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{ width: `${(step / 2) * 100}%` }}
              />
            </div>
            {/* Dots + labels */}
            <div className="flex justify-between relative z-[1]">
              {STEP_LABELS.map((label, i) => (
                <div key={i} className="flex flex-col items-center gap-[7px]">
                  <div className={cn(
                    "w-[26px] h-[26px] rounded-full border-2 flex items-center justify-center",
                    "text-[11px] font-bold font-mono transition-all duration-300",
                    i < step  ? "bg-brand border-brand text-white"            :
                    i === step ? "bg-surface-raised border-brand text-brand"  :
                                 "bg-surface-raised border-border text-text-mute"
                  )}>
                    {i < step
                      ? <Check size={10} strokeWidth={2.5} />
                      : (i + 1)
                    }
                  </div>
                  <span className={cn(
                    // Hidden below 380px — 3 long labels overflow on very small screens
                    "text-[10px] whitespace-nowrap text-center",
                    isXSmall && "hidden",
                    i === step ? "font-semibold text-text" :
                    i < step   ? "text-text"               :
                                 "text-text-mute"
                  )}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Sliding content ───────────────────────────────────────────────── */}
        <div className="overflow-hidden flex-shrink-0">
          <div
            className="flex transition-transform duration-[360ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{ width: "300%", transform: `translateX(-${(step / 3) * 100}%)` }}
          >
            {steps.map((content, i) => (
              <div key={i} style={{ width: "33.333%" }} className="flex-shrink-0">
                {content}
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div className={cn(
          "border-t border-border flex justify-between items-center flex-shrink-0",
          isSmallMobile
            ? "px-5 pt-3.5 pb-[calc(14px+env(safe-area-inset-bottom,0px))]"
            : "px-7 py-4"
        )}>
          {/* Back / Cancel */}
          <button
            type="button"
            onClick={() => step > 0 ? setStep(s => s - 1) : handleClose()}
            className="h-9 px-4 rounded-lg border border-border text-[13px] font-medium text-text hover:bg-surface-hover transition-colors inline-flex items-center gap-1"
          >
            {step === 0
              ? "Anuluj"
              : <><ChevronLeft size={13} /> Wstecz</>
            }
          </button>

          <div className="flex items-center gap-3">
            {/* Pill dots */}
            <div className="flex gap-1 items-center">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-[6px] rounded-full transition-[width,background-color] duration-300",
                    i === step ? "w-[18px] bg-brand" :
                    i < step   ? "w-[6px] bg-brand-hover" :
                                 "w-[6px] bg-border"
                  )}
                />
              ))}
            </div>

            {/* Next / Submit */}
            {step < 2 ? (
              <button
                type="button"
                onClick={() => setStep(s => s + 1)}
                className="h-9 px-4 rounded-btn bg-brand text-white text-[13px] font-medium hover:bg-brand-deep transition-colors inline-flex items-center gap-1.5"
              >
                Dalej <ArrowRight size={13} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="h-9 px-4 rounded-btn bg-brand text-white text-[13px] font-medium hover:bg-brand-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Dodawanie…" : "Dodaj klienta"}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/add-client-wizard.tsx
git commit -m "feat(wizard): add 3-step AddClientWizard component"
```

---

## Task 6: Swap old modal for wizard in `client-table.tsx`

**Files:**
- Modify: `components/client-table.tsx` (lines 17, 256–259)

- [ ] **Step 1: Replace import on line 17**

Find:
```tsx
import { CreateClientModal } from "./create-client-modal"
```

Replace with:
```tsx
import { AddClientWizard } from "./add-client-wizard"
```

- [ ] **Step 2: Replace component usage starting at line 256**

Find:
```tsx
      <CreateClientModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onClientCreated={handleClientCreated}
```

Replace with:
```tsx
      <AddClientWizard
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onClientCreated={handleClientCreated}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add components/client-table.tsx
git commit -m "feat(wizard): replace CreateClientModal with AddClientWizard"
```

---

## Task 7: Delete old modal + final verification

**Files:**
- Delete: `components/create-client-modal.tsx`

- [ ] **Step 1: Delete the old file**

```bash
git rm components/create-client-modal.tsx
```

- [ ] **Step 2: Confirm no remaining references**

```bash
grep -rn "create-client-modal\|CreateClientModal" --include="*.tsx" --include="*.ts" .
```

Expected: no output (zero matches)

- [ ] **Step 3: Verify TypeScript compiles clean**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Run dev server and manually test all 3 areas**

Run: `npm run dev`

**Desktop (≥ 768px):**
- [ ] Sidebar visible, TopNavbar visible
- [ ] Click "Dodaj klienta" → wizard opens as centered 540px modal
- [ ] Step 1: type name, click Dalej
- [ ] Step 2: select status and dates, click Dalej
- [ ] Step 3: check boxes, click "Dodaj klienta"
- [ ] Toast "Klient dodany" appears, modal closes

**Mobile (resize browser < 768px):**
- [ ] Sidebar hidden, MobileTopbar shows with page title
- [ ] Bottom nav shows 5 tabs: Pulpit, Klienci, Terminy, Dokumenty, Raporty
- [ ] Active tab has blue line indicator on top
- [ ] Navigate between tabs — content changes, active tab updates
- [ ] Click search icon → CmdK opens
- [ ] Open wizard → bottom sheet slides up from bottom
- [ ] Wizard fields stack to 1 column
- [ ] Step labels hidden below 380px (visible 380px–559px)
- [ ] Safe area padding at bottom (relevant on real iPhone)

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(rwd): complete RWD, mobile nav and wizard — delete old modal"
```
