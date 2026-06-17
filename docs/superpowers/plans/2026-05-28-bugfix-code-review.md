# Bug Fix — Code Review Findings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Naprawić 10 błędów znalezionych podczas code review — obejmują ciche niepowodzenia, błędy danych, pęknięcia UI na mobile i wycieki pamięci.

**Architecture:** Poprawki są niezależne od siebie, pogrupowane według pliku/obszaru. Brak nowych abstrakcji — wyłącznie celowe zmiany w miejscach błędów. Kolejność: najpierw krytyczne (dane), potem UI, potem cleanup.

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, Supabase, react-hook-form + Zod, Tailwind CSS

---

## Mapa plików

| Plik | Zadanie |
|---|---|
| `lib/superbase.ts` | Task 1 — rzucanie wyjątkiem zamiast zwracania null; Task 6 — usunięcie console.log |
| `components/add-client-wizard.tsx` | Task 2 — fix timezone daty; Task 3 — walidacja kroku + stale closure + scroll |
| `app/calendar/page.tsx` | Task 4 — fix niedzielnego tygodnia |
| `components/mobile-nav.tsx` | Task 5 — fix duplikatów href |
| `components/auth-guard.tsx` | Task 6 — fix kodowania znaków |
| `components/dashboard.tsx` | Task 6 — clearTimeout w cleanup |

---

## Task 1: Fix silent failure w addClient()

**Pliki:**
- Modify: `lib/superbase.ts:189-209`
- Modify: `components/add-client-wizard.tsx:108-154`

**Problem:** `addClient()` łapie wszystkie błędy wewnętrznie i zwraca `null` zamiast rzucić wyjątkiem. Wizard ignoruje wartość zwracaną i zawsze pokazuje toast sukcesu.

- [ ] **Step 1: Zmień addClient() żeby rzucał wyjątkiem zamiast zwracać null**

W `lib/superbase.ts` zamień linie 189–209:

```ts
// Dodawanie nowego klienta
export async function addClient(client: Omit<Client, "id" | "created_at">): Promise<Client> {
  const { data, error } = await supabase.from("clients").insert([client]).select().single();

  if (error) throw error;
  return data;
}
```

> Uwaga: usuwamy `try/catch` — błąd propaguje się do callera. Usuwamy też console.log-i debugowe z tej funkcji.

- [ ] **Step 2: Sprawdź czy wizard poprawnie obsługuje błąd**

W `components/add-client-wizard.tsx` onSubmit (linia 145) jest już opakowany w `try/catch`. Upewnij się że zwrócona wartość klienta jest sprawdzana:

```ts
const onSubmit = async (values: WizardValues) => {
  setIsSubmitting(true)
  try {
    const clientData: Omit<Client, "id" | "created_at"> = {
      Name:             values.Name,
      Status:           values.Status,
      Email:            values.Email        || null,
      Phone:            values.Phone        || null,
      KrajPoch:         values.KrajPoch     || null,
      DataZloWnio:      values.DataZloWnio
        ? `${values.DataZloWnio}T12:00:00.000Z`   // Task 2 fix — noon UTC
        : null,
      Birthday:         values.Birthday     || null,
      CelPobytu:        values.CelPobytu    || null,
      PodLegPob:        values.PodLegPob    || null,
      Notes:            values.Notes        || null,
      Creator:          user?.email         || null,
      FormWni:          values.FormWni,
      ZalNrJed:         values.ZalNrJed,
      KopiaPasz:        values.KopiaPasz,
      ZalBlue:          values.ZalBlue,
      CzteZdjecia:      values.CzteZdjecia,
      Pelnomocnictwo:   values.Pelnomocnictwo,
      Adres:            null,
      StatusPla:        null,
      CreatedDate:      new Date().toISOString(),
      TotalSpend:       "0",
      Doc:              null,
      NumerSprawy:      null,
      Inspektor:        null,
      DataWydWni:       null,
      DataOdbKartyPob:  null,
      DataOdbDecyzji:   null,
      DataZakLegPob:    null,
      Firma:            null,
      country_id:       null,
      country_name:     null,
    }
    await addClient(clientData)
    toast({ title: "Klient dodany", description: `${values.Name} został dodany do systemu.` })
    onClientCreated?.()
    handleClose()
  } catch (err) {
    const message = err instanceof Error ? err.message : "Nieznany błąd"
    toast({ title: "Błąd", description: `Nie udało się dodać klienta: ${message}`, variant: "destructive" })
  } finally {
    setIsSubmitting(false)
  }
}
```

> Zwróć uwagę: `DataZloWnio` jest już naprawione (Task 2 — timezone fix wbudowany tutaj).

- [ ] **Step 3: Weryfikacja manualna**

1. Otwórz devtools → Network → ustaw offline
2. Kliknij "Dodaj klienta" → wypełnij formularz → kliknij "Dodaj klienta"
3. Oczekiwany rezultat: toast **"Błąd — Nie udało się dodać klienta: ..."** (nie "Klient dodany")
4. Przywróć sieć → dodaj klienta ponownie → oczekiwany rezultat: toast "Klient dodany" + klient pojawia się na liście

- [ ] **Step 4: Commit**

```bash
git add lib/superbase.ts components/add-client-wizard.tsx
git commit -m "fix: addClient throws on error instead of returning null, wizard shows error toast on failure"
```

---

## Task 2: Fix timezone shift przy zapisie daty

**Pliki:**
- Modify: `components/add-client-wizard.tsx:117`

**Problem:** `new Date("2024-01-15").toISOString()` → UTC midnight → dla użytkownika UTC+1 wyświetla się jako 14 stycznia.

> Ta poprawka jest już wbudowana w kod w Task 1 (Step 2). Jeśli Task 1 był zrobiony razem z Task 2, pomiń ten task.

Jeśli robisz task niezależnie — zmień linię 117 w `components/add-client-wizard.tsx`:

```ts
// Przed:
DataZloWnio: values.DataZloWnio  ? new Date(values.DataZloWnio).toISOString() : null,

// Po — południe UTC zapewnia że data jest poprawna we wszystkich strefach europejskich:
DataZloWnio: values.DataZloWnio  ? `${values.DataZloWnio}T12:00:00.000Z` : null,
```

Ta sama zmiana dotyczy pola `Birthday` jeśli będzie kiedyś zapisywane z timestampem. Na razie Birthday jest zapisywany jako string (linia 121), więc nie wymaga zmiany.

- [ ] **Step 1: Zmień konwersję daty DataZloWnio** (jeśli nie jest już zrobione w Task 1)

- [ ] **Step 2: Weryfikacja manualna**

1. Dodaj klienta z datą złożenia wniosku "2024-01-15"
2. Otwórz Supabase Table Editor → sprawdź kolumnę `DataZloWnio`
3. Oczekiwana wartość: `2024-01-15T12:00:00+00:00` (nie `2024-01-14T23:00:00+00:00`)
4. Sprawdź wyświetlanie w tabeli klientów → powinno pokazywać 15.01.2024

- [ ] **Step 3: Commit** (jeśli nie zrobione w Task 1)

```bash
git add components/add-client-wizard.tsx
git commit -m "fix: prevent timezone shift when saving date fields from HTML date inputs"
```

---

## Task 3: Fix wizard — walidacja kroku, stale closure, scroll na mobile

**Pliki:**
- Modify: `components/add-client-wizard.tsx:99-105` (stale closure)
- Modify: `components/add-client-wizard.tsx:396` (overflow scroll)
- Modify: `components/add-client-wizard.tsx:445-449` (walidacja przed Next)

**Trzy niezależne poprawki w jednym pliku.**

### 3a — Fix stale closure w useEffect

- [ ] **Step 1: Dodaj handleClose do tablicy zależności**

Zmień linie 99–105:

```ts
// Przed:
useEffect(() => {
  if (!open) return
  const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose() }
  window.addEventListener("keydown", handler)
  return () => window.removeEventListener("keydown", handler)
}, [open]) // eslint-disable-line react-hooks/exhaustive-deps

// Po — handleClose w deps, bez suppress komentarza:
useEffect(() => {
  if (!open) return
  const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose() }
  window.addEventListener("keydown", handler)
  return () => window.removeEventListener("keydown", handler)
}, [open, handleClose])
```

> `handleClose` jest zdefiniowany wewnątrz komponentu i rekrea się przy każdym renderze, więc useCallback go stabilizuje. Dodaj `useCallback` do importu i opakuj `handleClose`:

```ts
// Na górze komponentu (przed step panels):
const handleClose = useCallback(() => {
  reset(DEFAULT_VALUES)
  setStep(0)
  onOpenChange(false)
}, [reset, onOpenChange])
```

Zaktualizuj import React:
```ts
import { useState, useEffect, useCallback } from "react"
```

### 3b — Fix overflow/scroll na mobile

- [ ] **Step 2: Usuń overflow-hidden z kontenera slidera, dodaj overflow-y-auto**

Zmień linię ~396:

```tsx
// Przed:
<div className="overflow-hidden flex-shrink-0">

// Po — scroll w obrębie dostępnej przestrzeni:
<div className="overflow-x-hidden overflow-y-auto flex-1 min-h-0">
```

> `flex-1 min-h-0` pozwala kontenerowi kurczyć się gdy modal jest ograniczony przez `max-h-[94svh]`, a `overflow-y-auto` dodaje przewijanie gdy zawartość jest wyższa. Upewnij się że modal `<div>` ma `flex flex-col` (już ma).

### 3c — Fix walidacja przed przyciskiem Dalej

- [ ] **Step 3: Dodaj walidację per-krok przed przejściem dalej**

Zdefiniuj które pola walidować na którym kroku. Na podstawie schematu i zawartości kroków:
- Krok 0 (Dane kontaktowe): `["Name"]`
- Krok 1 (Szczegóły sprawy): `["Status"]`
- Krok 2 (Notatki): brak wymaganych

Zamień przycisk "Dalej" (~linia 445):

```tsx
// Dodaj do destructuringu useForm:
const { register, watch, setValue, handleSubmit, reset, trigger, formState: { errors } } = useForm<WizardValues>({

// Zdefiniuj stałą mapującą krok → pola do walidacji (nad komponentem lub wewnątrz):
const STEP_FIELDS: (keyof WizardValues)[][] = [
  ["Name"],         // krok 0
  ["Status"],       // krok 1
  [],               // krok 2
]

// Zamień przycisk Dalej:
{step < 2 ? (
  <button
    type="button"
    onClick={async () => {
      const valid = await trigger(STEP_FIELDS[step])
      if (valid) setStep(s => s + 1)
    }}
    className="h-9 px-4 rounded-btn bg-brand text-white text-[13px] font-medium hover:bg-brand-deep transition-colors inline-flex items-center gap-1.5"
  >
    Dalej <ArrowRight size={13} />
  </button>
) : (
```

- [ ] **Step 4: Weryfikacja manualna**

1. Otwórz wizard → kliknij "Dalej" bez wpisania imienia
2. Oczekiwany rezultat: błąd walidacji "Imię i nazwisko musi mieć co najmniej 2 znaki" i NIE przechodzi do kroku 2
3. Wpisz imię → kliknij "Dalej" → powinno przejść do kroku 2
4. Na mobile (lub w DevTools mobile viewport) → otwórz wizard → sprawdź czy zawartość kroku jest przewijalna

- [ ] **Step 5: Commit**

```bash
git add components/add-client-wizard.tsx
git commit -m "fix: wizard step validation, mobile scroll, stable handleClose closure"
```

---

## Task 4: Fix obliczanie tygodnia w niedzielę

**Pliki:**
- Modify: `app/calendar/page.tsx:77-83`

**Problem:** Gdy `currentDate` to niedziela, `getDay()` = 0, więc `date - 0 + 1 = date + 1` → weekStart przesuwa się na następny poniedziałek zamiast bieżącego.

- [ ] **Step 1: Napraw obliczenie weekStart**

Zmień funkcję `getDateHeader()` w `app/calendar/page.tsx`, linie 77–83:

```ts
// Przed:
const weekStart = new Date(currentDate)
weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1)

// Po — (getDay() + 6) % 7 mapuje: Pn=0, Wt=1, ..., Nd=6 (ISO):
const weekStart = new Date(currentDate)
weekStart.setDate(currentDate.getDate() - ((currentDate.getDay() + 6) % 7))
```

Sprawdzenie matematyczne:
- Poniedziałek (getDay=1): `1 - (1+6)%7 = 1 - 0 = 1` ✓ (ten sam dzień)
- Niedziela (getDay=0): `0 - (0+6)%7 = 0 - 6 = -6` → cofa 6 dni do poniedziałku ✓

> Zmiana dotyczy tylko nagłówka (`getDateHeader`). Jeśli `WeekView` lub `MonthView` mają własne obliczenia tygodnia, sprawdź je oddzielnie.

- [ ] **Step 2: Sprawdź komponenty widoku tygodnia**

```bash
grep -n "getDay\(\)" components/calendar/week-view.tsx
```

Jeśli znajdziesz podobny wzorzec `- currentDate.getDay() + 1`, zastosuj tę samą poprawkę.

- [ ] **Step 3: Weryfikacja manualna**

1. Ustaw datę systemową na niedzielę (lub znajdź niedzielę w kalendarzu)
2. Otwórz widok tygodnia
3. Oczekiwany rezultat: tydzień zaczyna się od poniedziałku **bieżącego** tygodnia, nie następnego
4. Sprawdź też sobotę (getDay=6): `6 - (6+6)%7 = 6 - 5 = 1` → cofa 5 dni ✓

- [ ] **Step 4: Commit**

```bash
git add app/calendar/page.tsx components/calendar/week-view.tsx
git commit -m "fix: week-start calculation was wrong on Sundays (ISO weekday offset)"
```

---

## Task 5: Fix duplikatu href w mobile nav

**Pliki:**
- Modify: `components/mobile-nav.tsx:8-14`

**Problem:** Dwa wpisy mają `href: "/reports"` — "Dokumenty" i "Raporty" zawsze świecą się jednocześnie, a "Raporty" nie prowadzi nigdzie innego.

- [ ] **Step 1: Zdecyduj o strukturze nawigacji**

Obecnie `/reports` to jedna strona. Jeśli "Dokumenty" i "Raporty" mają być oddzielnymi stronami, potrzebne są osobne trasy. Jeśli mają być jedną stroną, usuń jeden wpis.

Najprostsze rozwiązanie bez nowych stron — usuń duplikat (zostaw "Dokumenty", usuń "Raporty"):

```ts
const NAV_ITEMS = [
  { href: "/",         label: "Pulpit",   icon: LayoutDashboard, exact: true  },
  { href: "/clients",  label: "Klienci",  icon: Users,           exact: false },
  { href: "/calendar", label: "Terminy",  icon: Calendar,        exact: false },
  { href: "/reports",  label: "Raporty",  icon: FileText,        exact: false },
] as const
```

> Zostają 4 elementy nawigacji, każdy z unikalnym href. Jeśli w przyszłości "Dokumenty" dostanie własną trasę (`/documents`), dodaj ją wtedy.

- [ ] **Step 2: Weryfikacja manualna**

1. Otwórz app na mobile viewport (DevTools lub telefon)
2. Przejdź do `/reports`
3. Oczekiwany rezultat: dokładnie **jeden** element świeci się na aktywno

- [ ] **Step 3: Commit**

```bash
git add components/mobile-nav.tsx
git commit -m "fix: remove duplicate /reports nav item that caused two items to appear active"
```

---

## Task 6: Cleanup — kodowanie, console.logs, clearTimeout

**Pliki:**
- Modify: `components/auth-guard.tsx:33` (encoding)
- Modify: `lib/superbase.ts:132-167` (console.logs)
- Modify: `components/dashboard.tsx:97-101, 178-186` (setTimeout cleanup)

### 6a — Fix zniszczonego kodowania w auth-guard

- [ ] **Step 1: Napraw tekst ładowania**

W `components/auth-guard.tsx`, linia 33, zmień:

```tsx
// Przed:
<p className="text-lg font-medium">Åadowanie aplikacji...</p>

// Po:
<p className="text-lg font-medium">Ładowanie aplikacji...</p>
```

> Jeśli Twój edytor nie wyświetla poprawnie polskich znaków, upewnij się że plik jest zapisany w UTF-8.

### 6b — Usuń debug console.logs z getClients()

- [ ] **Step 2: Wyczyść console.logs w lib/superbase.ts**

Usuń linie 134–136 (debug logi z getClients):

```ts
// Usuń te linie:
console.log("Próba pobrania klientów...");
console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Anon Key:", supabaseAnonKey ? "✓ Klucz obecny" : "✗ Brak klucza");
```

Usuń też linie 165–166 (verbose output po fetch):

```ts
// Usuń te linie:
console.log("Pobrano rekordów:", transformedData?.length || 0);
console.log("Pierwsze rekordy:", transformedData?.slice(0, 3));
```

Usuń logi z `addClient` (linie 191, 203) — nie są potrzebne po Task 1 (addClient teraz rzuca):
```ts
// Usuń:
console.log("Próba dodania klienta:", client);
console.log("Klient dodany pomyślnie:", data?.[0]);
```

### 6c — Cleanup setTimeout w dashboard.tsx

- [ ] **Step 3: Dodaj clearTimeout do cleanup**

W `components/dashboard.tsx`, zamień oba `setTimeout` na wersje z cleanup.

Pierwszy (linia ~98, w fetchClients):

```ts
// Przed — gdzieś w środku fetchClients() po setUpcomingExpirations:
setTimeout(() => {
  setForceUpdate(prev => prev + 1)
  window.dispatchEvent(new Event('resize'))
}, 100)

// Po — usuń ten setTimeout całkowicie.
// forceUpdate nie jest potrzebny; wykresy powinny same się renderować po zmianie danych.
```

Drugi `useEffect` (linie ~178–186):

```ts
// Przed:
useEffect(() => {
  if (!isLoading && topCountries.length > 0) {
    setTimeout(() => {
      setForceUpdate(prev => prev + 1)
      window.dispatchEvent(new Event('resize'))
    }, 500)
  }
}, [isLoading, topCountries])

// Po — usuń ten useEffect całkowicie.
```

> Jeśli wykresy (`CountriesChart`, `QuarterlyGrowthChart`) przestaną się renderować po usunięciu tych setTimeout-ów, prawdziwy problem jest w komponentach wykresów (nie reagują na zmianę danych). Wtedy napraw je bezpośrednio, nie przez window resize hack.

Usuń też stan `forceUpdate` jeśli nie jest już używany:

```ts
// Usuń:
const [forceUpdate, setForceUpdate] = useState(0)
```

Sprawdź czy `forceUpdate` jest przekazywany do jakiegoś komponentu wykresu. Jeśli tak, usuń ten prop też.

- [ ] **Step 4: Weryfikacja manualna**

1. Otwórz dashboard — sprawdź czy wykresy się renderują (CountriesChart, QuarterlyGrowthChart)
2. Sprawdź konsolę — nie powinno być logów przy odświeżeniu listy klientów
3. Podczas ładowania app — powinno wyświetlać "Ładowanie aplikacji..." (nie "Åadowanie")

- [ ] **Step 5: Commit**

```bash
git add components/auth-guard.tsx lib/superbase.ts components/dashboard.tsx
git commit -m "fix: encoding corruption in auth-guard, remove debug console.logs, remove timeout memory leaks in dashboard"
```

---

## Task 7: Fix nieużywanej zmiennej fileExtension w uploadFormDocument

**Pliki:**
- Modify: `lib/superbase.ts:725-729`

**Problem:** `fileExtension` jest obliczany ale nigdy nie używany. `fileName` używa całego `file.name`. Oryginalna intencja (sanityzacja rozszerzenia) nigdy nie została zaimplementowana.

- [ ] **Step 1: Usuń martwą zmienną**

W `lib/superbase.ts`, linia ~728:

```ts
// Przed:
const timestamp = Date.now();
const fileExtension = file.name.split('.').pop();   // martwa zmienna
const fileName = `form_uploads/${clientId}/${timestamp}_${file.name}`;

// Po — po prostu usuń linię z fileExtension:
const timestamp = Date.now();
const fileName = `form_uploads/${clientId}/${timestamp}_${file.name}`;
```

- [ ] **Step 2: Commit**

```bash
git add lib/superbase.ts
git commit -m "fix: remove unused fileExtension variable in uploadFormDocument"
```

---

## Podsumowanie commitów

Po zakończeniu wszystkich tasków, branch `uiChange` zawiera te commity:
1. `fix: addClient throws on error instead of returning null`
2. `fix: prevent timezone shift when saving date fields from HTML date inputs` (jeśli nie w commit 1)
3. `fix: wizard step validation, mobile scroll, stable handleClose closure`
4. `fix: week-start calculation was wrong on Sundays`
5. `fix: remove duplicate /reports nav item`
6. `fix: encoding corruption, remove debug logs, remove timeout memory leaks`
7. `fix: remove unused fileExtension variable`

---

## Self-Review

**Spec coverage:**
- ✅ Bug 1 (addClient null): Task 1
- ✅ Bug 2 (overflow clip mobile): Task 3b
- ✅ Bug 3 (Sunday week): Task 4
- ✅ Bug 4 (timezone date): Task 2 + Task 1
- ✅ Bug 5 (duplicate href): Task 5
- ✅ Bug 6 (encoding corruption): Task 6a
- ✅ Bug 7 (no step validation): Task 3c
- ✅ Bug 8 (setTimeout leak): Task 6c
- ✅ Bug 9 (stale closure): Task 3a
- ✅ Bug 10 (console.logs production): Task 6b + Task 1
- ✅ Bug extra (unused fileExtension): Task 7

**Placeholder scan:** Brak TBD, TODO, "implement later". Każdy krok zawiera konkretny kod.

**Type consistency:** `WizardValues`, `Client`, `Omit<Client, "id" | "created_at">` — spójne z definicjami w `lib/superbase.ts` i `add-client-wizard.tsx`.
