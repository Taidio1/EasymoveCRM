"use client"

import { useAuth } from "@/hooks/use-auth"
import { PropsWithChildren } from "react"

interface RoleGuardProps extends PropsWithChildren {
  allowedRoles: string[]
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user } = useAuth()
  
  // JeÄ¹âºli uÄ¹Ä½ytkownik nie ma roli lub jego rola nie jest dozwolona, nie renderuj niczego
  if (!user?.role || !allowedRoles.includes(user.role)) {
    return null
  }
  
  // W przeciwnym razie renderuj dzieci
  return <>{children}</>
} 