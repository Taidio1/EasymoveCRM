import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider } from "@/components/sidebar-provider"
import { AuthProvider } from "@/hooks/use-auth"
import { AuthGuard } from "@/components/auth-guard"
import { Inter } from "next/font/google"
import "./globals.css"
import type { Metadata } from "next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Business Dashboard",
  description: "Modern business management dashboard",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <AuthGuard>
              <SidebarProvider>{children}</SidebarProvider>
            </AuthGuard>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'