# Etap 1: Budowanie aplikacji
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

# Dodajemy zmienne jako ARG (z docker-compose)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# Przekazujemy ARG do ENV (dla builda)
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

COPY . .
RUN npm run build

# Etap 2: Uruchamianie aplikacji produkcyjnej
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=80

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js

EXPOSE 80

CMD ["npm", "start"]
