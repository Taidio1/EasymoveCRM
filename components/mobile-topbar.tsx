"use client"

import { Search, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import { usePathname } from "next/navigation"

const PAGE_TITLES: Record<string, string> = {
  "/": "Pulpit",
  "/clients": "Klienci",
  "/calendar": "Terminy",
  "/reports": "Raporty",
  "/settings": "Ustawienia",
}

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  const match = Object.keys(PAGE_TITLES)
    .filter(k => k !== "/" && pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0]
  return match ? PAGE_TITLES[match] : "EasyMove"
}

export function MobileTopbar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const title = getPageTitle(pathname)

  return (
    <header className="h-14 flex-shrink-0 bg-surface border-b border-border flex items-center px-4 gap-3">
      <div
        className="w-[26px] h-[26px] rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-deep))" }}
      >
        E
      </div>
      <span className="flex-1 text-[15px] font-semibold tracking-[-0.01em] truncate text-text">
        {title}
      </span>
      <button
        onClick={() => window.dispatchEvent(new CustomEvent("open-cmdk"))}
        className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-text-dim hover:text-text transition-colors"
        aria-label="Wyszukaj"
      >
        <Search size={16} />
      </button>
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-text-dim hover:text-text transition-colors"
        aria-label="Zmień motyw"
      >
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </header>
  )
}
