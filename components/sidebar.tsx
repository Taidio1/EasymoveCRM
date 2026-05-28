"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSidebar } from "@/components/sidebar-provider"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Users,
  Settings,
  BarChart3,
  FileText,
  FolderOpen,
  LogOut,
  Calendar,
  Search,
  Plus,
  Bell,
  Inbox,
  MoreHorizontal
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { getClients, type Client } from "@/lib/superbase"

const navItems = [
  { title: "Pulpit", href: "/", icon: LayoutDashboard },
  { title: "Klienci", href: "/clients", icon: Users, badge: "247" },
  { title: "Terminy", href: "/calendar", icon: Calendar, badge: "4" },
  { title: "Raporty", href: "/reports", icon: BarChart3 },
  { title: "Dokumenty", href: "/documents", icon: FolderOpen },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { isOpen, toggle } = useSidebar()
  const { logout, user } = useAuth()
  const [upcomingTasks, setUpcomingTasks] = useState<Client[]>([])

  useEffect(() => {
    async function fetchUpcoming() {
      try {
        const data = await getClients()
        // Filter clients with upcoming legal stay expiration (next 30 days)
        const today = new Date()
        const nextMonth = new Date()
        nextMonth.setDate(today.getDate() + 30)
        
        const upcoming = data
          .filter(c => {
            if (!c.DataZakLegPob) return false
            const d = new Date(c.DataZakLegPob)
            return d >= today && d <= nextMonth
          })
          .sort((a, b) => new Date(a.DataZakLegPob!).getTime() - new Date(b.DataZakLegPob!).getTime())
          .slice(0, 3)
          
        setUpcomingTasks(upcoming)
      } catch (err) {
        console.error("Error fetching sidebar data:", err)
      }
    }
    fetchUpcoming()
  }, [])

  const handleLogout = async () => {
    await logout()
  }

  // Pobranie inicjałów z emaila użytkownika
  const getInitials = (email: string) => {
    if (!email) return "U"
    const parts = email.split("@")[0].split(".")
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-surface border-r border-border transition-all duration-300 md:relative",
        isOpen ? "w-[240px]" : "w-[60px]"
      )}
    >
      {/* Header with Logo */}
      <div className="flex items-center gap-3 px-3 py-4">
        <div className="size-7 shrink-0 flex items-center justify-center rounded-chip bg-gradient-to-br from-brand to-brand-deep text-white text-lg font-bold shadow-brand-soft">
          E
        </div>
        {isOpen && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-[14px] font-bold leading-none text-text truncate">EasyMove</span>
            <span className="text-[10px] text-text-mute font-medium truncate">CRM · Legal</span>
          </div>
        )}
      </div>

      {/* Search Trigger */}
      <div className="px-3 mb-4">
        <button 
          className="flex items-center gap-2 w-full h-8 px-2 rounded-btn border border-border bg-bg hover:bg-surface-hover transition-colors group"
          onClick={() => {
            document.dispatchEvent(new KeyboardEvent('keydown', {
              key: 'k',
              metaKey: true,
              ctrlKey: true,
              bubbles: true
            }))
          }}
        >
          <Search className="size-3.5 text-text-dim group-hover:text-text" />
          {isOpen && (
            <>
              <span className="text-xs text-text-dim group-hover:text-text flex-1 text-left">Szukaj...</span>
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-surface px-1.5 font-mono text-[10px] font-medium text-text-mute">
                ⌘K
              </kbd>
            </>
          )}
        </button>
      </div>

      <ScrollArea className="flex-1 px-2">
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center h-8 gap-2.5 rounded-md px-2.5 text-[13px] font-medium transition-all transition-colors",
                  isActive 
                    ? "bg-brand-soft text-text" 
                    : "text-text-dim hover:bg-surface-hover hover:text-text"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-brand rounded-full" />
                )}
                <item.icon className={cn("size-4 shrink-0", isActive ? "text-brand" : "text-text-dim")} />
                {isOpen && (
                  <>
                    <span className="flex-1 truncate">{item.title}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="h-4.5 px-1.5 text-[10px] font-bold bg-bg text-text-mute border-none shadow-none">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Today Section */}
        {isOpen && (
          <div className="mt-8 px-2">
            <h3 className="text-[10.5px] font-bold text-text-mute uppercase tracking-loosest mb-3">Dzisiaj</h3>
            <div className="space-y-3">
              {upcomingTasks.length > 0 ? upcomingTasks.map((task, i) => (
                <Link 
                  key={task.id} 
                  href={`/clients/${task.id}`}
                  className="flex items-center gap-2 group cursor-pointer"
                >
                  <div className={cn("w-1 h-3.5 rounded-full shrink-0", 
                    task.CelPobytu?.toLowerCase().includes("wiza") ? "bg-visa" : 
                    task.CelPobytu?.toLowerCase().includes("obywatelstwo") ? "bg-obywatelstwo" : 
                    task.CelPobytu?.toLowerCase().includes("praca") ? "bg-praca" : "bg-pobyt"
                  )} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-text truncate group-hover:text-brand transition-colors">{task.Name}</span>
                    <span className="text-[10px] text-text-mute font-mono">
                      {task.DataZakLegPob ? new Date(task.DataZakLegPob).toLocaleDateString('pl-PL') : "Termin"}
                    </span>
                  </div>
                </Link>
              )) : (
                <p className="text-[10px] text-text-mute italic px-1">Brak pilnych zadań.</p>
              )}
            </div>
          </div>
        )}
      </ScrollArea>

      {/* User Card */}
      <div className="p-3 border-t border-border">
        <div className={cn(
          "flex items-center gap-2.5 p-1.5 rounded-lg border border-transparent hover:bg-surface-hover hover:border-border transition-all group cursor-pointer",
          !isOpen && "justify-center"
        )}>
          <div className="size-7 shrink-0 rounded-full bg-gradient-to-tr from-brand to-pobyt flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
            {user ? getInitials(user.email) : "U"}
          </div>
          {isOpen && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[12.5px] font-semibold text-text truncate leading-tight">
                {user?.first_name || user?.email?.split('@')[0]}
              </span>
              <span className="text-[10px] text-text-mute font-medium truncate uppercase tracking-semi-loose leading-tight">
                {user?.role || "Employee"}
              </span>
            </div>
          )}
          {isOpen && <MoreHorizontal className="size-3.5 text-text-mute" />}
        </div>
        <Button 
          variant="ghost" 
          className={cn(
            "w-full h-8 mt-2 text-text-mute hover:text-danger hover:bg-danger-soft justify-start px-2",
            !isOpen && "justify-center"
          )} 
          onClick={handleLogout}
        >
          <LogOut size={16} className={cn(isOpen && "mr-2")} />
          {isOpen && <span className="text-xs font-medium">Wyloguj</span>}
        </Button>
      </div>
    </div>
  )
}
