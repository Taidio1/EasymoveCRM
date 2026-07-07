"use client"

import { useAuth } from "@/hooks/use-auth"
import { PropsWithChildren } from "react"

interface RoleGuardProps extends PropsWithChildren {
  allowedRoles: string[]
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user } = useAuth()

  // Porównanie bez względu na wielkość liter — role w profiles bywają zapisane
  // małymi literami (np. "admin"), a w kodzie używamy "Admin"/"Boss".
  const role = user?.role?.toLowerCase()
  const allowed = allowedRoles.map((r) => r.toLowerCase())
  if (!role || !allowed.includes(role)) {
    return null
  }

  // W przeciwnym razie renderuj dzieci
  return <>{children}</>
} 