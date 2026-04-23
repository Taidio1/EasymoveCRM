# Spec — Redesign UI CRM EasyMove na design Claude Design (Wariant A "Urząd")

**Data:** 2026-04-23
**Źródło designu:** `https://api.anthropic.com/v1/design/h/CFHADJ1t7H44tqFdlH2uMQ` (bundle `system-crm-easy-move`)
**Główny plik designu:** `project/EasyMove CRM Redesign.html` + moduły w `project/src/*.jsx`
**Decyzja wariantu:** Wariant A — "Urząd" (granatowy enterprise); Wariant B odrzucony przez użytkownika w transkrypcie `chats/chat1.md`.

---

## 1. Cel i zakres

Zmienić wygląd całej aplikacji EasyMove CRM na design Wariant A z Claude Design, zachowując 1:1 estetykę, typografię i układ. Wdrożenie odbywa się **etapami** (9 faz) na istniejącym stacku (Next.js 15 + Shadcn/Radix + Tailwind + Supabase), bez wyrzucania istniejących komponentów Shadcn.

**W zakresie:** Pulpit, Klienci (lista + detail), Terminy (kalendarz), Raporty, Dokumenty (nowa strona — reskin generatora), Nowy klient (formularz wieloetapowy), globalne ⌘K, Sidebar, Topbar, Login, Settings.

**Poza zakresem:** Wariant B ("Timeline"), serif display (Fraunces), Tweaks panel (A/B/density), naprawianie brakującego PDF template `wniosek_pobyt_czasowy.pdf`, i18n.

---

## 2. Fundament technologiczny

### 2.1 Stack — co zostaje, co zmieniamy

| Warstwa | Stan obecny | Decyzja |
|---|---|---|
| Framework | Next.js 15 + App Router + React 19 | Zostaje |
| UI primitives | Shadcn UI (w `components/ui/*`) + Radix | Zostaje, retokenizowane w Fazie 0 |
| Styling | Tailwind CSS | Zostaje, rozszerzone o tokeny designu |
| Ikony | `lucide-react` | Zostaje — mapowanie 1:1 z ikonami designu |
| Fonty | Inter | **Wymiana** na IBM Plex Sans + IBM Plex Mono |
| Motywy | `next-themes` (w deps, użycie ograniczone) | Aktywacja `defaultTheme="system"` + `enableSystem` |
| Cmd-palette | `cmdk` (w deps, nieużywane) | Aktywacja w nowym komponencie |
| Backend | Supabase | Zostaje bez zmian |
| Formularze | React Hook Form + Zod | Zostaje |

### 2.2 Mapowanie designu → stack

| Design (jsx) | Implementacja (tsx) |
|---|---|
| `TOKENS[variant][theme]` object | CSS variables w `app/globals.css` w `:root` (light) + `.dark` |
| Inline style `{ background: T.surface }` | Tailwind utility `bg-surface` z klasami mapowanymi na CSS vars |
| `FONTS.A.sans` (IBM Plex Sans) | `next/font/google` → CSS var `--font-sans` |
| `FONTS.A.mono` (IBM Plex Mono) | `next/font/google` → CSS var `--font-mono` |
| `FONTS.A.display` (Fraunces) | **Pominięte** — user zdecydował używać IBM Plex Sans wszędzie |
| `localStorage: crm-tweaks` | **Pominięte** — wariant A na stałe, brak przełącznika wariantu |
| Custom icons (`icons.jsx`) | `lucide-react` (mapowanie poniżej) |
| `cmdk` custom impl | Biblioteka `cmdk` |
| MOCK_CLIENTS / MOCK_APPOINTMENTS / MOCK_ACTIVITIES | Hooki do Supabase z fallbackami |

### 2.3 Mapowanie ikon (design → lucide)

`search → Search`, `bell → Bell`, `sun → Sun`, `moon → Moon`, `plus → Plus`, `chevronR → ChevronRight`, `chevronL → ChevronLeft`, `inbox → Inbox`, `filter → Filter`, `mail → Mail`, `phone → Phone`, `pin → MapPin`, `globe → Globe`, `check2 → Check`, `alert → AlertCircle`, `dots → MoreHorizontal`, `arrowR → ArrowRight`, `dashboard → LayoutDashboard`, `clients → Users`, `calendar → Calendar`, `reports → BarChart3`, `docs → FileText`.

---

## 3. Design tokens

### 3.1 Kolory (CSS variables — Wariant A)

**Surfaces:**

| Token | Light | Dark | Użycie |
|---|---|---|---|
| `--bg` | `#F6F8FC` | `#0A0E1A` | Tło strony, tło tabel |
| `--surface` | `#FFFFFF` | `#0F1524` | Karty, panele, sidebar, topbar |
| `--surface-raised` | `#FFFFFF` | `#141B2E` | Modale, popovery, Cmd+K |
| `--surface-hover` | `#F1F4FA` | `#182038` | Hover rows/items |
| `--border` | `#E3E8F2` | `#1E2943` | Domyślne separatory |
| `--border-strong` | `#CDD5E4` | `#2A3A5C` | Silniejsza separacja |

**Tekst:**

| Token | Light | Dark |
|---|---|---|
| `--text` | `#0B1430` | `#E8ECF5` |
| `--text-dim` | `#5A6787` | `#8892B0` |
| `--text-mute` | `#8892B0` | `#5A6787` |

**Brand (granatowy enterprise):**

| Token | Light | Dark |
|---|---|---|
| `--brand` | `#1E40AF` | `#3B82F6` |
| `--brand-deep` | `#172554` | `#1E40AF` |
| `--brand-soft` | `rgba(30, 64, 175, 0.08)` | `rgba(59, 130, 246, 0.12)` |
| `--brand-hover` | `#1E3A8A` | `#60A5FA` |

**Semantic (pełne + *-soft):**

| Token | Light | Dark |
|---|---|---|
| `--success` / `--success-soft` | `#059669` / `rgba(5,150,105,0.10)` | `#10B981` / `rgba(16,185,129,0.12)` |
| `--warn` / `--warn-soft` | `#D97706` / `rgba(217,119,6,0.10)` | `#F59E0B` / `rgba(245,158,11,0.12)` |
| `--danger` / `--danger-soft` | `#DC2626` / `rgba(220,38,38,0.10)` | `#EF4444` / `rgba(239,68,68,0.12)` |
| `--info` / `--info-soft` | `#0891B2` / `rgba(8,145,178,0.10)` | `#06B6D4` / `rgba(6,182,212,0.12)` |

**Case type (domenowe):**

| Token | Light | Dark | Znaczenie |
|---|---|---|---|
| `--visa` | `#1E40AF` | `#3B82F6` | Wiza krajowa |
| `--pobyt` | `#7C3AED` | `#8B5CF6` | Karta/rejestracja pobytu |
| `--obywatelstwo` | `#D97706` | `#F59E0B` | Obywatelstwo |
| `--praca` | `#059669` | `#10B981` | Zezwolenie na pracę |

### 3.2 Typografia

**Fonty:**
- **IBM Plex Sans** — wagi 400, 500, 600, 700, subset `latin-ext` (polskie znaki) — wszędzie poza mono
- **IBM Plex Mono** — wagi 400, 500, 600 — liczby, ID, daty, skróty klawiszowe, dane tabelaryczne

**Skala rozmiarów (z designu, 1:1):**

| Rozmiar | Użycie |
|---|---|
| `10px` / `10.5px` | Badges, labele UPPERCASE, skróty `⌘K`, mikro-meta |
| `11px` / `11.5px` | Sub-teksty, tabelaryczne wartości, hint |
| `12px` / `12.5px` | Body w UI, wiersze tabeli |
| `13px` | Nav, input |
| `15px` | Sub-tytuły, greeting sub |
| `18px` | Tytuły stron w topbarze |
| `26px` / `28px` | Greeting + wartości KPI (IBM Plex Sans 600/700, **nie serif**) |

**Letter spacing:** `-0.02em` dla dużych nagłówków, `-0.01em` dla średnich, `0.06em` / `0.08em` dla UPPERCASE labeli.

### 3.3 Border radius, spacing, shadows

- **Border radius:** `4px` (badges), `6px` (chips/buttons inside), `7px` (inputs, secondary buttons), `8px` (sidebar items), `10px` (cards, panels), `12px` (modale)
- **Grid gaps:** głównie `8px`, `12px`, `16px`, `20px`, `24px`
- **Padding kart:** `14px 16px` (panel header), `16px` / `24px` (body)
- **Shadows:**
  - Primary button: `0 1px 2px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)`
  - Logo brand square: `0 2px 8px var(--brand-soft)`
  - Modale / popovery: `0 12px 40px rgba(0,0,0,0.3)`

### 3.4 Komponenty bazowe — warianty z designu

**Button:**
- `primary`: `height: 32px`, `padding: 0 12px`, `bg: brand`, `color: #fff`, `radius: 7px`, `font-size: 12.5px`, `font-weight: 600`, `gap: 6px`
- `secondary`: `height: 32px`, `padding: 0 12px`, `bg: transparent`, `color: text`, `border: 1px solid border`, `radius: 7px`, `font-size: 12.5px`, `font-weight: 500`
- `icon`: `32×32px`, `border: 1px solid border`, `color: text-dim`, `radius: 7px`

**Pill (badge w tabeli):**
- `font-size: 10.5px`, `font-weight: 600`, `padding: 2px 7px`, `radius: 4px`, `letter-spacing: 0.02em`
- Soft background: `{color}20` (20% alpha), foreground: pełny kolor

**Input:**
- `height: 36px`, `padding: 0 12px`, `bg: bg`, `border: 1px solid border`, `radius: 7px`, `font-size: 13px`

**Card / Panel:**
- `bg: surface`, `border: 1px solid border`, `radius: 10px`, header padding `14px 16px` z border-bottom

---

## 4. Plan faz implementacji

Każda faza jest samodzielnie mergeable z własnym acceptance criteria. Kolejność ścisła.

### Faza 0 — Fundament design systemu (blocker)

**Pliki:** `app/globals.css`, `tailwind.config.ts`, `app/layout.tsx`, `app/AppProviders.tsx`, `components/ui/{button,input,card,badge}.tsx`

**Co:**
- Wstawić CSS vars z §3.1 do `:root` (light) i `.dark` w `app/globals.css`
- Rozszerzyć `tailwind.config` o mapowanie tokenów + case type colors + custom font sizes
- Dodać IBM Plex Sans + Mono via `next/font/google` w `app/layout.tsx`, podpiąć jako CSS vars `--font-sans`, `--font-mono`
- Usunąć `<meta name="color-scheme" content="light">` z `layout.tsx`
- W `AppProviders.tsx`: `ThemeProvider` z `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`
- Retokenizować bazowe primitives:
  - `Button`: warianty `primary` / `secondary` / `icon` zgodne z §3.4
  - `Input`: wysokość 36px, radius 7px, kolor bg, border
  - `Card`: `bg-surface`, `border border`, `radius 10px`
  - `Badge`: styl Pill (radius 4px, 10.5px, 600, soft bg)

**Acceptance:** `pnpm build` przechodzi, storybook/preview wszystkich primitives renderuje nowe kolory/fonty w light + dark + system.

### Faza 1 — Shell: Sidebar + Topbar

**Pliki:** `components/sidebar.tsx`, `components/top-navbar.tsx`, `components/main-layout.tsx`

**Co:**
- Sidebar (240px lub 60px collapsed):
  - Gradient logo square „E" (28×28px, `linear-gradient(135deg, brand, brand-deep)`) + tytuł `EasyMove` + subtitle `CRM · Legal`
  - Przycisk Szukaj z ikoną + placeholder „Szukaj…" + skrót `⌘K` (open Cmd+K)
  - Nav items: Pulpit / Klienci (badge `247`) / Terminy (badge `4`) / Raporty / Dokumenty
  - Active state: pionowy pasek 2px brand po lewej + tło `brand-soft` + tekst `text`
  - Sekcja „Dzisiaj" (3 pozycje z paskiem koloru typu sprawy) — **placeholder data, wire w Fazie 5**
  - Dół: karta user (gradient avatar `brand → pobyt`, imię, rola, three-dots menu)
  - Collapsible state w localStorage
- Topbar (60px):
  - Breadcrumbs (jeśli drill-down)
  - Tytuł 18px/600 + subtitle 12px/textDim
  - Actions slot
  - Theme toggle (sun/moon)
  - Bell z czerwoną kropką

**Acceptance:** każda strona aplikacji używa nowego shella, nawigacja działa, theme toggle widoczny, ⌘K placeholder (open bez listy w tej fazie).

### Faza 2 — Cmd+K globalna wyszukiwarka

**Pliki:** nowy `components/cmd-k.tsx`, integracja w `AppProviders.tsx`

**Co:**
- `cmdk` provider globalnie; keyboard listener `Ctrl/Cmd+K`, `Escape` close
- Overlay: `surface-raised` z shadow, radius 12px, centered
- Sekcje:
  - **Nawigacja**: Pulpit, Klienci, Terminy, Raporty, Dokumenty, Nowy klient
  - **Klienci**: live search po Supabase (debounced, max 10 wyników) — nazwa, ID, flaga kraju
  - **Akcje**: Dodaj klienta, Nowy termin, Wygeneruj dokument, Toggle theme
- Każdy result: ikona + label + shortcut hint

**Acceptance:** ⌘K otwiera się na każdej stronie, wyszukiwarka klientów z Supabase działa, wybór klienta nawiguje do `app/clients/[id]`.

### Faza 3 — Pulpit (Dashboard)

**Pliki:** `components/dashboard.tsx` (refactor), nowe: `components/dashboard/{stat-card,panel,pipeline,mini-bar-chart,action-required-row,activity-row,today-appointment-row}.tsx`

**Co:**
- **Greeting row**: data (IBM Plex Mono uppercase), `Dzień dobry, {imię}.`, subtitle z licznikami terminów i spraw pilnych (brand + warn accents), po prawej guziki `Inbox` + `Dodaj klienta`
- **KPI strip** (4 kolumny): Aktywni klienci / Sprawy w toku / Terminy 7 dni / Przychód MTD — każda karta ma kolorowy pasek akcentu po lewej (3px), delta chip (success/danger-soft), wartość 28px/700, label UPPERCASE 11px
- **Main grid** (1.4fr : 1fr):
  - Lewa: Panel „Wymagają Twojej uwagi" (5 wierszy z avatarami + kolorowanie wg `dni`) + Panel „Pipeline spraw" (5 etapów, 100px label / 1fr bar / 40px count)
  - Prawa: Panel „Dzisiejsze terminy" + Panel „Nowe sprawy w tygodniu" (mini bar chart) + Panel „Ostatnia aktywność"

**Acceptance:** pulpit renderuje dane z Supabase (klienci/terminy/aktywności), działa w light + dark + system, responsive: < 1280px grid 1:1.

### Faza 4 — Klienci (lista + detail)

**Pliki:** `components/client-table.tsx` (refactor), `app/clients/[id]/page.tsx` (restyle), nowe: `components/clients/{filter-bar,timeline-panel,contact-panel,docs-checklist-panel,finances-panel}.tsx`

**Co:**
- **Lista:**
  - Filter bar: chips (Wszyscy/Pilne/Aktywne/Oczekujące z licznikami), search input (flex 1, max 320px), przycisk `Filtry`, prawostronny przycisk primary `Nowy klient`
  - Tabela: kolumny Klient / ID / Sprawa / Etap / Następny termin / Dokumenty / Doradca / →
  - Wiersz: avatar 30×30 z kolorem typu sprawy (`{type}20` bg + pełny foreground), nazwisko + kraj + flaga, ID mono, sprawa z kolorową kropką, Pill statusu UPPERCASE, termin z kolorowaniem dni (danger ≤ 1, warn ≤ 2), pill dokumentów (success/warn), inicjały doradcy w kółku
  - Stopka: licznik + eksport CSV
- **Detail (`app/clients/[id]`):**
  - Sub-header: back button + gradient avatar 44×44 + nazwisko + flaga + Pill statusu, meta row (ID mono + sprawa + kraj), prawostronne guziki E-mail / Zadzwoń / Nowa akcja
  - Taby: Przegląd / Dokumenty / Historia / Notatki / Finanse (border-bottom 2px brand dla aktywnej)
  - Body grid (1fr : 320px):
    - Lewa: Panel „Timeline sprawy" (data mono 80px + node z kolorem statusu + tytuł + sub), Panel „Notatki" (wpisy w kartach z autorem + czasem)
    - Prawa: Panele „Dane kontaktowe" (ikona + label UPPERCASE + wartość), „Dokumenty" (checklist z ✓/⚠), „Finanse" (wartość/zapłacono/pozostało + progress bar)
- **Dzisiaj inbox w sidebarze**: wire do prawdziwych danych terminów

**Acceptance:** CRUD klientów działa, wyszukiwanie i filtry działają, wszystkie taby detail wyświetlają dane z Supabase.

### Faza 5 — Terminy (Calendar)

**Pliki:** `app/calendar/page.tsx`, `components/calendar/{day-view,week-view,month-view,list-view}.tsx` (restyle)

**Co:**
- **Toolbar**: icon buttons prev/next (28×28), tytuł zakresu 15px/600, guzik `Dzisiaj`, spacer, view switcher (Dzień/Tydzień/Miesiąc, pill-style z aktywnym tłem surface), primary button `Nowy termin`
- **Week view**: grid `60px + 7×1fr`, kolumna godzin 8-17 z mono font, header dni (day of week UPPERCASE + numer 18px/600), „dzisiaj" podświetlone tłem `brand-soft`, eventy pozycjonowane absolutnie (top: `(start-8)*56px + 2`, height: `dur*56 - 4`), kolor wg typu sprawy (`{type}20` bg + `3px solid {type}` border-left), badge `PILNE` jako czerwona kropka w prawym górnym rogu
- **Day view i Month view**: stylowane analogicznie, integracja z istniejącymi plikami

**Acceptance:** wszystkie 3 widoki renderują prawdziwe terminy z Supabase, kolorowanie po typie sprawy działa, „dzisiaj" podświetlone, tworzenie nowego terminu działa.

### Faza 6 — Raporty

**Pliki:** `app/reports/page.tsx`, `components/reports.tsx` (refactor), nowe: `components/reports/{revenue-chart,case-types-chart,advisors-table}.tsx`

**Co:**
- **KPI strip** (4 karty): Konwersja / Średni czas / Zadowolenie / Przychód YTD
- **Grid 2fr:1fr**:
  - Lewa: Panel „Przychód miesięczny" — bar chart 12 miesięcy, wysokość 280px, current month w pełnym `brand`, historyczne w `brand-soft` z `{brand}40` borderem, wartość nad słupkiem w mono, miesiąc pod słupkiem
  - Prawa: Panel „Typy spraw" — lista z progress barami kolorowanymi wg case type colors, label + % wartość
- **Panel „Wydajność doradców"**: tabela z avatarem, aktywne/zakończone (mono), średni czas, ocena jako Pill success, przychód (mono, 600)
- Zachowanie istniejących akcji eksportu PDF/CSV z `lib/pdf-generator.ts` — tylko reskin guzików

**Acceptance:** wszystkie wykresy/tabele renderują dane, eksport PDF/CSV nadal działa.

### Faza 7 — Dokumenty (nowa strona)

**Pliki:** nowy `app/documents/page.tsx`, nowe: `components/documents/{template-gallery,client-selector,document-preview,format-selector,generated-document-view}.tsx`; przeniesienie logiki z `components/form-generator.tsx` i zakładek `components/reports.tsx`

**Co:**
- **Galeria szablonów**: kategorie jako chips (Pobyt / Wiza / Praca / Obywatelstwo / Kancelaria), karty szablonów z ikoną + nazwą + opisem + badge kategorii
- **Client selector**: dropdown/search dla wybranego klienta → auto-uzupełnianie danych
- **Form**: pola z badge `AUTO ●` (success-soft bg, success text) gdy dane pochodzą z klienta, edytowalne normalnie gdy wpisywane ręcznie
- **Live preview** dokumentu po prawej (surface-raised panel)
- **Format selector**: PDF / DOCX / ODT jako pill tabs
- **Przycisk primary** „Wygeneruj dokument" → po submit: ekran generated-document-view z pełnym renderem + akcje Pobierz / Wyślij
- Wire do `lib/pdf-generator.ts` (funkcjonalny) i `lib/pdf-form-filler.ts` (niefunkcjonalny — zostaje jak jest, UX komunikuje ograniczenie dla wniosku o pobyt czasowy)
- Link „Dokumenty" w sidebarze prowadzi do `/documents`

**Acceptance:** generowanie dokumentów urzędowych działa tak jak wcześniej (wyniki identyczne), UI w pełni zgodny z designem, auto-fill działa po wybraniu klienta.

### Faza 8 — Nowy klient (multi-step form)

**Pliki:** nowy `app/clients/new/page.tsx`, refactor `components/create-client-modal.tsx` (zostaje jako quick-add z Cmd+K/sidebara), nowe: `components/clients/new/{stepper,step-personal,step-case,step-documents,step-assignment}.tsx`

**Co:**
- **Header**: back button, tytuł „Nowy klient" 28px/400 (IBM Plex Sans, **nie serif**), subtitle „Dodaj klienta i utwórz pierwszą sprawę"
- **Stepper** (4 kroki): pill-style w karcie surface z border overflow hidden, każdy krok: okrągły numer 22×22 (brand gdy `step >= i`, surface + textMute gdy dalej), label `Krok N` UPPERCASE + nazwa kroku
- **Kroki**:
  1. Dane osobowe: Imię / Nazwisko (required) / E-mail / Telefon / Kraj pochodzenia (select z flagami) / Data urodzenia / Adres zameldowania / Numer paszportu
  2. Sprawa: Typ sprawy (visa/pobyt/praca/obywatelstwo) / Etap początkowy / Wartość / Deadline / Notatka wstępna
  3. Dokumenty: checklist z możliwością uploadu per dokument
  4. Przypisanie: wybór doradcy z listy
- **Nawigacja**: guzik `Anuluj` (secondary, lewo) + guziki `Zapisz jako szkic` / `Dalej` (prawo)
- **Walidacja**: React Hook Form + Zod per krok
- **Submit** (ostatni krok): insert do Supabase + redirect do detail klienta

**Acceptance:** pełny flow tworzenia klienta działa, walidacja blokuje przejście do kolejnego kroku przy błędach, draft przechowywany w localStorage.

### Faza 9 — Polish + pozostałe strony + cleanup

**Pliki:** `app/login/page.tsx`, `app/settings/page.tsx`, `components/settings.tsx`, usunięcie nieużywanych plików

**Co:**
- **Login**: centrowane, logo gradient, surface card z radius 10, inputy designu, primary button, theme toggle w prawym górnym
- **Settings**: sidebar z zakładkami + content panel (surface), reskin sekcji profile / avatar upload / powiadomienia / zespół
- **Wizualny QA**: każda strona w light + dark + system, breakpoints tablet (768px) / mobile (640px) — grid collapse do jednej kolumny
- **Cleanup**: usunąć nieużywane zmienne CSS, nieużywane komponenty, stare style Inter

**Acceptance:** cała aplikacja wizualnie spójna, żadna strona nie używa starych kolorów/fontów, wszystkie motywy działają.

---

## 5. Integracja danych (real vs mock)

Design używa stałych `MOCK_CLIENTS`, `MOCK_APPOINTMENTS`, `MOCK_ACTIVITIES`. W produkcji:
- **Klienci** → `lib/superbase.ts` (istniejące query) — pola `id`, `imie`, `nazwisko`, `kraj`, `flag` (nowa kolumna lub derived z kraju), `sprawa`, `sprawaType` (enum: visa/pobyt/praca/obywatelstwo), `etap`, `etapColor` (derived), `nastepnyTermin`, `nastepnaAkcja`, `dni` (derived), `wartosc`, `dokumenty`, `przypisany`, `ostatnia`
- **Terminy** → Supabase table `appointments` (do zweryfikowania czy istnieje)
- **Aktywności** → Supabase table `activities` (do zweryfikowania)

**Brakujące pola w schemacie bazy** zostaną zidentyfikowane w Fazie 3 (Dashboard) i Fazie 4 (Klienci). Jeśli brakuje — derived w frontendzie z istniejących pól lub placeholder.

**Fallback**: gdy Supabase zwróci pustą listę, render pustego state z guzikiem akcji (np. „Dodaj pierwszego klienta").

---

## 6. Motyw domyślny i przełącznik

- **Domyślny motyw:** `system` (preferencje OS) — zgodnie z decyzją usera
- **Przełącznik:** w topbarze (sun ↔ moon icon button), zapamiętany w localStorage przez `next-themes`
- **Opcje:** `light` / `dark` / `system`
- `disableTransitionOnChange` aktywne, żeby przełączenie było natychmiastowe bez flasha

---

## 7. Ryzyka i rzeczy do obserwowania

1. **Radix default animations** — Select, Dialog, Popover, Tooltip mają fade + slight scale. Design nie specyfikuje animacji — przyjmujemy domyślne Radix.
2. **Focus ring** — Radix dodaje outline dla keyboard nav. Stylujemy na `brand`, 2px solid, offset 2px.
3. **Font sizes z dziesiętnymi (12.5px, 10.5px)** — Tailwind nie ma tych domyślnie. Rozszerzamy `theme.fontSize` w `tailwind.config` lub używamy arbitrary values `text-[12.5px]`.
4. **Shadcn `Button` default hover** — nadpisywane w wariantach `primary`/`secondary`.
5. **Brakujące dane w Supabase** (np. `flag`, `sprawaType` enum, `dni` derived) — może wymagać migracji schemy lub derived fields w frontendzie. Weryfikacja w Fazie 3.
6. **Kalendarz event overlap** — design pokazuje eventy bez overlap. Gdy zajdzie overlap, stosujemy kolejnowanie wg `start` i układ side-by-side (szerokość / n events). Edge case — dopracować w Fazie 5.
7. **Responsive** — design jest desktop-first. Mobile (< 640px) wymaga adaptacji: sidebar jako drawer, tabele jako karty, split-pane collapse.
8. **Istniejący `lib/pdf-form-filler.ts`** — pozostaje niefunkcjonalny. UI w Fazie 7 komunikuje to klarownie dla użytkownika końcowego.

---

## 8. Deliverables na koniec wszystkich faz

- Działająca aplikacja z nową estetyką na stacku Next.js + Shadcn + Tailwind + Supabase
- Zero regresji funkcjonalnych (CRUD klientów, generator PDF, auth, role-based access)
- Dark + light + system mode działające
- ⌘K globalna wyszukiwarka
- Nowa strona Dokumenty z generatorem
- Formularz nowego klienta w wersji multi-step
- Wszystkie strony pokryte designem

---

## 9. Co dalej

Po zatwierdzeniu tego speca przez usera: **invoke writing-plans skill** do utworzenia szczegółowego implementation planu per faza. Faza 0 jako pierwsza do realizacji.
