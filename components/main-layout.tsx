"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Sidebar from "@/components/sidebar"
import TopNavbar from "@/components/top-navbar"
import { useSidebar } from "@/components/sidebar-provider"
import { CommandMenu } from "@/components/command-menu"
import { MobileTopbar } from "@/components/mobile-topbar"
import { MobileNav } from "@/components/mobile-nav"
import { useIsMobile } from "@/hooks/use-is-mobile"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebar()
  const [isMounted, setIsMounted] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen">
        <MobileTopbar />
        <main className="flex-1 overflow-y-auto pb-[68px] bg-bg transition-colors duration-300">
          <div className="max-w-[1600px] mx-auto p-4">
            {children}
          </div>
        </main>
        <MobileNav />
        <CommandMenu />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-bg transition-colors duration-300">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
      <CommandMenu />
    </div>
  )
}
