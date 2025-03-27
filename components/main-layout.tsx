"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Sidebar from "@/components/sidebar"
import TopNavbar from "@/components/top-navbar"
import { useSidebar } from "@/components/sidebar-provider"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebar()
  const [isMounted, setIsMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div
        className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${isOpen ? "md:ml-64" : "ml-0"}`}
      >
        <TopNavbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

