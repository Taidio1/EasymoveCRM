# Wdrażanie aplikacji React CRM z użyciem Dockera

Ten dokument zawiera instrukcje dotyczące wdrażania aplikacji React CRM w środowisku Docker.

## Wymagania wstępne

- [Docker](https://docs.docker.com/get-docker/) (minimum wersja 20.10.0)
- [Docker Compose](https://docs.docker.com/compose/install/) (minimum wersja 2.0.0)
- Konto i projekt w [Supabase](https://supabase.com/)
- Klucze API do Supabase (URL i Anonymous Key)

## Konfiguracja środowiska

1. Sklonuj repozytorium:
   ```bash
   git clone https://github.com/yourusername/react-crm.git
   cd react-crm
   ```

2. Utwórz plik `.env` na podstawie `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Edytuj plik `.env` i wprowadź swoje klucze Supabase:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

## Uruchamianie aplikacji z użyciem Docker Compose

1. Zbuduj i uruchom aplikację za pomocą Docker Compose:
   ```bash
   docker-compose up -d
   ```

2. Aplikacja będzie dostępna pod adresem [http://localhost:3000](http://localhost:3000)

3. Aby zatrzymać aplikację:
   ```bash
   docker-compose down
   ```

## Uruchamianie aplikacji bezpośrednio za pomocą Dockera

1. Zbuduj obraz Docker:
   ```bash
   docker build -t react-crm .
   ```

2. Uruchom kontener Docker:
   ```bash
   docker run -d -p 3000:3000 \
     --name react-crm \
     -e NEXT_PUBLIC_SUPABASE_URL=your_supabase_url \
     -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key \
     react-crm
   ```

3. Aplikacja będzie dostępna pod adresem [http://localhost:3000](http://localhost:3000)

4. Aby zatrzymać kontener:
   ```bash
   docker stop react-crm
   docker rm react-crm
   ```

## Konfiguracja bazy danych Supabase

Aplikacja wymaga odpowiedniej konfiguracji bazy danych Supabase. Poniżej znajduje się struktura tabel:

### Tabela `clients`

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "Name" TEXT NOT NULL,
  "Status" TEXT NOT NULL,
  "CelPobytu" TEXT,
  "PodLegPob" TEXT,
  "KrajPoch" TEXT,
  "Phone" TEXT,
  "StatusPla" TEXT,
  "DataZloWnio" TEXT,
  "Email" TEXT,
  "Birthday" TEXT,
  "Notes" TEXT,
  "Creator" TEXT,
  "CreatedDate" TEXT,
  "TotalSpend" TEXT,
  "Doc" TEXT,
  "NumerSprawy" TEXT,
  "Inspektor" TEXT,
  "DataWydWni" TEXT,
  "DataOdbKartyPob" TEXT,
  "DataOdbDecyzji" TEXT,
  "DataZakLegPob" TEXT,
  "Firma" TEXT,
  "FormWni" TEXT,
  "ZalNrJed" TEXT,
  "KopiaPasz" TEXT,
  "ZalBlue" TEXT,
  "CzteZdjecia" TEXT,
  "Pelnomocnictwo" TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Polityki bezpieczeństwa (RLS)

W Supabase należy skonfigurować Row Level Security (RLS) dla tabeli `clients`:

```sql
-- Włączenie RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Polityka dla zalogowanych użytkowników (odczyt wszystkich rekordów)
CREATE POLICY "Zalogowani użytkownicy mogą odczytywać wszystkie rekordy"
  ON clients FOR SELECT
  USING (auth.role() = 'authenticated');

-- Polityka dla zalogowanych użytkowników (zapis i aktualizacja)
CREATE POLICY "Zalogowani użytkownicy mogą tworzyć/aktualizować rekordy"
  ON clients FOR ALL
  USING (auth.role() = 'authenticated');
```

## Rozwiązywanie problemów

### Problem z połączeniem do Supabase

Jeśli występują problemy z połączeniem do Supabase, sprawdź:

1. Czy zmienne środowiskowe są poprawnie ustawione w kontenerze Docker:
   ```bash
   docker exec react-crm printenv | grep NEXT_PUBLIC_SUPABASE
   ```

2. Czy klucze Supabase są prawidłowe i aktywne w panelu administracyjnym Supabase.

### Problemy z kontenerem Docker

1. Sprawdź logi kontenera:
   ```bash
   docker logs react-crm
   ```

2. Sprawdź status kontenera:
   ```bash
   docker ps -a | grep react-crm
   ```

## Aktualizacja aplikacji

Aby zaktualizować aplikację do najnowszej wersji:

1. Pobierz najnowsze zmiany z repozytorium:
   ```bash
   git pull
   ```

2. Przebuduj i uruchom ponownie kontenery:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

## Produkcyjne wdrożenie

Dla środowiska produkcyjnego zalecamy:

1. Używanie Docker Swarm lub Kubernetes do orkiestracji kontenerów
2. Skonfigurowanie HTTPS za pomocą odwrotnego proxy (np. Nginx, Traefik)
3. Ustawienie bardziej restrykcyjnych polityk bezpieczeństwa w Supabase
4. Konfigurację monitoringu i logowania

## Wsparcie

W przypadku problemów lub pytań, prosimy o kontakt z autorem projektu lub utworzenie zgłoszenia w repozytorium GitHub. 