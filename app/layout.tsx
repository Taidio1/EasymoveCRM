import { IBM_Plex_Sans, IBM_Plex_Mono, Fraunces } from "next/font/google"
import "./globals.css"
import type { Metadata, Viewport } from "next"
import { ServiceWorkerRegister } from "@/components/service-worker-register"
import {
  PWA_APP_NAME,
  PWA_SHORT_NAME,
  PWA_THEME_COLOR,
} from "@/lib/pwa"
import { AppProviders } from "./AppProviders"

const plexSans = IBM_Plex_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
})

const plexMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
})

export const metadata: Metadata = {
  title: PWA_APP_NAME,
  description: "Easy Move CRM do zarzadzania klientami, dokumentami i procesami.",
  applicationName: PWA_APP_NAME,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: PWA_SHORT_NAME,
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: PWA_THEME_COLOR,
  colorScheme: "light dark",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" suppressHydrationWarning className={`${plexSans.variable} ${plexMono.variable} ${fraunces.variable}`}>
      <body className="font-sans">
        <ServiceWorkerRegister />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
