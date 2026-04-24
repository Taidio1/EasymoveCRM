"use client"

import { useSidebar } from "@/components/sidebar-provider"
import { Button } from "@/components/ui/button"
import { Bell, Menu, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export default function TopNavbar() {
  const { toggle } = useSidebar()
  const { setTheme, theme } = useTheme()
  const pathname = usePathname()

  // Map path to title/subtitle
  const getPageContext = () => {
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length === 0) return { title: "Pulpit", subtitle: "Przegląd statystyk i ostatnich aktywności" }
    
    const page = segments[0]
    switch (page) {
      case 'clients':
        return { title: "Klienci", subtitle: "Zarządzanie bazą klientów i dokumentacją" }
      case 'calendar':
        return { title: "Terminy", subtitle: "Kalendarz spotkań i ważnych dat" }
      case 'reports':
        return { title: "Raporty i Dokumenty", subtitle: "Generowanie zestawień i formularzy" }
      case 'settings':
        return { title: "Ustawienia", subtitle: "Konfiguracja konta i systemu" }
      default:
        return { title: "System CRM", subtitle: "EasyMove Legal Management" }
    }
  }

  const { title, subtitle } = getPageContext()

  return (
    <header className="sticky top-0 z-40 h-[60px] border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={toggle} className="md:hidden size-8 text-text-dim">
            <Menu size={18} />
          </Button>

          <div className="flex flex-col">
            <h1 className="text-[18px] font-semibold text-text leading-tight tracking-semi-tight">
              {title}
            </h1>
            <p className="text-[12px] text-text-mute font-medium leading-none mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Theme toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="size-8 text-text-dim hover:text-text hover:bg-surface-hover"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={18} />}
          </Button>

          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="size-8 text-text-dim hover:text-text hover:bg-surface-hover relative"
          >
            <Bell size={16} />
            <span className="absolute top-2 right-2 size-1.5 bg-danger rounded-full border border-surface shadow-sm"></span>
          </Button>

          <div className="h-4 w-px bg-border mx-1 hidden md:block" />

          {/* Extra Slot for Actions (can be extended later) */}
          <div className="hidden md:flex items-center">
            {/* Example: <Button size="sm" variant="secondary" className="h-7 text-xs">Dodaj klienta</Button> */}
          </div>
        </div>
      </div>
    </header>
  )
}
