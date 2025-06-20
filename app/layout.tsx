import { Inter } from 'next/font/google'
import './globals.css'
import type { Metadata } from 'next'
import { AppProviders } from './AppProviders'

const inter = Inter({ subsets: ['latin-ext'] })

export const metadata: Metadata = {
  title: 'Easy Move CRM',
  description: 'Easy move management system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light" />
      </head>
      <body className={inter.className}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
