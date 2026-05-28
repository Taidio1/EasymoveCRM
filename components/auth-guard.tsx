"use client"

import { useAuth } from "@/hooks/use-auth"
import { usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"
import { PropsWithChildren, useEffect, useState } from "react"

export function AuthGuard({ children }: PropsWithChildren) {
  const { loading, user } = useAuth()
  const pathname = usePathname()
  const [isClient, setIsClient] = useState(false)
  
  // To prevent hydration mismatch
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Don't show loading state on login page
  if (!isClient) {
    return null
  }
  
  // If we're at the login page, don't show loading state
  if (pathname === "/login") {
    return <>{children}</>
  }
  
  // Show loading state when auth status is being checked
  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-muted/40">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium">Ładowanie aplikacji...</p>
      </div>
    )
  }
  
  // If not loading and no user, it will redirect to login from useAuth hook
  return <>{children}</>
} 