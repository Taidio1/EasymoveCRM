'use client'

// Konfiguracja aplikacji
export const config = {
  runtime: 'nodejs',
  regions: ['all'],
  memory: 1024,
  maxDuration: 10,
  experimental: {
    appDir: true,
    serverActions: true,
  }
}

// Wyłącza sprawdzanie typów
if (typeof window !== 'undefined') {
  window.__NEXT_DISABLE_TS_ERRORS = true
}

export default config 