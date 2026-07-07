import type { MetadataRoute } from "next"

export const PWA_THEME_COLOR = "#0f766e"
export const PWA_BACKGROUND_COLOR = "#f8fafc"
export const PWA_APP_NAME = "Easy Move CRM"
export const PWA_SHORT_NAME = "Easy Move"

export const pwaManifest = {
  name: PWA_APP_NAME,
  short_name: PWA_SHORT_NAME,
  description: "Easy Move CRM do zarzadzania klientami, dokumentami i procesami.",
  start_url: "/",
  scope: "/",
  display: "standalone",
  orientation: "portrait",
  background_color: PWA_BACKGROUND_COLOR,
  theme_color: PWA_THEME_COLOR,
  categories: ["business", "productivity"],
  lang: "pl",
  prefer_related_applications: false,
  icons: [
    {
      src: "/icons/icon-192x192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any maskable",
    },
    {
      src: "/icons/icon-512x512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any maskable",
    },
  ],
} satisfies MetadataRoute.Manifest
