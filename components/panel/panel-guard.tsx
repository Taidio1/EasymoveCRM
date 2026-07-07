"use client"

import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"
import { PropsWithChildren, useEffect, useState } from "react"

export function PanelGuard({ children }: PropsWithChildren) {
  const { loading, user } = useAuth()
  const [isClient, setIsClient] = useState(false)
  useEffect(() => setIsClient(true), [])

  if (!isClient || loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-bg">
        <Loader2 className="h-10 w-10 animate-spin text-brand" />
      </div>
    )
  }
  // use-auth przekieruje nie-klienta poza panel; tu tylko zasłaniamy treść.
  if (user?.role !== "Client") return null
  return <>{children}</>
}
