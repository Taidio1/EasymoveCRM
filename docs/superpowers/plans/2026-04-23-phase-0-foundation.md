# Phase 0 — Design System Foundation Implementation Plan

> **For agentic workers:** Execute tasks in order. Each task has bite-sized steps with checkboxes (`- [ ]`). Do not proceed to the next task until all steps in the current task pass. Commit at the end of each task.

**Goal:** Establish the design system foundation for the Claude Design "Wariant A" (Urząd/Enterprise) redesign — CSS variables, typography, and retokenized base Shadcn primitives — so all subsequent phases can build on consistent tokens.

**Architecture:** Extend existing Shadcn/Tailwind setup (not replace). Keep Shadcn CSS variable names (`--background`, `--primary`, etc.) but point them at design values. Add new design-specific tokens (`--bg`, `--surface`, `--brand`, case types) alongside. Load IBM Plex Sans + Mono via `next/font/google` and expose as CSS variables. `ThemeProvider` is already configured correctly — verify, don't modify.

**Tech Stack:** Next.js 15, React 18/19, Tailwind CSS 3.4, Shadcn UI, Radix, `next-themes`, `next/font/google`, TypeScript.

**Spec reference:** `docs/superpowers/specs/2026-04-23-ui-redesign-claude-design-design.md` — sections §2 (fundament techniczny), §3 (design tokens), §4 Faza 0 (acceptance criteria).

**Design source bundle (read-only reference):** `C:\Users\kkacp\AppData\Local\Temp\easymove-design\project\src\tokens.jsx` — original `TOKENS.A.light` and `TOKENS.A.dark` objects. All color values in this plan come from there, 1:1.

**Branch:** Work on `uiChange` branch (already checked out). The spec was committed here as `ec33318`.

**Package manager:** Use `pnpm` (per `GEMINI.md`). If `pnpm-lock.yaml` is missing, fall back to `npm`.

---

## What this phase delivers

After Phase 0, the app:
- Uses IBM Plex Sans as the body font everywhere (replacing Inter).
- Uses IBM Plex Mono for numerical/technical text (enabled via CSS var; opt-in per element).
- Exposes all design tokens as CSS variables (surfaces, text, brand, semantic, case types) in `:root` (light) and `.dark` (dark).
- Automatically respects OS theme preference (`system` default).
- Has restyled base primitives (`Button`, `Input`, `Card`, `Badge`) that match the design's sizing/radius/typography.
- Builds without errors (`pnpm build` passes).

What this phase does NOT do: redesign the sidebar, topbar, or any page. Those are Phase 1+.

---

## File structure

**Modify:**
- `app/layout.tsx` — load IBM Plex Sans + Mono via `next/font/google`, wire font CSS vars, remove the hardcoded `<meta name="color-scheme" content="light">`.
- `app/globals.css` — update Shadcn HSL vars to design values; add new design-specific vars; add `--font-sans` / `--font-mono` binding; keep the existing `form-input-override` styles.
- `tailwind.config.ts` — add design-specific color tokens (`bg`, `surface`, `brand.*`, case types, semantic `*.soft`), extended font family, extended font sizes.
- `components/ui/button.tsx` — replace the `buttonVariants` CVA to match design's `primaryBtn` / `secondaryBtn` / `iconBtn` plus keep existing variants as secondary aliases.
- `components/ui/input.tsx` — update default classes (height 36px, radius 7px, bg = `--bg`, font size 13px).
- `components/ui/card.tsx` — update `Card` default classes (bg = `--surface`, border = `--border`, radius 10px, no shadow by default); update `CardHeader` / `CardContent` padding to `14px 16px` / `16px`.
- `components/ui/badge.tsx` — add a `pill` variant matching `VA_Pill` (radius 4px, 10.5px font, 600 weight, 2px 7px padding, soft colored background).

**Do NOT modify (already correct):**
- `app/AppProviders.tsx` — already has `<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>`.
- `components/theme-provider.tsx` — thin wrapper around `next-themes`, no change needed.

**Verify only:**
- `package.json` — confirm `next-themes` and `class-variance-authority` are present (both should be there already).

---

## Task 1: Load IBM Plex Sans + Mono via next/font and wire into layout

**Files:**
- Modify: `app/layout.tsx`

**Current state of `app/layout.tsx` (reference):**

```tsx
import { Inter } from 'next/font/google'
import './globals.css'
import type { Metadata } from 'next'
import { AppProviders } from './AppProviders'

const inter = Inter({ subsets: ['latin-ext'] })

export const metadata: Metadata = {
  title: 'Easy Move CRM',
  description: 'Easy move management system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light" />
      </head>
      <body className={inter.className}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
```

- [x] **Step 1: Replace the font import and metadata block**

Open `app/layout.tsx` and replace its entire contents with:

```tsx
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import type { Metadata } from 'next'
import { AppProviders } from './AppProviders'

const plexSans = IBM_Plex_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Easy Move CRM',
  description: 'Easy move management system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" suppressHydrationWarning className={`${plexSans.variable} ${plexMono.variable}`}>
      <body className="font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
```

Key changes vs. previous version:
- Imports `IBM_Plex_Sans` + `IBM_Plex_Mono` (replacing `Inter`).
- Both fonts expose CSS variables (`--font-sans`, `--font-mono`) via the `variable` option.
- `<html>` tag receives both font variables as classes (so the vars cascade globally).
- `<body>` uses Tailwind's `font-sans` (which will be mapped to `var(--font-sans)` in Task 3).
- `<meta name="color-scheme" content="light">` and its wrapping `<head>` block are removed — Next.js auto-manages the `<head>` element when no children are passed, and `color-scheme` must not be forced to `light` because it would break `next-themes` system detection.

- [x] **Step 2: Verify TypeScript compiles**

Run:
```bash
pnpm exec tsc --noEmit
```
Expected: no errors related to `app/layout.tsx`. (There may be unrelated pre-existing errors from other files — those are not this task's concern.)

- [x] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "chore(ui): swap Inter for IBM Plex Sans/Mono via next/font"
```

---

## Task 2: Update globals.css with design tokens (light theme)

**Files:**
- Modify: `app/globals.css`

The current `globals.css` uses HSL triplet values for Shadcn variables. We will:
1. Update the HSL triplets to match the design's light-theme colors.
2. Add new design-only variables (surfaces, case types, `*-soft`) alongside.
3. Bind `--font-sans` / `--font-mono` to the body via a `body` rule.
4. Keep the existing `form-input-override` styles (they are still referenced elsewhere).

HSL triplet conversion reference (computed from design hex values):

| Design value (hex) | Shadcn var | HSL triplet |
|---|---|---|
| `#F6F8FC` (bg) | `--background` | `220 37% 98%` |
| `#0B1430` (text) | `--foreground` | `225 63% 11%` |
| `#FFFFFF` (surface) | `--card`, `--popover` | `0 0% 100%` |
| `#0B1430` (text on card) | `--card-foreground`, `--popover-foreground` | `225 63% 11%` |
| `#1E40AF` (brand) | `--primary` | `224 70% 40%` |
| `#FFFFFF` (on brand) | `--primary-foreground` | `0 0% 100%` |
| `#F1F4FA` (surface-hover) | `--secondary`, `--muted`, `--accent` | `220 36% 97%` |
| `#0B1430` | `--secondary-foreground`, `--accent-foreground` | `225 63% 11%` |
| `#8892B0` (text-mute) | `--muted-foreground` | `222 17% 62%` |
| `#DC2626` (danger) | `--destructive` | `0 72% 50%` |
| `#FFFFFF` | `--destructive-foreground` | `0 0% 100%` |
| `#E3E8F2` (border) | `--border`, `--input` | `220 31% 92%` |
| `#1E40AF` (brand for ring) | `--ring` | `224 70% 40%` |

- [x] **Step 1: Replace the entire `globals.css` file**

Overwrite `app/globals.css` with the following content. Preserve the `@tailwind` imports at the top and the `form-input-override` block at the bottom; change the `:root` and `.dark` blocks and add the new design tokens.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}

@layer base {
  :root {
    /* Shadcn tokens — mapped to Claude Design "Wariant A" light */
    --background: 220 37% 98%;            /* design --bg  #F6F8FC */
    --foreground: 225 63% 11%;            /* design --text #0B1430 */
    --card: 0 0% 100%;                    /* design --surface #FFFFFF */
    --card-foreground: 225 63% 11%;
    --popover: 0 0% 100%;
    --popover-foreground: 225 63% 11%;
    --primary: 224 70% 40%;               /* design --brand #1E40AF */
    --primary-foreground: 0 0% 100%;
    --secondary: 220 36% 97%;             /* design --surface-hover #F1F4FA */
    --secondary-foreground: 225 63% 11%;
    --muted: 220 36% 97%;
    --muted-foreground: 222 17% 62%;      /* design --text-mute #8892B0 */
    --accent: 220 36% 97%;
    --accent-foreground: 225 63% 11%;
    --destructive: 0 72% 50%;             /* design --danger #DC2626 */
    --destructive-foreground: 0 0% 100%;
    --border: 220 31% 92%;                /* design --border #E3E8F2 */
    --input: 220 31% 92%;
    --ring: 224 70% 40%;                  /* design --brand #1E40AF */
    --radius: 0.5rem;

    /* Chart palette — keep current Shadcn defaults; can be aligned later */
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;

    /* Sidebar tokens (Shadcn) — keep current values; sidebar is redesigned in Phase 1 */
    --sidebar-background: 0 0% 100%;
    --sidebar-foreground: 225 63% 11%;
    --sidebar-primary: 224 70% 40%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 220 36% 97%;
    --sidebar-accent-foreground: 225 63% 11%;
    --sidebar-border: 220 31% 92%;
    --sidebar-ring: 224 70% 40%;

    /* === Design-specific tokens (Wariant A, light) === */
    /* Surfaces */
    --bg: #F6F8FC;
    --surface: #FFFFFF;
    --surface-raised: #FFFFFF;
    --surface-hover: #F1F4FA;
    --border-strong: #CDD5E4;
    /* Text */
    --text: #0B1430;
    --text-dim: #5A6787;
    --text-mute: #8892B0;
    /* Brand */
    --brand: #1E40AF;
    --brand-deep: #172554;
    --brand-soft: rgba(30, 64, 175, 0.08);
    --brand-hover: #1E3A8A;
    /* Semantic */
    --success: #059669;
    --success-soft: rgba(5, 150, 105, 0.10);
    --warn: #D97706;
    --warn-soft: rgba(217, 119, 6, 0.10);
    --danger: #DC2626;
    --danger-soft: rgba(220, 38, 38, 0.10);
    --info: #0891B2;
    --info-soft: rgba(8, 145, 178, 0.10);
    /* Case types */
    --visa: #1E40AF;
    --pobyt: #7C3AED;
    --obywatelstwo: #D97706;
    --praca: #059669;
  }

  .dark {
    /* Shadcn tokens — mapped to Claude Design "Wariant A" dark */
    --background: 223 44% 7%;             /* design --bg  #0A0E1A */
    --foreground: 223 33% 94%;            /* design --text #E8ECF5 */
    --card: 223 42% 10%;                  /* design --surface #0F1524 */
    --card-foreground: 223 33% 94%;
    --popover: 223 38% 13%;               /* design --surface-raised #141B2E */
    --popover-foreground: 223 33% 94%;
    --primary: 217 91% 60%;               /* design --brand #3B82F6 */
    --primary-foreground: 0 0% 100%;
    --secondary: 223 36% 16%;             /* design --surface-hover #182038 */
    --secondary-foreground: 223 33% 94%;
    --muted: 223 36% 16%;
    --muted-foreground: 222 17% 62%;      /* design --text-mute (same) */
    --accent: 223 36% 16%;
    --accent-foreground: 223 33% 94%;
    --destructive: 0 84% 60%;             /* design --danger #EF4444 */
    --destructive-foreground: 0 0% 100%;
    --border: 223 38% 19%;                /* design --border #1E2943 */
    --input: 223 38% 19%;
    --ring: 217 91% 60%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
    --sidebar-background: 223 42% 10%;
    --sidebar-foreground: 223 33% 94%;
    --sidebar-primary: 217 91% 60%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 223 36% 16%;
    --sidebar-accent-foreground: 223 33% 94%;
    --sidebar-border: 223 38% 19%;
    --sidebar-ring: 217 91% 60%;

    /* === Design-specific tokens (Wariant A, dark) === */
    --bg: #0A0E1A;
    --surface: #0F1524;
    --surface-raised: #141B2E;
    --surface-hover: #182038;
    --border-strong: #2A3A5C;
    --text: #E8ECF5;
    --text-dim: #8892B0;
    --text-mute: #5A6787;
    --brand: #3B82F6;
    --brand-deep: #1E40AF;
    --brand-soft: rgba(59, 130, 246, 0.12);
    --brand-hover: #60A5FA;
    --success: #10B981;
    --success-soft: rgba(16, 185, 129, 0.12);
    --warn: #F59E0B;
    --warn-soft: rgba(245, 158, 11, 0.12);
    --danger: #EF4444;
    --danger-soft: rgba(239, 68, 68, 0.12);
    --info: #06B6D4;
    --info-soft: rgba(6, 182, 212, 0.12);
    --visa: #3B82F6;
    --pobyt: #8B5CF6;
    --obywatelstwo: #F59E0B;
    --praca: #10B981;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  html, body {
    font-family: var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
  }
}

/* Nadpisanie stylów dla formularzy - zapewnienie białego tła w motywie jasnym */
@layer components {
  .form-input-override {
    background-color: white !important;
    color: #374151 !important;
  }

  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0px 1000px white inset !important;
    -webkit-text-fill-color: #374151 !important;
    background-color: white !important;
  }
}
```

Notes for the implementer:
- The original `body { font-family: Arial, Helvetica, sans-serif; }` is replaced by the `html, body` rule that pulls from `--font-sans`.
- `font-feature-settings` enables IBM Plex Sans stylistic alternates (`cv02` = single-story `a`, `cv03` = straight-sided `I`, etc.) — this is aesthetic, optional, but matches Claude Design's polish.
- All existing Shadcn tokens are preserved by name; only the color values change. Existing Shadcn components will automatically pick up the new palette.

- [x] **Step 2: Verify the file is syntactically valid**

Run:
```bash
pnpm exec tsc --noEmit
```
Expected: no new errors. (CSS is not typechecked, but this step catches any import regression.)

Then:
```bash
pnpm build
```
Expected: the build completes without CSS parse errors. If there are unrelated TypeScript errors, they are pre-existing and `next.config.mjs` has `ignoreBuildErrors: true` (per `GEMINI.md`).

- [x] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(ui): retokenize globals.css to Claude Design palette (light + dark)"
```

---

## Task 3: Extend tailwind.config.ts with design tokens

**Files:**
- Modify: `tailwind.config.ts`

Goal: expose the new design-specific CSS variables as Tailwind utility classes (`bg-surface`, `text-text-dim`, `border-border-strong`, `bg-visa`, `text-brand`, etc.) plus wire the `font-sans` / `font-mono` utilities to the CSS variables from Task 1.

- [x] **Step 1: Replace `tailwind.config.ts`**

Overwrite the file with the following content (keeps everything existing, adds new entries):

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        // Custom small sizes used by the design
        "2xs": ["10px", { lineHeight: "14px" }],
        "xxs": ["10.5px", { lineHeight: "14px" }],
        "xs-plus": ["11.5px", { lineHeight: "16px" }],
        "sm-plus": ["12.5px", { lineHeight: "17px" }],
      },
      letterSpacing: {
        tightest: "-0.02em",
        "semi-tight": "-0.01em",
        "semi-loose": "0.06em",
        loosest: "0.08em",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Design-specific radii
        "card": "10px",
        "panel": "10px",
        "btn": "7px",
        "pill": "4px",
        "chip": "6px",
      },
      boxShadow: {
        "btn-primary": "0 1px 2px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)",
        "modal": "0 12px 40px rgba(0,0,0,0.3)",
        "brand-soft": "0 2px 8px var(--brand-soft)",
      },
      colors: {
        // Shadcn tokens (unchanged wiring; values redirected via globals.css)
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },

        // === Design-specific tokens (use directly, no hsl() wrapper) ===
        bg: "var(--bg)",
        surface: {
          DEFAULT: "var(--surface)",
          raised: "var(--surface-raised)",
          hover: "var(--surface-hover)",
        },
        "border-strong": "var(--border-strong)",
        text: {
          DEFAULT: "var(--text)",
          dim: "var(--text-dim)",
          mute: "var(--text-mute)",
        },
        brand: {
          DEFAULT: "var(--brand)",
          deep: "var(--brand-deep)",
          soft: "var(--brand-soft)",
          hover: "var(--brand-hover)",
        },
        success: {
          DEFAULT: "var(--success)",
          soft: "var(--success-soft)",
        },
        warn: {
          DEFAULT: "var(--warn)",
          soft: "var(--warn-soft)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          soft: "var(--danger-soft)",
        },
        info: {
          DEFAULT: "var(--info)",
          soft: "var(--info-soft)",
        },
        // Case type colors (domain-specific)
        visa: "var(--visa)",
        pobyt: "var(--pobyt)",
        obywatelstwo: "var(--obywatelstwo)",
        praca: "var(--praca)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
```

- [x] **Step 2: Verify build**

Run:
```bash
pnpm build
```
Expected: the build completes. Watch for any "unknown utility class" errors — those would mean a component is using a class this config doesn't define. If so, note the file; those are not this task's responsibility (fix in later phases where that component gets rewritten).

- [x] **Step 3: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat(ui): extend tailwind config with Claude Design tokens (surfaces, brand, case types, typography)"
```

---

## Task 4: Retokenize Button component

**Files:**
- Modify: `components/ui/button.tsx`

Goal: make `Button`'s default visual match the design's `primaryBtn`; add `secondary` and `icon` size-aware variants matching `secondaryBtn` and `iconBtn`; keep backward-compatible variants (`destructive`, `outline`, `ghost`, `link`) but re-skinned.

Design targets (from spec §3.4):
- Primary: `height: 32px`, `padding: 0 12px`, `bg: var(--brand)`, `color: #fff`, `radius: 7px` (= `rounded-btn`), `font-size: 12.5px` (= `text-sm-plus`), `font-weight: 600`, `gap: 6px`, shadow `shadow-btn-primary`, hover bg `var(--brand-hover)`.
- Secondary: `height: 32px`, `padding: 0 12px`, `bg: transparent`, `color: var(--text)`, `border: 1px solid hsl(var(--border))`, `radius: 7px`, `font-size: 12.5px`, `font-weight: 500`, hover bg `var(--surface-hover)`.
- Icon: `32×32px`, `border: 1px solid hsl(var(--border))`, `color: var(--text-dim)`, `radius: 7px`.

- [x] **Step 1: Replace `components/ui/button.tsx`**

Overwrite with:

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-brand text-white shadow-btn-primary hover:bg-brand-hover font-semibold",
        secondary:
          "bg-transparent text-text border border-border hover:bg-surface-hover",
        icon:
          "bg-transparent text-text-dim border border-border hover:bg-surface-hover hover:text-text",
        destructive:
          "bg-danger text-white hover:bg-danger/90 font-semibold",
        ghost:
          "bg-transparent text-text hover:bg-surface-hover",
        outline:
          "bg-transparent text-text border border-border hover:bg-surface-hover",
        link:
          "bg-transparent text-brand underline-offset-4 hover:underline",
        // Back-compat alias: old usage of `default` maps to primary styling.
        default:
          "bg-brand text-white shadow-btn-primary hover:bg-brand-hover font-semibold",
      },
      size: {
        default: "h-8 px-3 text-sm-plus rounded-btn [&_svg]:size-[13px]",
        sm: "h-7 px-2.5 text-xs rounded-chip [&_svg]:size-3",
        lg: "h-10 px-4 text-sm rounded-btn [&_svg]:size-4",
        icon: "h-8 w-8 rounded-btn [&_svg]:size-[15px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

Notes:
- Default size is now `h-8` (= 32px) matching design. Previous default was `h-10`.
- Default variant is now `primary` (matches design). The old `default` variant is kept as an alias so existing code continues to compile.
- Focus ring uses `ring-brand` (new design token from Task 3).
- SVG icon size is controlled per size variant (`[&_svg]:size-[13px]` etc.) to match design's compact look.

- [x] **Step 2: Verify TypeScript compiles**

```bash
pnpm exec tsc --noEmit
```
Expected: no new errors from `button.tsx`.

- [x] **Step 3: Commit**

```bash
git add components/ui/button.tsx
git commit -m "feat(ui): retokenize Button with primary/secondary/icon variants per Claude Design"
```

---

## Task 2: Update globals.css with design tokens (light theme)

**Files:**
- Modify: `app/globals.css`

The current `globals.css` uses HSL triplet values for Shadcn variables. We will:
1. Update the HSL triplets to match the design's light-theme colors.
2. Add new design-only variables (surfaces, case types, `*-soft`) alongside.
3. Bind `--font-sans` / `--font-mono` to the body via a `body` rule.
4. Keep the existing `form-input-override` styles (they are still referenced elsewhere).

HSL triplet conversion reference (computed from design hex values):

| Design value (hex) | Shadcn var | HSL triplet |
|---|---|---|
| `#F6F8FC` (bg) | `--background` | `220 37% 98%` |
| `#0B1430` (text) | `--foreground` | `225 63% 11%` |
| `#FFFFFF` (surface) | `--card`, `--popover` | `0 0% 100%` |
| `#0B1430` (text on card) | `--card-foreground`, `--popover-foreground` | `225 63% 11%` |
| `#1E40AF` (brand) | `--primary` | `224 70% 40%` |
| `#FFFFFF` (on brand) | `--primary-foreground` | `0 0% 100%` |
| `#F1F4FA` (surface-hover) | `--secondary`, `--muted`, `--accent` | `220 36% 97%` |
| `#0B1430` | `--secondary-foreground`, `--accent-foreground` | `225 63% 11%` |
| `#8892B0` (text-mute) | `--muted-foreground` | `222 17% 62%` |
| `#DC2626` (danger) | `--destructive` | `0 72% 50%` |
| `#FFFFFF` | `--destructive-foreground` | `0 0% 100%` |
| `#E3E8F2` (border) | `--border`, `--input` | `220 31% 92%` |
| `#1E40AF` (brand for ring) | `--ring` | `224 70% 40%` |

- [x] **Step 1: Replace the entire `globals.css` file**

Overwrite `app/globals.css` with the following content. Preserve the `@tailwind` imports at the top and the `form-input-override` block at the bottom; change the `:root` and `.dark` blocks and add the new design tokens.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}

@layer base {
  :root {
    /* Shadcn tokens — mapped to Claude Design "Wariant A" light */
    --background: 220 37% 98%;            /* design --bg  #F6F8FC */
    --foreground: 225 63% 11%;            /* design --text #0B1430 */
    --card: 0 0% 100%;                    /* design --surface #FFFFFF */
    --card-foreground: 225 63% 11%;
    --popover: 0 0% 100%;
    --popover-foreground: 225 63% 11%;
    --primary: 224 70% 40%;               /* design --brand #1E40AF */
    --primary-foreground: 0 0% 100%;
    --secondary: 220 36% 97%;             /* design --surface-hover #F1F4FA */
    --secondary-foreground: 225 63% 11%;
    --muted: 220 36% 97%;
    --muted-foreground: 222 17% 62%;      /* design --text-mute #8892B0 */
    --accent: 220 36% 97%;
    --accent-foreground: 225 63% 11%;
    --destructive: 0 72% 50%;             /* design --danger #DC2626 */
    --destructive-foreground: 0 0% 100%;
    --border: 220 31% 92%;                /* design --border #E3E8F2 */
    --input: 220 31% 92%;
    --ring: 224 70% 40%;                  /* design --brand #1E40AF */
    --radius: 0.5rem;

    /* Chart palette — keep current Shadcn defaults; can be aligned later */
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;

    /* Sidebar tokens (Shadcn) — keep current values; sidebar is redesigned in Phase 1 */
    --sidebar-background: 0 0% 100%;
    --sidebar-foreground: 225 63% 11%;
    --sidebar-primary: 224 70% 40%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 220 36% 97%;
    --sidebar-accent-foreground: 225 63% 11%;
    --sidebar-border: 220 31% 92%;
    --sidebar-ring: 224 70% 40%;

    /* === Design-specific tokens (Wariant A, light) === */
    /* Surfaces */
    --bg: #F6F8FC;
    --surface: #FFFFFF;
    --surface-raised: #FFFFFF;
    --surface-hover: #F1F4FA;
    --border-strong: #CDD5E4;
    /* Text */
    --text: #0B1430;
    --text-dim: #5A6787;
    --text-mute: #8892B0;
    /* Brand */
    --brand: #1E40AF;
    --brand-deep: #172554;
    --brand-soft: rgba(30, 64, 175, 0.08);
    --brand-hover: #1E3A8A;
    /* Semantic */
    --success: #059669;
    --success-soft: rgba(5, 150, 105, 0.10);
    --warn: #D97706;
    --warn-soft: rgba(217, 119, 6, 0.10);
    --danger: #DC2626;
    --danger-soft: rgba(220, 38, 38, 0.10);
    --info: #0891B2;
    --info-soft: rgba(8, 145, 178, 0.10);
    /* Case types */
    --visa: #1E40AF;
    --pobyt: #7C3AED;
    --obywatelstwo: #D97706;
    --praca: #059669;
  }

  .dark {
    /* Shadcn tokens — mapped to Claude Design "Wariant A" dark */
    --background: 223 44% 7%;             /* design --bg  #0A0E1A */
    --foreground: 223 33% 94%;            /* design --text #E8ECF5 */
    --card: 223 42% 10%;                  /* design --surface #0F1524 */
    --card-foreground: 223 33% 94%;
    --popover: 223 38% 13%;               /* design --surface-raised #141B2E */
    --popover-foreground: 223 33% 94%;
    --primary: 217 91% 60%;               /* design --brand #3B82F6 */
    --primary-foreground: 0 0% 100%;
    --secondary: 223 36% 16%;             /* design --surface-hover #182038 */
    --secondary-foreground: 223 33% 94%;
    --muted: 223 36% 16%;
    --muted-foreground: 222 17% 62%;      /* design --text-mute (same) */
    --accent: 223 36% 16%;
    --accent-foreground: 223 33% 94%;
    --destructive: 0 84% 60%;             /* design --danger #EF4444 */
    --destructive-foreground: 0 0% 100%;
    --border: 223 38% 19%;                /* design --border #1E2943 */
    --input: 223 38% 19%;
    --ring: 217 91% 60%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
    --sidebar-background: 223 42% 10%;
    --sidebar-foreground: 223 33% 94%;
    --sidebar-primary: 217 91% 60%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 223 36% 16%;
    --sidebar-accent-foreground: 223 33% 94%;
    --sidebar-border: 223 38% 19%;
    --sidebar-ring: 217 91% 60%;

    /* === Design-specific tokens (Wariant A, dark) === */
    --bg: #0A0E1A;
    --surface: #0F1524;
    --surface-raised: #141B2E;
    --surface-hover: #182038;
    --border-strong: #2A3A5C;
    --text: #E8ECF5;
    --text-dim: #8892B0;
    --text-mute: #5A6787;
    --brand: #3B82F6;
    --brand-deep: #1E40AF;
    --brand-soft: rgba(59, 130, 246, 0.12);
    --brand-hover: #60A5FA;
    --success: #10B981;
    --success-soft: rgba(16, 185, 129, 0.12);
    --warn: #F59E0B;
    --warn-soft: rgba(245, 158, 11, 0.12);
    --danger: #EF4444;
    --danger-soft: rgba(239, 68, 68, 0.12);
    --info: #06B6D4;
    --info-soft: rgba(6, 182, 212, 0.12);
    --visa: #3B82F6;
    --pobyt: #8B5CF6;
    --obywatelstwo: #F59E0B;
    --praca: #10B981;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  html, body {
    font-family: var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
  }
}

/* Nadpisanie stylów dla formularzy - zapewnienie białego tła w motywie jasnym */
@layer components {
  .form-input-override {
    background-color: white !important;
    color: #374151 !important;
  }

  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0px 1000px white inset !important;
    -webkit-text-fill-color: #374151 !important;
    background-color: white !important;
  }
}
```

Notes for the implementer:
- The original `body { font-family: Arial, Helvetica, sans-serif; }` is replaced by the `html, body` rule that pulls from `--font-sans`.
- `font-feature-settings` enables IBM Plex Sans stylistic alternates (`cv02` = single-story `a`, `cv03` = straight-sided `I`, etc.) — this is aesthetic, optional, but matches Claude Design's polish.
- All existing Shadcn tokens are preserved by name; only the color values change. Existing Shadcn components will automatically pick up the new palette.

- [x] **Step 2: Verify the file is syntactically valid**

Run:
```bash
pnpm exec tsc --noEmit
```
Expected: no new errors. (CSS is not typechecked, but this step catches any import regression.)

Then:
```bash
pnpm build
```
Expected: the build completes without CSS parse errors. If there are unrelated TypeScript errors, they are pre-existing and `next.config.mjs` has `ignoreBuildErrors: true` (per `GEMINI.md`).

- [x] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(ui): retokenize globals.css to Claude Design palette (light + dark)"
```

---

## Task 3: Extend tailwind.config.ts with design tokens

**Files:**
- Modify: `tailwind.config.ts`

Goal: expose the new design-specific CSS variables as Tailwind utility classes (`bg-surface`, `text-text-dim`, `border-border-strong`, `bg-visa`, `text-brand`, etc.) plus wire the `font-sans` / `font-mono` utilities to the CSS variables from Task 1.

- [x] **Step 1: Replace `tailwind.config.ts`**

Overwrite the file with the following content (keeps everything existing, adds new entries):

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        // Custom small sizes used by the design
        "2xs": ["10px", { lineHeight: "14px" }],
        "xxs": ["10.5px", { lineHeight: "14px" }],
        "xs-plus": ["11.5px", { lineHeight: "16px" }],
        "sm-plus": ["12.5px", { lineHeight: "17px" }],
      },
      letterSpacing: {
        tightest: "-0.02em",
        "semi-tight": "-0.01em",
        "semi-loose": "0.06em",
        loosest: "0.08em",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Design-specific radii
        "card": "10px",
        "panel": "10px",
        "btn": "7px",
        "pill": "4px",
        "chip": "6px",
      },
      boxShadow: {
        "btn-primary": "0 1px 2px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)",
        "modal": "0 12px 40px rgba(0,0,0,0.3)",
        "brand-soft": "0 2px 8px var(--brand-soft)",
      },
      colors: {
        // Shadcn tokens (unchanged wiring; values redirected via globals.css)
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },

        // === Design-specific tokens (use directly, no hsl() wrapper) ===
        bg: "var(--bg)",
        surface: {
          DEFAULT: "var(--surface)",
          raised: "var(--surface-raised)",
          hover: "var(--surface-hover)",
        },
        "border-strong": "var(--border-strong)",
        text: {
          DEFAULT: "var(--text)",
          dim: "var(--text-dim)",
          mute: "var(--text-mute)",
        },
        brand: {
          DEFAULT: "var(--brand)",
          deep: "var(--brand-deep)",
          soft: "var(--brand-soft)",
          hover: "var(--brand-hover)",
        },
        success: {
          DEFAULT: "var(--success)",
          soft: "var(--success-soft)",
        },
        warn: {
          DEFAULT: "var(--warn)",
          soft: "var(--warn-soft)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          soft: "var(--danger-soft)",
        },
        info: {
          DEFAULT: "var(--info)",
          soft: "var(--info-soft)",
        },
        // Case type colors (domain-specific)
        visa: "var(--visa)",
        pobyt: "var(--pobyt)",
        obywatelstwo: "var(--obywatelstwo)",
        praca: "var(--praca)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
```

- [x] **Step 2: Verify build**

Run:
```bash
pnpm build
```
Expected: the build completes. Watch for any "unknown utility class" errors — those would mean a component is using a class this config doesn't define. If so, note the file; those are not this task's responsibility (fix in later phases where that component gets rewritten).

- [x] **Step 3: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat(ui): extend tailwind config with Claude Design tokens (surfaces, brand, case types, typography)"
```

---

## Task 4: Retokenize Button component

**Files:**
- Modify: `components/ui/button.tsx`

Goal: make `Button`'s default visual match the design's `primaryBtn`; add `secondary` and `icon` size-aware variants matching `secondaryBtn` and `iconBtn`; keep backward-compatible variants (`destructive`, `outline`, `ghost`, `link`) but re-skinned.

Design targets (from spec §3.4):
- Primary: `height: 32px`, `padding: 0 12px`, `bg: var(--brand)`, `color: #fff`, `radius: 7px` (= `rounded-btn`), `font-size: 12.5px` (= `text-sm-plus`), `font-weight: 600`, `gap: 6px`, shadow `shadow-btn-primary`, hover bg `var(--brand-hover)`.
- Secondary: `height: 32px`, `padding: 0 12px`, `bg: transparent`, `color: var(--text)`, `border: 1px solid hsl(var(--border))`, `radius: 7px`, `font-size: 12.5px`, `font-weight: 500`, hover bg `var(--surface-hover)`.
- Icon: `32×32px`, `border: 1px solid hsl(var(--border))`, `color: var(--text-dim)`, `radius: 7px`.

- [x] **Step 1: Replace `components/ui/button.tsx`**

Overwrite with:

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-brand text-white shadow-btn-primary hover:bg-brand-hover font-semibold",
        secondary:
          "bg-transparent text-text border border-border hover:bg-surface-hover",
        icon:
          "bg-transparent text-text-dim border border-border hover:bg-surface-hover hover:text-text",
        destructive:
          "bg-danger text-white hover:bg-danger/90 font-semibold",
        ghost:
          "bg-transparent text-text hover:bg-surface-hover",
        outline:
          "bg-transparent text-text border border-border hover:bg-surface-hover",
        link:
          "bg-transparent text-brand underline-offset-4 hover:underline",
        // Back-compat alias: old usage of `default` maps to primary styling.
        default:
          "bg-brand text-white shadow-btn-primary hover:bg-brand-hover font-semibold",
      },
      size: {
        default: "h-8 px-3 text-sm-plus rounded-btn [&_svg]:size-[13px]",
        sm: "h-7 px-2.5 text-xs rounded-chip [&_svg]:size-3",
        lg: "h-10 px-4 text-sm rounded-btn [&_svg]:size-4",
        icon: "h-8 w-8 rounded-btn [&_svg]:size-[15px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

Notes:
- Default size is now `h-8` (= 32px) matching design. Previous default was `h-10`.
- Default variant is now `primary` (matches design). The old `default` variant is kept as an alias so existing code continues to compile.
- Focus ring uses `ring-brand` (new design token from Task 3).
- SVG icon size is controlled per size variant (`[&_svg]:size-[13px]` etc.) to match design's compact look.

- [x] **Step 2: Verify TypeScript compiles**

```bash
pnpm exec tsc --noEmit
```
Expected: no new errors from `button.tsx`.

- [x] **Step 3: Commit**

```bash
git add components/ui/button.tsx
git commit -m "feat(ui): retokenize Button with primary/secondary/icon variants per Claude Design"
```

---

## Task 5: Retokenize Input component

**Files:**
- Modify: `components/ui/input.tsx`

Design target (from spec §3.4):
- `height: 36px`, `padding: 0 12px`, `bg: var(--bg)`, `border: 1px solid hsl(var(--border))`, `radius: 7px` (= `rounded-btn`), `font-size: 13px` (= `text-[13px]`), focus ring on `--brand`.

- [x] **Step 1: Replace `components/ui/input.tsx`**

Overwrite with:

```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-btn border border-border bg-bg px-3 text-[13px] text-text placeholder:text-text-mute",
          "outline-none transition-colors",
          "focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
```

Notes:
- `h-9` = 36px (Tailwind default scale — matches design).
- `bg-bg` uses the new design-specific `--bg` token.
- Focus shows a 2px ring in brand color at 30% opacity + border switches to solid brand.

- [x] **Step 2: Verify TypeScript compiles**

```bash
pnpm exec tsc --noEmit
```
Expected: no new errors.

- [x] **Step 3: Commit**

```bash
git add components/ui/input.tsx
git commit -m "feat(ui): retokenize Input per Claude Design (36px height, radius 7, brand focus)"
```

---

## Task 6: Retokenize Card component

**Files:**
- Modify: `components/ui/card.tsx`

Design target (from spec §3.4):
- Card: `bg: var(--surface)`, `border: 1px solid hsl(var(--border))`, `radius: 10px` (= `rounded-card`), no default shadow.
- CardHeader: `padding: 14px 16px`, `border-bottom: 1px solid hsl(var(--border))`.
- CardContent: `padding: 16px`.
- CardTitle: `font-size: 13px`, `font-weight: 600`, `letter-spacing: -0.005em`.
- CardDescription: `font-size: 11px`, `color: var(--text-mute)`, `margin-top: 2px`.
- CardFooter: `padding: 10px 16px`, `border-top: 1px solid hsl(var(--border))`.

- [x] **Step 1: Replace `components/ui/card.tsx`**

Overwrite with:

```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-card border border-border bg-surface text-foreground overflow-hidden",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-between px-4 py-3.5 border-b border-border",
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-[13px] font-semibold text-text leading-tight tracking-[-0.005em]",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-[11px] text-text-mute mt-0.5", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-between px-4 py-2.5 border-t border-border",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

Notes:
- `px-4 py-3.5` = 16px horizontal, 14px vertical (matches design's `14px 16px`).
- `rounded-card` = 10px from Tailwind config.
- `overflow-hidden` on the card ensures rounded corners clip inner content (needed for tables, charts).

- [x] **Step 2: Verify TypeScript compiles**

```bash
pnpm exec tsc --noEmit
```
Expected: no new errors from `card.tsx`. Other files that used `Card` with e.g. `<CardHeader className="p-6 ...">` will continue to compile — the class just overrides padding.

- [x] **Step 3: Commit**

```bash
git add components/ui/card.tsx
git commit -m "feat(ui): retokenize Card per Claude Design (surface bg, radius 10, 14x16 header)"
```
---

## Task 7: Retokenize Badge component

**Files:**
- Modify: `components/ui/badge.tsx`

Design target (from spec §3.4, VA_Pill):
- `font-size: 10.5px` (= `text-xxs`), `font-weight: 600`, `padding: 2px 7px`, `radius: 4px` (= `rounded-pill`), `letter-spacing: 0.02em`.
- Soft background: color at ~20% alpha for `color` on `bg`. We use the `*-soft` design tokens directly.

- [x] **Step 1: Replace `components/ui/badge.tsx`**

Overwrite with:

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-pill px-[7px] py-[2px] text-xxs font-semibold tracking-[0.02em] transition-colors",
  {
    variants: {
      variant: {
        // Pill = design's VA_Pill with color-soft background + colored text.
        success: "bg-success-soft text-success",
        warn: "bg-warn-soft text-warn",
        danger: "bg-danger-soft text-danger",
        info: "bg-info-soft text-info",
        brand: "bg-brand-soft text-brand",
        // Case types
        visa: "bg-visa/10 text-visa",
        pobyt: "bg-pobyt/10 text-pobyt",
        obywatelstwo: "bg-obywatelstwo/10 text-obywatelstwo",
        praca: "bg-praca/10 text-praca",
        // Shadcn back-compat
        default:
          "bg-brand-soft text-brand",
        secondary:
          "bg-surface-hover text-text-dim",
        destructive:
          "bg-danger-soft text-danger",
        outline:
          "border border-border text-text-dim",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
```

Notes:
- `rounded-pill` = 4px (from Tailwind config).
- `text-xxs` = 10.5px (from Tailwind config).
- Case types use Tailwind's color-with-alpha shorthand (`bg-visa/10` = `--visa` at 10% alpha).
- Back-compat: `default`, `secondary`, `destructive`, `outline` kept so existing usages don't break.

- [x] **Step 2: Verify TypeScript compiles**

```bash
pnpm exec tsc --noEmit
```
Expected: no new errors.

- [x] **Step 3: Commit**

```bash
git add components/ui/badge.tsx
git commit -m "feat(ui): retokenize Badge as pill-style (radius 4, 10.5px, case type variants)"
```

---

## Task 8: Full build verification

**Files:**
- None — this task only runs verification commands.

- [x] **Step 1: Run the full production build**

```bash
pnpm build
```

Expected:
- Build completes without errors. (`next.config.mjs` has `ignoreBuildErrors: true`, so TS errors from unrelated files are suppressed; the build should still finish.)
- No "unknown utility class" or "CSS parse error" from Tailwind.

If the build fails with a new error introduced by Phase 0 work, fix it before moving on. Common issues:
- Typo in a class name in `tailwind.config.ts` → rebuild.
- Missing subset in `next/font` → verify `'latin', 'latin-ext'` are listed in `app/layout.tsx`.

- [x] **Step 2: Start the dev server and smoke-check**

```bash
pnpm dev
```

Open `http://localhost:3000` in a browser and verify:
1. The font is IBM Plex Sans (not Arial, not Inter). Inspect the `body` element in DevTools — computed `font-family` should include `IBM Plex Sans`.
2. At the `:root` element, check that the following CSS variables are defined (DevTools → Computed → Filter "--"): `--bg`, `--surface`, `--brand`, `--text-dim`, `--visa`, `--pobyt`, `--praca`, `--obywatelstwo`, `--success-soft`, `--font-sans`, `--font-mono`.
3. Toggle the OS theme (macOS: System Settings → Appearance; Windows: Settings → Personalization → Colors). The `<html>` element should gain/lose the `.dark` class automatically (via `next-themes` system detection). The body background should switch between `#F6F8FC` (light) and `#0A0E1A` (dark).

If any of these fail, identify which Task introduced the regression and fix it there.

- [x] **Step 3: Stop the dev server**

Press `Ctrl+C` in the terminal running `pnpm dev`.

---

## Task 9: Final verification commit (CLAUDE.md / GEMINI.md update)

**Files:**
- Modify (optional): `GEMINI.md`

If `GEMINI.md` mentions the old Inter font or old color palette, update the relevant section to reflect the new design system. Otherwise skip this task.

- [x] **Step 1: Scan GEMINI.md for stale references**

Read `GEMINI.md`. If it mentions `Inter`, `color-scheme: light`, or similar outdated styling claims, update those mentions to reference the new design system (IBM Plex Sans, `system` theme default, design tokens per `docs/superpowers/specs/2026-04-23-ui-redesign-claude-design-design.md`).

- [x] **Step 2: Commit only if changes were made**

If `GEMINI.md` was changed:
```bash
git add GEMINI.md
git commit -m "docs: note design system foundation in project overview"
```

If not, skip this step.

---

## Done — what's next

At this point Phase 0 is complete. The app:
- Loads IBM Plex Sans + Mono.
- Has all design tokens as CSS variables (light + dark).
- Has retokenized `Button`, `Input`, `Card`, `Badge`.
- Respects OS theme preference automatically.

**Existing pages (Dashboard, Clients, Calendar, etc.) will already look noticeably different** because they use `Card`, `Button`, `Input`, `Badge` which now adopt the new palette. This is expected — it's the first "before/after" moment.

**Do not attempt Phase 1+** without a dedicated plan. Each subsequent phase (Shell, Cmd+K, Dashboard, Clients, Calendar, Reports, Documents, Add form, Polish) will receive its own implementation plan. Request the next plan once this one is merged/reviewed.
