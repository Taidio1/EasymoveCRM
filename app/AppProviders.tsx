'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/hooks/use-auth'
import { SidebarProvider } from '@/components/sidebar-provider'
import { AuthGuard } from '@/components/auth-guard'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <AuthGuard>
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </AuthGuard>
      </AuthProvider>
    </ThemeProvider>
  )
}
