"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, Calendar, FileText, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/",         label: "Pulpit",    icon: LayoutDashboard, exact: true  },
  { href: "/clients",  label: "Klienci",   icon: Users,           exact: false },
  { href: "/calendar", label: "Terminy",   icon: Calendar,        exact: false },
  { href: "/reports",  label: "Dokumenty", icon: FileText,        exact: false },
  { href: "/reports",  label: "Raporty",   icon: BarChart3,       exact: false },
] as const

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 h-[60px] bg-surface border-t border-border flex">
      {NAV_ITEMS.map((item, i) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href)
        const Icon = item.icon
        return (
          <Link
            key={`${item.href}-${i}`}
            href={item.href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-[3px] relative",
              isActive ? "text-brand" : "text-text-mute"
            )}
          >
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-0.5 bg-brand rounded-full" />
            )}
            <Icon size={21} />
            <span className={cn(
              "text-[9.5px] tracking-wide",
              isActive ? "font-semibold" : "font-normal"
            )}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
