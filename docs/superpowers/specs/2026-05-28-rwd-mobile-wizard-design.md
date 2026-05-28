# Design Spec: RWD, Mobile View & Add Client Wizard

_Data: 2026-05-28_  
_Źródło designu: Claude Design — "EasyMove CRM Redesign" (Wariant A)_

---

## 1. Kontekst

EasyMove CRM to aplikacja Next.js (App Router) z Tailwind CSS, shadcn/ui i Supabase. Aktualnie nie obsługuje urządzeń mobilnych — sidebar i topbar są zawsze widoczne, a modal dodawania klienta jest scrollowalnym formularzem. Celem jest implementacja pełnego RWD zgodnego 1:1 z prototypem z Claude Design (Wariant A — granatowy, enterprise).

---

## 2. Architektura

### Nowe pliki

| Plik | Opis |
|---|---|
| `components/mobile-topbar.tsx` | Nowy — górny pasek na mobile |
| `components/mobile-nav.tsx` | Nowy — dolna nawigacja na mobile |
| `components/add-client-wizard.tsx` | Nowy — 3-krokowy wizard, zastępuje `create-client-modal.tsx` |
| `hooks/use-is-mobile.ts` | Nowy — hook `window.innerWidth < 768` z event listener |

### Modyfikowane pliki

| Plik | Zmiana |
|---|---|
| `components/main-layout.tsx` | Dodanie mobile branch z hookiem `useIsMobile` |
| `components/create-client-modal.tsx` | **Usunięty** — zastąpiony przez `add-client-wizard.tsx` |
| Wszystkie miejsca z `<CreateClientModal>` | Podmiana na `<AddClientWizard>` |

### Stylowanie

Tailwind CSS z istniejącymi CSS variables (`--primary`, `--background`, `--card`, `--border`, `--foreground`, `--muted-foreground`). Bez inline styles, bez nowych plików CSS.

---

## 3. Breakpoints

| Breakpoint | Wartość | Efekt |
|---|---|---|
| Mobile | `< 768px` (`md:`) | MobileTopbar + MobileNav, Sidebar ukryty |
| Modal 1-col | `< 560px` (`sm:`) | Pola wizarda w 1 kolumnie zamiast 2 |
| Step labels ukryte | `< 380px` (`xs:` lub inline check) | Etykiety kroków w wizardzie ukryte |

---

## 4. RWD — Logika layoutu

### Hook `useIsMobile`

```ts
// hooks/use-is-mobile.ts
// Inicjalizacja false (SSR-safe) — unika hydration mismatch w Next.js
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint)
    check() // synchronizuj po mount
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [breakpoint])
  return isMobile
}
```

### `main-layout.tsx` — dwa branche

```tsx
const isMobile = useIsMobile()

// Mobile branch
if (isMobile) return (
  <div className="flex flex-col h-screen">
    <MobileTopbar title={pageTitle} />
    <main className="flex-1 overflow-y-auto pb-[68px]">
      {children}
    </main>
    <MobileNav />
    <CommandMenu />
  </div>
)

// Desktop branch — istniejący layout bez zmian strukturalnych
return (
  <div className="flex h-screen overflow-hidden bg-background">
    <Sidebar />
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopNavbar />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-[1600px] mx-auto">{children}</div>
      </main>
    </div>
    <CommandMenu />
  </div>
)
```

Tytuł strony (`pageTitle`) pobierany z `usePathname()` → mapa:

```ts
const PAGE_TITLES: Record<string, string> = {
  '/':          'Pulpit',
  '/clients':   'Klienci',
  '/calendar':  'Terminy',
  '/reports':   'Raporty',
  '/settings':  'Ustawienia',
}
// Klient szczegóły (/clients/[id]) → "Klienci" (fallback na prefix match)
const pageTitle = PAGE_TITLES[pathname] ?? PAGE_TITLES[Object.keys(PAGE_TITLES).find(k => pathname.startsWith(k) && k !== '/') ?? '/'] ?? 'EasyMove'
```

---

## 5. MobileTopbar

### Specyfikacja wizualna

- Wysokość: `h-14` (56px)
- Tło: `bg-card`, dolna linia: `border-b border-border`
- Layout: `flex items-center px-4 gap-3`

### Elementy

| Element | Opis |
|---|---|
| Logo | 26×26px, `rounded-md`, gradient `from-primary to-primary/70`, biała litera "E", `text-xs font-bold` |
| Tytuł | `flex-1 text-[15px] font-semibold truncate` — nazwa aktywnej strony |
| Przycisk wyszukiwarki | 36×36px, `rounded-lg border border-border`, ikona `Search 16px`, klik → `open-cmdk` event |
| Przycisk motywu | 36×36px, `rounded-lg border border-border`, ikona `Sun/Moon 16px`, toggle dark/light |

---

## 6. MobileNav

### Specyfikacja wizualna

- Pozycja: `fixed bottom-0 left-0 right-0 z-20`
- Wysokość: `h-[60px]`
- Tło: `bg-card`, górna linia: `border-t border-border`
- Layout: `flex` (5 elementów po `flex-1`)

### Zakładki (w kolejności)

| id | Label | Ikona |
|---|---|---|
| `/` | Pulpit | `LayoutDashboard` |
| `/clients` | Klienci | `Users` |
| `/calendar` | Terminy | `Calendar` |
| `/reports` | Dokumenty | `FileText` (placeholder — brak osobnej trasy `/docs`) |
| `/reports` | Raporty | `BarChart3` |

> **Uwaga:** Zakładki "Dokumenty" i "Raporty" obie wskazują na `/reports` — tak jak w istniejącym `sidebar.tsx` (pole `href` dla Dokumenty to `/reports`). Do zmiany gdy powstanie oddzielna strona `/docs`.

### Stany zakładki

**Aktywna:**
- Kolor: `text-primary`
- Linia wskaźnika: `absolute top-0 left-1/2 -translate-x-1/2 w-7 h-0.5 bg-primary rounded-full`

**Nieaktywna:**
- Kolor: `text-muted-foreground`

### Typografia zakładek
- Ikona: `21px`
- Label: `text-[9.5px]`, aktywna `font-semibold`, nieaktywna `font-normal`
- Layout: `flex flex-col items-center justify-center gap-[3px] relative`

---

## 7. Add Client Wizard

### Struktura modala

```
┌─────────────────────────────────────────┐
│ Header (flex-shrink-0)                  │
│  Tytuł + "Krok X z 3" + [×]            │
│  Step indicator (progress + dots)       │
├─────────────────────────────────────────┤
│ Sliding content (overflow-hidden)       │
│  [Krok1 | Krok2 | Krok3] → translateX  │
├─────────────────────────────────────────┤
│ Footer (flex-shrink-0)                  │
│  [Anuluj/Wstecz]  pill-dots  [Dalej/Dodaj] │
└─────────────────────────────────────────┘
```

### Overlay

- Tło: `fixed inset-0 z-[300] bg-black/65 backdrop-blur-sm`
- Desktop: `flex items-center justify-center p-5`
- Mobile (`< 560px`): `flex items-end justify-center p-0`
- Klik w tło → zamknij

### Kontener modala

| Viewport | Klasy |
|---|---|
| Desktop | `w-full max-w-[540px] rounded-2xl` |
| Mobile | `w-full rounded-t-[18px] max-h-[94svh]` |

- `bg-card border border-border shadow-[0_32px_80px_rgba(0,0,0,0.55)] flex flex-col overflow-hidden`

### Header

- Padding: desktop `px-7 pt-5 pb-4`, mobile `px-5 pt-[18px] pb-4`
- `border-b border-border flex-shrink-0`

**Wiersz tytułu:**
- Tytuł: `text-[17px] font-semibold tracking-tight`
- Podtytuł: `text-xs text-muted-foreground mt-1` — "Krok {step+1} z 3 — {stepLabel}"
- Przycisk ×: `28×28px rounded-[7px] border border-border`

### Step indicator

**Progress track:**
- `absolute top-3 left-[13px] right-[13px] h-0.5 bg-border rounded-full z-0`
- Wypełnienie: `h-full bg-primary rounded-full transition-[width] duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]`
- Szerokość: `${(step / 2) * 100}%`

**Kółka:**
- Rozmiar: `26×26px rounded-full`
- Completed (`i < step`): `bg-primary border-primary` + biały checkmark SVG
- Active (`i === step`): `bg-card border-2 border-primary text-primary`
- Pending (`i > step`): `bg-card border-2 border-border text-muted-foreground`
- Numer/checkmark: `text-[11px] font-bold font-mono`

**Etykiety:**
- `text-[10px]`, active: `font-semibold text-foreground`, inne: `text-muted-foreground`
- Ukryte na `< 380px`

### Sliding content

```tsx
<div className="overflow-hidden flex-shrink-0">
  <div
    className="flex transition-transform duration-[360ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
    style={{ width: '300%', transform: `translateX(-${(step / 3) * 100}%)` }}
  >
    {steps.map((content, i) => (
      <div key={i} style={{ width: '33.333%' }} className="flex-shrink-0">
        {content}
      </div>
    ))}
  </div>
</div>
```

### Pola formularza — Krok 1: Dane kontaktowe

Padding: desktop `px-7 pt-6 pb-3`, mobile `px-5 pt-5 pb-3`

| Pole | Typ | Walidacja |
|---|---|---|
| Imię i nazwisko | `text` | Wymagane, min 2 znaki |
| Email | `email` | Opcjonalne |
| Telefon | `text` | Opcjonalne |
| Kraj pochodzenia | `text` | Opcjonalne |

- Email + Telefon: `grid grid-cols-1 sm:grid-cols-2 gap-3`
- Focus na "Imię": `ring-2 ring-primary/20 border-primary`

### Pola formularza — Krok 2: Szczegóły sprawy

| Pole | Typ | Opcje |
|---|---|---|
| Status | `select` | W trakcie, Oczekiwanie, Analiza, Pilne, Zakończona |
| Data złożenia wniosku | `date` | Wymagana |
| Data urodzenia | `date` | Opcjonalna |
| Cel pobytu | `select` | Praca, Nauka, Rodzina, Turystyka, Inne |
| Podstawa legalnego pobytu | `select` | Pobyt czasowy, Pobyt stały, Wiza krajowa, Ruch bezwizowy, Karta pobytu |

- Daty: `grid grid-cols-1 sm:grid-cols-2 gap-3`
- Selecty: `grid grid-cols-1 sm:grid-cols-2 gap-3`

### Pola formularza — Krok 3: Notatki i dokumenty

| Pole | Typ | Opis |
|---|---|---|
| Notatki | `textarea` | 3 wiersze, resize-none |
| Dodaj dokument | `button` | Dashed border, ikona Plus |
| Checkboxy | `checkbox ×6` | 2 kol desktop / 1 kol mobile |

**Checkboxy (dokładna kolejność):**
1. Formularz wniosku
2. Załącznik nr 1
3. Kopia paszportu
4. Niebieska karta
5. 4 zdjęcia
6. Pełnomocnictwo

### Footer

- Padding: desktop `px-7 py-4`, mobile `px-5 pt-3.5 pb-[calc(14px+env(safe-area-inset-bottom,0px))]`
- `border-t border-border flex justify-between items-center flex-shrink-0`

**Lewy przycisk:**
- Krok 0: "Anuluj" → zamknij
- Krok 1–2: `← Wstecz` → `setStep(s - 1)`

**Pill dots:**
- `flex gap-1 items-center`
- Aktywna: `w-[18px] h-[6px] rounded-full bg-primary`
- Ukończona: `w-[6px] h-[6px] rounded-full bg-primary/60`
- Przyszła: `w-[6px] h-[6px] rounded-full bg-border`
- Animacja: `transition-[width,background] duration-300`

**Prawy przycisk:**
- Krok 0–1: "Dalej →" → `setStep(s + 1)` (primary button)
- Krok 2: "Dodaj klienta" → wywołaj `addClient()` z Supabase → zamknij

### State management

```ts
const [step, setStep] = useState(0)
const [form, setForm] = useState(makeInitial())
// makeInitial() → wszystkie pola puste, checkboxy false

// Reset przy zamknięciu:
const handleClose = () => { setForm(makeInitial()); setStep(0); onClose() }

// Escape key:
useEffect(() => {
  if (!open) return
  const h = (e) => { if (e.key === 'Escape') handleClose() }
  window.addEventListener('keydown', h)
  return () => window.removeEventListener('keydown', h)
}, [open])
```

### Zachowanie submit

1. Walidacja zod — pola wymagane (Imię, Status, Data złożenia)
2. Wywołanie `addClient(form)` — ta sama funkcja Supabase co w starym modalu
3. Toast sukcesu / błędu (istniejący system toastów)
4. `handleClose()` po sukcesie

### Integracja

- `create-client-modal.tsx` → usunięty
- `<AddClientWizard open={open} onOpenChange={setOpen} onClientCreated={cb} />`
- Miejsca użycia do zaktualizowania: `top-navbar.tsx`, `app/clients/page.tsx` (i inne jeśli istnieją)

---

## 8. Co NIE jest w zakresie tego speca

- Wariant B (Timeline) — nie implementujemy
- Skeleton states — już są w projekcie
- Strona Dokumenty (generator) — osobny temat
- Command menu (⌘K) — już istnieje

---

## 9. Mapa plików po implementacji

```
components/
  mobile-topbar.tsx     ← NOWY
  mobile-nav.tsx        ← NOWY
  add-client-wizard.tsx ← NOWY (zastępuje create-client-modal.tsx)
  main-layout.tsx       ← ZMIENIONY
  create-client-modal.tsx ← USUNIĘTY
hooks/
  use-is-mobile.ts      ← NOWY
```
