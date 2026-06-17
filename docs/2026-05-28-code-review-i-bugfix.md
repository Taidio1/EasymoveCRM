# Code Review i Bug Fix — 2026-05-28

## Co zostało zrobione

### 1. Analiza kodu (code review)

Przeprowadzono pełną analizę kodu na branchu `uiChange` w trzech kątach:
- **Correctness** — ciche niepowodzenia, błędy danych, off-by-one
- **UI bugs** — duplikaty nawigacji, encoding, layout clip
- **Cleanup** — wycieki pamięci, debug logi, martwy kod

Znaleziono i potwierdzono **10 błędów**.

---

### 2. Znalezione błędy i ich naprawy

| # | Plik | Problem | Waga | Status |
|---|---|---|---|---|
| 1 | `lib/superbase.ts` | `addClient()` zwracał `null` zamiast rzucać wyjątkiem — wizard zawsze pokazywał sukces nawet gdy zapis do bazy się nie powiódł | 🔴 Krytyczny | ✅ Naprawiony |
| 2 | `components/add-client-wizard.tsx` | `overflow-hidden flex-shrink-0` na kontenerze slidera przycinał pola formularza na małych ekranach bez możliwości przewijania | 🔴 Krytyczny | ✅ Naprawiony |
| 3 | `app/calendar/page.tsx` | Obliczanie początku tygodnia błędne w niedzielę (`getDay()=0` → `date+1` = następny poniedziałek zamiast bieżącego) | 🟠 Wysoki | ✅ Naprawiony |
| 4 | `components/add-client-wizard.tsx` | `new Date("YYYY-MM-DD").toISOString()` przechowywał dzień wcześniej dla użytkowników w strefie UTC+1 (Polska) | 🟠 Wysoki | ✅ Naprawiony |
| 5 | `components/mobile-nav.tsx` | Dwa wpisy `href="/reports"` → oba elementy nawigacji podświetlone jednocześnie na trasie `/reports` | 🟡 Średni | ✅ Naprawiony |
| 6 | `components/auth-guard.tsx` | Zniszczone kodowanie UTF-8: `"Åadowanie aplikacji..."` zamiast `"Ładowanie aplikacji..."` — widoczne dla każdego użytkownika przy starcie | 🟡 Średni | ✅ Naprawiony |
| 7 | `components/add-client-wizard.tsx` | Przycisk "Dalej" nie wyzwalał walidacji — można przejść do kroku 2 z pustym wymaganym polem | 🟡 Średni | ✅ Naprawiony |
| 8 | `components/dashboard.tsx` | `setTimeout` bez `clearTimeout` w cleanup useEffect — wyciek pamięci przy szybkim przełączaniu stron | 🟡 Średni | ✅ Naprawiony |
| 9 | `components/add-client-wizard.tsx` | `handleClose` nie był w tablicy zależności `useEffect` — stale closure dla klawisza Escape | 🟢 Niski | ✅ Naprawiony |
| 10 | `lib/superbase.ts` | Debug `console.log()` z URL Supabase odpala przy każdym załadowaniu danych w produkcji | 🟢 Niski | ✅ Naprawiony |
| + | `lib/superbase.ts` | Martwa zmienna `fileExtension` w `uploadFormDocument` — obliczana ale nigdy nieużywana | 🟢 Niski | ✅ Naprawiony |

---

### 3. Commity na branchu `uiChange`

```
463a918  fix: addClient throws on error instead of returning null, wizard shows error toast on failure, fix timezone shift on date fields
540b699  fix: wizard step validation, mobile scroll, stable handleClose closure
2c7b8de  fix: week-start calculation was wrong on Sundays (ISO weekday offset)
dfd56c7  fix: remove duplicate /reports nav item that caused two items to appear active simultaneously
0a3f617  fix: encoding corruption in auth-guard, remove debug console.logs, remove setTimeout memory leaks in dashboard
4f4359e  fix: remove unused fileExtension variable in uploadFormDocument
```

---

### 4. Szczegóły techniczne kluczowych napraw

#### Fix #1 — addClient silent failure
```ts
// Przed — łapał błąd i zwracał null, caller nie wiedział o błędzie:
export async function addClient(...): Promise<Client | null> {
  try { ... if (error) return null; }
  catch { return null; }
}

// Po — rzuca wyjątkiem, caller obsługuje go w try/catch:
export async function addClient(...): Promise<Client> {
  const { data, error } = await supabase...single();
  if (error) throw error;
  return data;
}
```

#### Fix #4 — Timezone shift dat
```ts
// Przed — UTC midnight → dzień wcześniej dla UTC+1:
DataZloWnio: values.DataZloWnio ? new Date(values.DataZloWnio).toISOString() : null

// Po — południe UTC = bezpieczne dla wszystkich stref europejskich:
DataZloWnio: values.DataZloWnio ? `${values.DataZloWnio}T12:00:00.000Z` : null
```

#### Fix #3 — Niedziela w kalendarzu
```ts
// Przed — getDay()=0 dla niedzieli → date-0+1 = jutro:
weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1)

// Po — ISO weekday: Pn=0 ... Nd=6:
weekStart.setDate(currentDate.getDate() - ((currentDate.getDay() + 6) % 7))
```

#### Fix #7 — Walidacja kroku w wizardzie
```tsx
// Przed — setStep bez walidacji:
onClick={() => setStep(s => s + 1)}

// Po — trigger() sprawdza pola bieżącego kroku przed przejściem:
onClick={async () => {
  const valid = await trigger(STEP_FIELDS[step])
  if (valid) setStep(s => s + 1)
}}
```

---

### 5. Dodatkowe usprawnienia (przy okazji bugfixów)

- `dashboard.tsx` — linter usunął nieużywane importy i komponenty (wykresy krajów, kwartalny), upraszczając komponent dashboardu
- `add-client-wizard.tsx` — `handleClose` owinięty w `useCallback` dla stabilności referencji
- `lib/superbase.ts` — wyczyszczone wszystkie verbose `console.log` z `getClients()` i `addClient()`

---

### 6. Weryfikacja

- `npx tsc --noEmit` — brak nowych błędów TypeScript (istniejące błędy w `lib/pdf-generator.ts` sprzed tych zmian)
- `npx next build` — build zakończony bez błędów, wszystkie 11 stron wygenerowane
