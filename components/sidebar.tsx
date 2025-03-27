"use client"

import type React from "react"

import { useState } from "react"
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
  HelpCircle,
  LogOut,
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
      },      
      {
        title: "Clients",
        href: "/clients",
        icon: Users,
      },
      {
        title: "Reports",
        href: "/reports",
        icon: FileText,
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
      },
      {
        title: "Support",
        href: "/support",
        icon: HelpCircle,
      },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { isOpen, toggle } = useSidebar()
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    Overview: true,
    Management: true,
    System: true,
  })

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r shadow-sm transition-all duration-300 ${
        isOpen ? "w-64" : "w-16"
      }`}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b">
        <Link href="/" className="flex items-center">
          {isOpen ? (
            <h1 className="text-xl font-bold">Business Pro</h1>
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">B</span>
            </div>
          )}
        </Link>
        <Button variant="ghost" size="icon" onClick={toggle} className="md:flex hidden">
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="space-y-4">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-2">
              {isOpen && (
                <div
                  className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-2 py-1 cursor-pointer"
                  onClick={() => toggleSection(section.title)}
                >
                  <span>{section.title}</span>
                  <ChevronRight
                    size={14}
                    className={`transition-transform ${expandedSections[section.title] ? "rotate-90" : ""}`}
                  />
                </div>
              )}

              {(!isOpen || expandedSections[section.title]) && (
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        <item.icon size={isOpen ? 18 : 20} />
                        {isOpen && <span>{item.title}</span>}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="p-3 border-t">
        <Button variant="ghost" className={`w-full justify-start ${!isOpen && "justify-center"}`}>
          <LogOut size={18} className="mr-2" />
          {isOpen && <span>Logout</span>}
        </Button>
      </div>
    </div>
  )
}

