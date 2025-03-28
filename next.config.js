/** @type {import('next').NextConfig} */
const nextConfig = {
  // Włączenie output: 'standalone' dla lepszego działania w Docker
  output: 'standalone',
  
  // Konfiguracja Reacta w trybie strict
  reactStrictMode: true,
  
  // Podstawowa optymalizacja obrazów
  images: {
    domains: ['avatars.githubusercontent.com'],
  },
  
  // Ignorowanie błędów typów podczas budowy
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Ignorowanie błędów ESLint podczas budowy
  eslint: {
    ignoreDuringBuilds: true,
  }
}

module.exports = nextConfig 