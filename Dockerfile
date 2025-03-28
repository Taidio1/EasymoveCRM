FROM node:18-alpine AS base
WORKDIR /app

# Kopiowanie plików package.json i package-lock.json
COPY package.json package-lock.json* ./

# Instalacja zależności
RUN npm install

# Kopiowanie reszty aplikacji
COPY . .

# Budowanie aplikacji
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_OPTIONS "--max_old_space_size=4096"
ENV NEXT_PUBLIC_SUPABASE_URL="https://yklzzuoniimpqjqqymlu.supabase.co"
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbHp6dW9uaWltcHFqcXF5bWx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwNzgxNDksImV4cCI6MjA1ODY1NDE0OX0.kShXk8AgMUNF1eZpDxK9FiqUJK1KNRTM-Tr-jZTNIc4"

# Tryb build z ignorowaniem błędów typów
RUN npm run build

# Produkcyjny obraz
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV PORT 3000
ENV NEXT_TELEMETRY_DISABLED 1

# Kopiowanie potrzebnych plików z etapu budowania
COPY --from=base /app/next.config.js ./
COPY --from=base /app/public ./public
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static

# Ustawianie użytkownika
USER node

EXPOSE 3000

# Uruchamianie serwera Next.js
CMD ["node", "server.js"] 