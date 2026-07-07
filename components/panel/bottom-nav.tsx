"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ClipboardList, FileText, User, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

const ITEMS = [
  { href: "/panel/postep",     label: "Postęp",    icon: ClipboardList },
  { href: "/panel/dokumenty",  label: "Dokumenty", icon: FileText },
  { href: "/panel/dane",       label: "Dane",      icon: User },
  { href: "/panel/wiadomosci", label: "Wiadom.",   icon: MessageSquare },
] as const

export function PanelBottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 h-[60px] bg-surface border-t border-border flex">
      {ITEMS.map((item) => {
        const active = pathname.startsWith(item.href)
        const Icon = item.icon
        return (
          <Link key={item.href} href={item.href}
            className={cn("flex-1 flex flex-col items-center justify-center gap-[3px] relative",
              active ? "text-brand" : "text-text-mute")}>
            {active && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-0.5 bg-brand rounded-full" />
            )}
            <Icon size={21} />
            <span className={cn("text-[9.5px] tracking-wide", active ? "font-semibold" : "font-normal")}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
