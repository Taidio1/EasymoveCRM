/** @type {import('next').NextConfig} */
const isLowMemoryBuild = process.env.NEXT_LOW_MEMORY_BUILD === "1"

const nextConfig = {
  // output: 'standalone' for better behavior in Docker
  output: 'standalone',
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['avatars.githubusercontent.com'],
  },
  experimental: {
    ...(isLowMemoryBuild ? { cpus: 1 } : {}),
    webpackBuildWorker: !isLowMemoryBuild,
    parallelServerBuildTraces: !isLowMemoryBuild,
    parallelServerCompiles: !isLowMemoryBuild,
  },
}

export default nextConfig
