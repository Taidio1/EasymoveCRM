# Edycja inline danych klienta — projekt

**Data:** 2026-06-18
**Status:** zatwierdzony do planowania

## Problem

Po przeprojektowaniu UI strona szczegółów klienta `/clients/[id]` stała się w pełni
read-only. Panele (`ContactPanel`, `TimelinePanel`, `NotesPanel`, `DocsChecklistPanel`,
`FinancesPanel`) jedynie wyświetlają dane z obiektu `client`, a nagłówek nie ma przycisku
edycji. To regresja: pełny formularz edycji istnieje w `components/client-details-modal.tsx`,
ale po redesignie jest podpięty już tylko w `dashboard.tsx` — odłączony od głównego
przepływu klienta. Skutek: użytkownik (w tym admin) nie ma jak edytować danych po
utworzeniu rekordu.

Warstwa danych jest gotowa: `updateClient(id, updates)` w `lib/superbase.ts:205` działa.

## Decyzje projektowe

- **UX:** edycja inline w panelach (nie modal, nie osobna podstrona).
- **Zakres pól:** pełna parytetowość ze starym modalem — wszystkie pola klienta edytowalne.
- **Uprawnienia:** bez bramkowania rolą — edytować mogą wszystkie zalogowane role
  (Admin, Boss, Employee).
- **NotesPanel:** edycja pojedynczego pola `Notes`. Prawdziwy wątek notatek (osobna
  tabela) jest poza zakresem — wymagałby zmiany schematu DB.
- **CaseDataPanel:** nowy panel w prawej kolumnie zakładki „Przegląd".
- **Git:** w trakcie tej pracy nie commitujemy ani nie pushujemy nic na GitHub.

## Mapowanie pól na panele

| Panel | Pola edytowalne |
|---|---|
| `DetailsHeader` | `Name`, `Status`, `CelPobytu`, `KrajPoch` |
| `ContactPanel` | `Email`, `Phone`, `Adres`, `Firma`, `Inspektor` |
| `FinancesPanel` | `TotalSpend`, `StatusPla` (wartości pochodne przeliczają się same) |
| `DocsChecklistPanel` | `FormWni`, `ZalNrJed`, `KopiaPasz`, `ZalBlue`, `CzteZdjecia`, `Pelnomocnictwo` |
| `NotesPanel` | `Notes` |
| `CaseDataPanel` *(nowy)* | `NumerSprawy`, `PodLegPob`, `Birthday`, `DataZloWnio`, `DataWydWni`, `DataOdbKartyPob`, `DataOdbDecyzji`, `DataZakLegPob` |

`TimelinePanel` pozostaje read-only — czyta te same daty co `CaseDataPanel`, więc po
zapisie dat aktualizuje się automatycznie przez współdzielony stan `client`.

## Architektura

### Pojedyncze źródło prawdy i jeden punkt zapisu
Strona `app/clients/[id]/page.tsx` już trzyma `client` w `useState`. Dodajemy tam jedną
funkcję:

```ts
async function handleSave(patch: Partial<Client>): Promise<void>
```

która:
1. woła `updateClient(client.id, patch)`,
2. po sukcesie ustawia `setClient(updated)` i pokazuje toast sukcesu,
3. po błędzie pokazuje toast błędu i **rzuca dalej** (panel zostaje w trybie edycji).

Panele dostają propsy `client` + `onSave` i nie komunikują się z bazą bezpośrednio —
produkują tylko „patch" zawierający wyłącznie swoje pola.

### Hook `usePanelEditor` (nowy: `hooks/use-panel-editor.ts`)
Współdzielona logika trybu edycji, identyczna dla każdego panelu:

```ts
usePanelEditor<TDraft>(opts: {
  initial: TDraft,
  onSave: (patch: Partial<Client>) => Promise<void>,
  toPatch: (draft: TDraft) => Partial<Client>,
  validate?: (draft: TDraft) => Record<string, string> | null,
}) => {
  isEditing, startEdit, cancel,
  draft, setField,
  errors,
  isSaving, submit,
}
```

- `startEdit` inicjuje `draft` z `initial` i wchodzi w tryb edycji.
- `setField(name, value)` aktualizuje draft.
- `submit` waliduje, buduje patch (tylko zmienione pola), woła `onSave`; przy sukcesie
  wychodzi z trybu edycji, przy błędzie zostaje w edycji z zachowanym draftem.
- `cancel` odrzuca draft i wraca do widoku.

### Wspólny pasek akcji (nowy: `components/clients/edit-actions.tsx`)
Mały komponent renderujący w nagłówku karty: w trybie widoku — przycisk „Edytuj"
(ikona ołówka); w trybie edycji — „Zapisz" (ze spinnerem, `disabled` gdy `isSaving`) i
„Anuluj". Zapewnia spójny wygląd we wszystkich panelach.

### Każdy panel
- Tryb widoku: dotychczasowy read-only render.
- Tryb edycji: zamiast tekstu — kontrolki formularza (Input / Textarea / Select /
  Checkbox / date input) podpięte do `draft` przez `setField`.
- Layout pól pozostaje w gestii panelu (panele różnią się układem); współdzielona jest
  tylko logika (`usePanelEditor`) i pasek akcji.

## Walidacja (dedup ze starym modalem)
Schemat Zod `clientFormSchema` żyje dziś wewnątrz `components/client-details-modal.tsx`.
Wyciągamy go do `lib/client-schema.ts`. Panele używają `clientFormSchema.pick({...})` dla
swoich pól; modal importuje ten sam schemat. Jedno źródło reguł, brak rozjazdu walidacji.

## Konwersja dat
Daty są przechowywane jako ISO string. `CaseDataPanel` używa `<input type="date">`
(format `yyyy-MM-dd`). Logikę konwersji ISO ↔ `yyyy-MM-dd` (jest już w modalu)
przenosimy do helpera w `lib/client-utils.ts` i reużywamy w panelu.

## Obsługa błędów
- Zapis pesymistyczny: czekamy na `updateClient`, dopiero potem aktualizujemy widok.
- Błąd zapisu → toast `destructive`, draft i tryb edycji zachowane (brak utraty danych).
- Walidacja przed zapisem; błędy pól pokazywane przy kontrolkach.

## Testy (vitest)
- `usePanelEditor`: wejście/wyjście z edycji, wykrywanie zmian, budowa patcha
  (tylko zmienione pola), ścieżka sukcesu i błędu (`onSave` rzuca → zostaje w edycji).
- Walidacja per-panel: format e-maila, `Name` min. 2 znaki.
- Helper konwersji dat ISO ↔ `yyyy-MM-dd`.

## Pliki

**Nowe:**
- `lib/client-schema.ts` — wyciągnięty `clientFormSchema` + helpery `.pick`.
- `hooks/use-panel-editor.ts` — hook trybu edycji.
- `components/clients/edit-actions.tsx` — wspólny pasek akcji edycji.
- `components/clients/case-data-panel.tsx` — nowy panel danych sprawy (prawa kolumna „Przegląd").
- testy: `hooks/use-panel-editor.test.ts`, `lib/client-schema.test.ts` (lub w istniejących plikach testowych).

**Modyfikowane:**
- `app/clients/[id]/page.tsx` — `handleSave`, przekazanie `onSave` do paneli, osadzenie `CaseDataPanel`.
- `components/clients/details-header.tsx` — edycja `Name`, `Status`, `CelPobytu`, `KrajPoch`.
- `components/clients/contact-panel.tsx` — edycja pól kontaktowych.
- `components/clients/finances-panel.tsx` — edycja `TotalSpend`, `StatusPla`.
- `components/clients/notes-panel.tsx` — edycja pola `Notes`.
- `components/clients/docs-checklist-panel.tsx` — checkboxy dokumentów.
- `components/client-details-modal.tsx` — import `clientFormSchema` z `lib/client-schema.ts`.
- `lib/client-utils.ts` — helper konwersji dat.

## Poza zakresem (YAGNI)
- Wątek wielu notatek (osobna tabela) — wymaga zmiany schematu DB.
- Bramkowanie edycji rolą — świadomie pominięte (wszystkie role edytują).
- Edycja `country_id` przez select krajów — `KrajPoch` jako tekst wystarcza dla parytetu z modalem.
