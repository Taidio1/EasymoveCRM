"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RoleGuard } from "@/components/role-guard"

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Raporty</h1>
        <p className="text-muted-foreground">PrzeglÄ…daj i pobieraj raporty w formatach PDF i Word</p>
      </div>

      <Card>
        <CardHeader className="px-6 py-4">
          <CardTitle>Lista raportĂłw</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sekcja standardowych raportĂłw */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Raporty standardowe</h3>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span>Raport miesiÄ™czny</span>
                  <button className="text-primary">Pobierz PDF</button>
                </li>
                <li className="flex justify-between">
                  <span>Podsumowanie klientĂłw</span>
                  <button className="text-primary">Pobierz PDF</button>
                </li>
              </ul>
            </div>
            
            {/* Sekcja raportĂłw tylko dla szefa */}
            <RoleGuard allowedRoles={["boss", "admin"]}>
              <div className="border rounded-lg p-4 bg-muted/30">
                <h3 className="text-lg font-medium mb-2">Raporty zaawansowane</h3>
                <p className="text-sm text-muted-foreground mb-2">DostÄ™pne tylko dla szefa i administratorĂłw</p>
                <ul className="space-y-2">
                  <li className="flex justify-between">
                    <span>Raport finansowy</span>
                    <button className="text-primary">Pobierz PDF</button>
                  </li>
                </ul>
              </div>
            </RoleGuard>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}