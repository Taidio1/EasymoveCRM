# 📊 Przewodnik Integracji Google Analytics 4 z CRM Easy Move

## 🔍 Analiza obecnego stanu

### ✅ Co już masz na stronie:
- **Google Ads Conversion Tracking** (`AW-16859698700`)
- **Meta Pixel** (`1198228447729327`)
- **Cookie Consent System** z localStorage
- **Phone tracking** dla konwersji

### ❌ Co musisz dodać:
- **Google Analytics 4** (GA4)
- **Enhanced tracking events**

## 🚀 Krok 1: Konfiguracja Google Analytics 4

### 1.1 Utworzenie konta GA4
1. Przejdź do [Google Analytics](https://analytics.google.com)
2. Utwórz nowe **Property** typu "GA4"
3. Dodaj **Data Stream** dla strony `www.easy-move.pl`
4. Skopiuj **Measurement ID** (format: `G-XXXXXXXXXX`)

### 1.2 Modyfikacja kodu strony
Zastąp w pliku `index.html`:

```html
<!-- PRZED: Tylko Google Ads -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-16859698700"></script>

<!-- PO: GA4 + Google Ads -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-TWOJ_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  
  gtag('consent', 'default', {
    'analytics_storage': 'denied',
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied'
  });
  
  gtag('js', new Date());
  
  // DODAJ: Konfiguracja GA4
  gtag('config', 'G-TWOJ_MEASUREMENT_ID', {
    'anonymize_ip': true,
    'allow_enhanced_conversions': true
  });
  
  // Istniejąca konfiguracja Google Ads
  gtag('config', 'AW-16859698700');
</script>
```

### 1.3 Zaktualizuj funkcję consent
```javascript
function acceptCookies() {
  // Aktywacja GA4 + Google Ads
  gtag('consent', 'update', {
    'ad_storage': 'granted',
    'analytics_storage': 'granted',
    'ad_user_data': 'granted',
    'ad_personalization': 'granted'
  });

  // Meta Pixel
  fbq('consent', 'grant');
  fbq('track', 'PageView');

  // GA4 Event
  gtag('event', 'consent_granted', {
    'event_category': 'consent',
    'event_label': 'analytics_consent'
  });
}
```

## 📈 Krok 2: Enhanced Event Tracking

Dodaj na końcu `<body>`:

```html
<script>
document.addEventListener('DOMContentLoaded', function() {
  // Formularz kontaktowy
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      gtag('event', 'form_submit', {
        'event_category': 'engagement',
        'event_label': 'contact_form',
        'value': 1
      });
    });
  }

  // Śledzenie nawigacji
  document.querySelectorAll('.nav-link').forEach(function(link) {
    link.addEventListener('click', function(e) {
      const section = e.target.getAttribute('href');
      gtag('event', 'navigation_click', {
        'event_category': 'navigation',
        'event_label': section
      });
    });
  });

  // Czas na stronie (co minutę)
  let timeOnPage = 0;
  setInterval(function() {
    timeOnPage += 60;
    gtag('event', 'time_on_page', {
      'event_category': 'engagement',
      'event_label': timeOnPage + '_seconds',
      'value': timeOnPage
    });
  }, 60000);
});

// Zaktualizowane śledzenie telefonów
window.trackPhoneClick = function(person) {
  const hasConsent = localStorage.getItem('cookie_consent') === 'granted';
  
  if (hasConsent) {
    // GA4 Enhanced event
    gtag('event', 'phone_call', {
      'event_category': 'conversion',
      'event_label': person,
      'custom_parameter_1': 'easy_move_contact',
      'value': 1
    });
    
    // Google Ads Conversion
    gtag('event', 'conversion', {
      'send_to': 'AW-16859698700/TWOJ_CONVERSION_LABEL',
      'value': 1.0,
      'currency': 'PLN'
    });
    
    // Facebook Pixel
    fbq('track', 'Contact', {
      'content_name': 'Phone Call - ' + person,
      'content_category': 'lead_generation'
    });
  }
};
</script>
```

## 🔑 Krok 3: Konfiguracja Backend API

### 3.1 Instalacja pakietów
```bash
npm install googleapis google-auth-library
```

### 3.2 Utworzenie Service Account
1. Przejdź do [Google Cloud Console](https://console.cloud.google.com)
2. Włącz **Google Analytics Reporting API**
3. Utwórz **Service Account**
4. Pobierz plik JSON z kluczami
5. Dodaj Service Account do GA4 jako **Viewer**

### 3.3 Zmienne środowiskowe
Dodaj do `.env`:
```env
# Google Analytics
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=/path/to/service-account.json
GA4_PROPERTY_ID=properties/XXXXXXXXX
```

### 3.4 Serwis Analytics (kod już przygotowany)
Plik będzie dostępny w `lib/analytics-service.ts` po instalacji pakietów.

## 📊 Krok 4: Metryki dostępne do śledzenia

### Podstawowe metryki:
- **Sessions** - liczba sesji
- **Users** - liczba użytkowników  
- **New Users** - nowi użytkownicy
- **Page Views** - wyświetlenia stron
- **Average Session Duration** - średni czas sesji
- **Bounce Rate** - współczynnik odrzuceń
- **Conversions** - konwersje

### Szczegółowe dane:
- **Traffic Sources** - źródła ruchu (Google, Facebook, Direct)
- **Device Categories** - urządzenia (Mobile, Desktop, Tablet)
- **Geographic Data** - lokalizacja użytkowników
- **Landing Pages** - strony docelowe
- **User Behavior** - ścieżki użytkowników

### Custom Events (już skonfigurowane):
- `form_submit` - wysłanie formularza
- `phone_call` - kliknięcie telefonu  
- `navigation_click` - kliknięcia menu
- `time_on_page` - czas na stronie
- `consent_granted` - zgoda na cookies

## 🏗️ Krok 5: Struktura danych w CRM

### 5.1 API Endpoint
```typescript
// GET /api/analytics
{
  "success": true,
  "data": {
    "totalSessions": 1234,
    "totalUsers": 987,
    "totalPageViews": 3456,
    "totalConversions": 23,
    "averageSessionDuration": 180,
    "bounceRate": 45,
    "growthRate": 12,
    "topTrafficSources": [...],
    "deviceBreakdown": [...],
    "dailyMetrics": [...]
  },
  "lastUpdated": "2025-01-01T12:00:00Z"
}
```

### 5.2 Interface TypeScript
```typescript
interface AnalyticsSummary {
  totalSessions: number;
  totalUsers: number;
  totalPageViews: number;
  totalConversions: number;
  averageSessionDuration: number;
  bounceRate: number;
  growthRate: number;
  topTrafficSources: TrafficSource[];
  deviceBreakdown: DeviceData[];
  dailyMetrics: AnalyticsMetrics[];
}
```

## 🎨 Krok 6: Dashboard CRM (już zaimplementowany)

### Komponent `WebsiteAnalytics`:
- ✅ Karty metryk z ikonami
- ✅ Wykres trendów (30 dni)
- ✅ Breakdown urządzeń
- ✅ Top 5 źródeł ruchu
- ✅ Dodatkowe metryki
- ✅ Loading states i error handling

### Zakładka w Dashboard:
- ✅ "Analityka Strony" w menu głównym
- ✅ Automatyczne odświeżanie co godzinę
- ✅ Link do GA4
- ✅ Timestamp ostatniej aktualizacji

## 🔄 Krok 7: Automatyzacja i Cache

### 7.1 Cron Job (opcjonalnie)
```bash
# Crontab - odświeżanie co godzinę
0 * * * * curl https://twoja-domena.pl/api/analytics
```

### 7.2 Database Cache (opcjonalnie)
Możesz dodać tabelę `analytics_cache` w Supabase:
```sql
CREATE TABLE analytics_cache (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🚨 Ważne uwagi

### Bezpieczeństwo:
- **Nigdy nie umieszczaj kluczy API w kodzie frontend**
- **Service Account JSON trzymaj poza repozytorium**
- **Używaj zmiennych środowiskowych**

### GDPR/Cookies:
- ✅ Cookie consent już jest zaimplementowany
- ✅ Domyślnie denied, aktywacja po zgodzie
- ✅ Anonymizacja IP włączona

### Performance:
- ✅ API cache 1 godzina
- ✅ Lazy loading komponentu
- ✅ Error boundaries

## 🎯 Następne kroki

1. **Zastąp** `G-XXXXXXXXXX` prawdziwym Measurement ID
2. **Utwórz** Service Account i pobierz klucze  
3. **Zainstaluj** pakiety `googleapis`
4. **Przetestuj** tracking na stronie
5. **Monitoruj** dane w GA4 przez tydzień
6. **Zastąp** mock data prawdziwymi wywołaniami API

## 📞 Pomoc techniczna

Jeśli potrzebujesz pomocy:
1. Sprawdź **Real-time reports** w GA4
2. Użyj **Google Tag Assistant** do debugowania
3. Monitoruj **Console** w przeglądarce
4. Sprawdź **Network** tab podczas trackingu eventów

---

**Rezultat:** Kompletna integracja analityki strony z dashboard CRM, automatyczne zbieranie danych o ruchu i konwersjach, prezentacja kluczowych metryk dla zespołu Easy Move! 📊✨ 