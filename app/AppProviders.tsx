'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/hooks/use-auth'
import { SidebarProvider } from '@/components/sidebar-provider'
import { AuthGuard } from '@/components/auth-guard'
import { CommandMenu } from '@/components/command-menu'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <AuthGuard>
          <SidebarProvider>
            {children}
            <CommandMenu />
          </SidebarProvider>
        </AuthGuard>
      </AuthProvider>
    </ThemeProvider>
  )
}
