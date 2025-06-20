# 📋 Nowoczesny Formularz Rejestracji Klientów - Instrukcja Konfiguracji

## 🎯 Przegląd

Stworzyłem dla Ciebie **zaawansowany, dwujęzyczny formularz** rejestracji klientów z nowoczesnym designem i funkcjonalnością:

### 1. 🔥 **React Component** (Zintegrowany z aplikacją)
- Lokalizacja: `/app/form/page.tsx` + `/components/client-registration-form.tsx`
- URL: `http://localhost:3000/form`
- Zalety: Pełna integracja, shadcn UI, TypeScript, i18n (PL/EN), nowoczesny design

### 2. 🌐 **Standalone HTML** (Niezależny plik)
- Lokalizacja: `/public/standalone-form.html`
- Zalety: Łatwe wdrożenie, brak dependencies, można hostować wszędzie

---

## 🆕 Nowe Funkcje

### ✨ **Dwujęzyczność (i18n)**
- **Języki**: Polski i Angielski
- **Przełącznik**: Elegancki toggle PL/EN w prawym górnym rogu
- **Tłumaczenia**: Wszystkie teksty, walidacje, komunikaty

### 🎨 **Nowoczesny Design**
- **Paleta kolorów**: Gradient niebieski-indygo, białe/szare akcenty
- **Responsywność**: Pełna obsługa mobile/tablet/desktop
- **Komponenty**: Nowoczesne animacje, hover effects, shadows
- **Ikony**: Lucide React icons z Lucide

### ⚡ **UX Improvements**
- **Loading states**: Elegancki spinner i stany loading
- **File upload**: Drag & drop area z podglądem
- **Walidacja**: Real-time z i18n komunikatami
- **Toast notifications**: Eleganckie powiadomienia
- **Light mode**: Wymuszone białe tło dla wszystkich pól (nadpisanie dark mode)

---

## 🔧 Ostatnie Poprawki

### ✅ **Usunięto pole "Data złożenia wniosku"**
- Pole automatycznie ustawiane na dzisiejszą datę
- Uproszczenie formularza dla użytkownika
- Aktualizacja zarówno React jak i HTML wersji

### ✅ **Poprawiono tło pól formularza**
- **Problem**: Ciemne tło w polach input/select
- **Rozwiązanie**: Wymuszone białe tło z `!important`
- **Nadpisanie**: Dark mode i autocomplete stylów przeglądarki
- **Meta tag**: `color-scheme: light` dla wymuszenia jasnego motywu

---

## ⚙️ Konfiguracja React Component

### Krok 1: Uruchom aplikację
```bash
npm run dev
```

### Krok 2: Otwórz formularz
Idź na: `http://localhost:3000/form`

### Krok 3: Test formularza
Formularz używa istniejących zmiennych środowiskowych z `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://yklzzuoniimpqjqqymlu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## 🌐 Konfiguracja Standalone HTML

### Krok 1: Znajdź plik
Otwórz plik: `/public/standalone-form.html`

### Krok 2: Skonfiguruj Supabase
Znajdź linię **29-30** i zastąp własnymi danymi:
```javascript
// PRZED (linia 29-30):
const SUPABASE_URL = 'YOUR_SUPABASE_URL'
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'

// PO (twoje dane):
const SUPABASE_URL = 'https://yklzzuoniimpqjqqymlu.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Twój klucz
```

### Krok 3: Test formularza
1. Otwórz plik w przeglądarce: `file:///path/to/standalone-form.html`
2. Lub skopiuj na serwer i dostęp przez HTTP

---

## 📝 Funkcjonalności Formularza

### ✅ Pola formularza:
- **Imię i nazwisko** (wymagane, min 2 znaki)
- **Email** (wymagane, walidacja email)
- **Telefon** (wymagane, walidacja numeru)
- **Cel pobytu** (dropdown: Praca, Nauka, Połączenie z rodziną, Inne)
- **Kraj pochodzenia** (select z tabeli `countries`)
- **Data złożenia wniosku** (data picker, max dzisiaj)
- **Załączniki** (opcjonalnie - PDF, JPG, PNG, max 10MB)

### 🔄 Proces wysyłania:
1. **Walidacja** - sprawdzenie wszystkich pól
2. **Zapis klienta** - insert do tabeli `clients`
3. **Upload plików** - jeśli załączono (bucket `documents`)
4. **Komunikat sukcesu** - podsumowanie + następne kroki
5. **Reset formularza** - możliwość złożenia kolejnego wniosku

### 🗄️ Co zostaje zapisane w bazie:
```sql
INSERT INTO clients (
  Name,                  -- Z formularza
  Email,                 -- Z formularza  
  Phone,                 -- Z formularza
  CelPobytu,            -- Z formularza
  country_id,           -- Z formularza
  DataZloWnio,          -- Z formularza
  Status,               -- 'W trakcie' (domyślnie)
  Creator,              -- 'Formularz internetowy'
  Notes,                -- 'Dodano przez formularz internetowy'
  CreatedDate,          -- Timestamp teraz
  -- Pozostałe pola: null/false
);
```

---

## 🚀 Wdrożenie Production

### React Component:
1. **Build aplikacji**: `npm run build`
2. **Deploy**: Vercel, Netlify, lub własny serwer
3. **URL**: `https://yourdomain.com/form`

### Standalone HTML:
1. **Konfiguruj** zmienne Supabase (linii 29-30)
2. **Upload** pliku na serwer
3. **Testuj** dostęp przez HTTP(S)

---

## 🔒 Bezpieczeństwo

### Row Level Security (RLS):
- Tabela `clients` - allow insert dla anonymous
- Bucket `documents` - polícy upload dla public

### Walidacja:
- **Frontend**: Zod schema (React) / JavaScript (HTML)
- **Backend**: Supabase constraints i polícy
- **Upload**: Ograniczenia typu i rozmiaru pliku

---

## 🐛 Debugging

### React Component:
```bash
# Sprawdź błędy TypeScript
npx tsc --noEmit

# Sprawdź logi w konsoli przeglądarki
console.log w handleSubmit()
```

### Standalone HTML:
```javascript
// Dodaj do konsoli przeglądarki
console.log('Supabase config:', SUPABASE_URL)
console.log('Countries loaded:', countries)
```

### Supabase:
```sql
-- Sprawdź czy dane się zapisują
SELECT * FROM clients 
WHERE Creator = 'Formularz internetowy' 
ORDER BY CreatedDate DESC 
LIMIT 10;

-- Sprawdź wgrane pliki
SELECT name, created_at 
FROM storage.objects 
WHERE bucket_id = 'documents' 
AND name LIKE 'form_uploads/%'
ORDER BY created_at DESC;
```

---

## 📞 Wsparcie

Po wypełnieniu formularza klient otrzymuje:

### ✅ Komunikat sukcesu z:
- Podsumowaniem przesłanych danych
- Informacją o czasie odpowiedzi (1-2 dni)
- Numerami kontaktowymi: 
  - +48 574 255 295 (Marcin)
  - +48 669 339 880 (Anna)

### 📧 W systemie CRM:
- Nowy klient ze statusem "Nowy"
- Notatka "Dodano przez formularz internetowy"
- Wszystkie załączone pliki w folderze `form_uploads/{client_id}/`

---

## 🎨 Customizacja

### React Component:
- **Główny formularz**: `/components/client-registration-form.tsx`
- **Tłumaczenia**: `/lib/i18n.ts` - dodaj nowe teksty tutaj
- **Przełącznik języka**: `/components/language-switcher.tsx`
- **Loader**: `/components/loading-spinner.tsx`
- **Style**: Tailwind CSS classes z nowoczesną paletą
- **Dodawanie pól**: Zaktualizuj `clientFormSchema` (Zod) + tłumaczenia

### Standalone HTML:
- Style: CSS w sekcji `<style>` (linia 8-200)
- Pola: Dodaj do HTML + JavaScript walidacji
- Kolory: Zmień CSS custom properties

---

## 🌍 Dodawanie Tłumaczeń

### Jak dodać nowy język:

1. **Edytuj** `/lib/i18n.ts`
2. **Dodaj** nowy język do `Language` type:
```typescript
export type Language = 'pl' | 'en' | 'de' // Dodano niemiecki
```

3. **Dodaj** tłumaczenia do obiektu `translations`:
```typescript
de: {
  title: "Easy Move",
  subtitle: "Aufenthaltslegalisierung in Polen",
  // ... pozostałe tłumaczenia
}
```

4. **Zaktualizuj** przełącznik w `LanguageSwitcher`

### Dostępne sekcje tłumaczeń:
- `title`, `subtitle`, `description` - nagłówek
- `benefits` - benefity (3 elementy)
- `form` - wszystkie pola formularza
- `purposes` - opcje celu pobytu
- `validation` - komunikaty błędów
- `success` - ekran sukcesu
- `info` - informacje o danych
- `footer` - stopka

---

## 🏁 Podsumowanie

✅ **React Component** z i18n gotowy: `http://localhost:3000/form`  
✅ **Standalone HTML** gotowy: `/public/standalone-form.html`  
✅ **Dwujęzyczność** PL/EN zaimplementowana  
✅ **Nowoczesny design** z gradientami i animacjami  
✅ **Funkcje Supabase** zaimplementowane  
✅ **Walidacja** frontend + backend  
✅ **Upload plików** z drag & drop  
✅ **Mobile-responsive** UI/UX  
✅ **Loading states** i toast notifications  

**Otwórz** `http://localhost:3000/form` i przetestuj nowy formularz!

---

🎯 **Potrzebujesz pomocy?** Sprawdź sekcję debugging powyżej lub skontaktuj się z supportem. 