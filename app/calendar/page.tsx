"use client"

import { useState, useEffect, useMemo } from "react"
import { Client, getClients } from "@/lib/superbase"
import MainLayout from "@/components/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, List, Clock, ChevronDown } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import DayView from "@/components/calendar/day-view"
import WeekView from "@/components/calendar/week-view"
import MonthView from "@/components/calendar/month-view"
import ListView from "@/components/calendar/list-view"

// Typy wydarzeń kalendarza
export type CalendarEventType = 
  | "visa_expiration"           // Data wygaśnięcia wizy
  | "residence_permit_expiration" // Data wygaśnięcia karty pobytu
  | "decision_pickup"           // Termin odbioru decyzji
  | "residence_permit_pickup"   // Termin odbioru karty pobytu
  | "application_submission"    // Termin złożenia wniosku o przedłużenie
  | "application_issued"        // Data wydania wniosku
  | "office_visit"              // Terminy wizyt w urzędach

export interface CalendarEvent {
  id: string
  clientId: string
  clientName: string
  type: CalendarEventType
  date: Date
  title: string
  description?: string
  color: string
  priority: "low" | "medium" | "high"
}

// Mapowanie typów wydarzeń na kolory (klasy Tailwind)
const eventTypeColors: Record<CalendarEventType, string> = {
  visa_expiration: "bg-red-500",
  residence_permit_expiration: "bg-orange-500",
  decision_pickup: "bg-blue-500",
  residence_permit_pickup: "bg-green-500",
  application_submission: "bg-purple-500",
  application_issued: "bg-indigo-500",
  office_visit: "bg-yellow-500",
}

// Mapowanie typów wydarzeń na kolory hex (dla inline styles)
const eventTypeColorsHex: Record<CalendarEventType, string> = {
  visa_expiration: "#ef4444",
  residence_permit_expiration: "#f97316",
  decision_pickup: "#3b82f6",
  residence_permit_pickup: "#22c55e",
  application_submission: "#a855f7",
  application_issued: "#6366f1",
  office_visit: "#eab308",
}

// Mapowanie typów wydarzeń na nazwy
const eventTypeLabels: Record<CalendarEventType, string> = {
  visa_expiration: "Wygaśnięcie wizy",
  residence_permit_expiration: "Wygaśnięcie karty pobytu",
  decision_pickup: "Odbior decyzji",
  residence_permit_pickup: "Odbior karty pobytu",
  application_submission: "Złożenie wniosku",
  application_issued: "Wydanie wniosku",
  office_visit: "Wizyta w urzędzie",
}

// Funkcja mapująca klientów na wydarzenia kalendarza
function mapClientsToEvents(clients: Client[]): CalendarEvent[] {
  const events: CalendarEvent[] = []

  clients.forEach((client) => {
    // Data zakończenia legalnego pobytu (wygaśnięcie wizy)
    if (client.DataZakLegPob) {
      events.push({
        id: `visa_exp_${client.id}`,
        clientId: client.id,
        clientName: client.Name,
        type: "visa_expiration",
        date: new Date(client.DataZakLegPob),
        title: `Wygaśnięcie wizy - ${client.Name}`,
        description: `Klient: ${client.Name}`,
        color: eventTypeColorsHex.visa_expiration,
        priority: "high",
      })
    }

    // Data odbioru karty pobytu (może być też terminem wygaśnięcia)
    if (client.DataOdbKartyPob) {
      events.push({
        id: `res_perm_pickup_${client.id}`,
        clientId: client.id,
        clientName: client.Name,
        type: "residence_permit_pickup",
        date: new Date(client.DataOdbKartyPob),
        title: `Odbior karty pobytu - ${client.Name}`,
        description: `Klient: ${client.Name}`,
        color: eventTypeColorsHex.residence_permit_pickup,
        priority: "medium",
      })
    }

    // Data odbioru decyzji
    if (client.DataOdbDecyzji) {
      events.push({
        id: `decision_pickup_${client.id}`,
        clientId: client.id,
        clientName: client.Name,
        type: "decision_pickup",
        date: new Date(client.DataOdbDecyzji),
        title: `Odbior decyzji - ${client.Name}`,
        description: `Klient: ${client.Name}`,
        color: eventTypeColorsHex.decision_pickup,
        priority: "medium",
      })
    }

    // Data złożenia wniosku
    if (client.DataZloWnio) {
      events.push({
        id: `app_submission_${client.id}`,
        clientId: client.id,
        clientName: client.Name,
        type: "application_submission",
        date: new Date(client.DataZloWnio),
        title: `Złożenie wniosku - ${client.Name}`,
        description: `Klient: ${client.Name}`,
        color: eventTypeColorsHex.application_submission,
        priority: "low",
      })
    }

    // Data wydania wniosku
    if (client.DataWydWni) {
      events.push({
        id: `app_issued_${client.id}`,
        clientId: client.id,
        clientName: client.Name,
        type: "application_issued",
        date: new Date(client.DataWydWni),
        title: `Wydanie wniosku - ${client.Name}`,
        description: `Klient: ${client.Name}`,
        color: eventTypeColorsHex.application_issued,
        priority: "low",
      })
    }
  })

  return events.sort((a, b) => a.date.getTime() - b.date.getTime())
}

export default function CalendarPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"day" | "week" | "month" | "list">("month")
  const [isLegendOpen, setIsLegendOpen] = useState(false)

  // Mapowanie klientów na wydarzenia
  const events = useMemo(() => mapClientsToEvents(clients), [clients])

  // Pobieranie klientów
  useEffect(() => {
    async function fetchClients() {
      setIsLoading(true)
      try {
        const data = await getClients()
        setClients(data)
      } catch (error) {
        console.error("Błąd podczas pobierania klientów:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchClients()
  }, [])

  // Nawigacja dat
  const goToPrevious = () => {
    const newDate = new Date(currentDate)
    if (view === "day") {
      newDate.setDate(newDate.getDate() - 1)
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() - 7)
    } else if (view === "month") {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
  }

  const goToNext = () => {
    const newDate = new Date(currentDate)
    if (view === "day") {
      newDate.setDate(newDate.getDate() + 1)
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() + 7)
    } else if (view === "month") {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Formatowanie daty dla nagłówka
  const getDateHeader = () => {
    if (view === "day") {
      return currentDate.toLocaleDateString("pl-PL", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } else if (view === "week") {
      const weekStart = new Date(currentDate)
      weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      
      return `${weekStart.toLocaleDateString("pl-PL", { day: "numeric", month: "long" })} - ${weekEnd.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })}`
    } else if (view === "month") {
      return currentDate.toLocaleDateString("pl-PL", {
        year: "numeric",
        month: "long",
      })
    }
    return "Nadchodzące terminy"
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Ładowanie kalendarza...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Nagłówek */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kalendarz</h1>
            <p className="text-muted-foreground">Zarządzanie terminami urzędowymi</p>
          </div>
        </div>

        {/* Kontrolki nawigacji i widoku */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              {/* Nawigacja dat */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={goToPrevious}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={goToToday}>
                  Dzisiaj
                </Button>
                <Button variant="outline" size="icon" onClick={goToNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="ml-4 text-lg font-semibold">
                  {getDateHeader()}
                </div>
              </div>

              {/* Przełącznik widoków */}
              <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
                <TabsList>
                  <TabsTrigger value="day">Dzień</TabsTrigger>
                  <TabsTrigger value="week">Tydzień</TabsTrigger>
                  <TabsTrigger value="month">Miesiąc</TabsTrigger>
                  <TabsTrigger value="list">Lista</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Legenda */}
        <Collapsible open={isLegendOpen} onOpenChange={setIsLegendOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Legenda</CardTitle>
                  <ChevronDown 
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      isLegendOpen && "rotate-180"
                    )}
                  />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(eventTypeLabels).map(([type, label]) => (
                    <div key={type} className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded" 
                        style={{ backgroundColor: eventTypeColorsHex[type as CalendarEventType] }}
                      />
                      <span className="text-sm text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Widoki kalendarza */}
        <div className="mt-6">
          {view === "day" && (
            <DayView events={events} currentDate={currentDate} />
          )}
          {view === "week" && (
            <WeekView events={events} currentDate={currentDate} />
          )}
          {view === "month" && (
            <MonthView 
              events={events} 
              currentDate={currentDate} 
              onMonthChange={setCurrentDate}
            />
          )}
          {view === "list" && (
            <ListView events={events} />
          )}
        </div>
      </div>
    </MainLayout>
  )
}

// Eksport typów i funkcji pomocniczych
export { eventTypeColors, eventTypeColorsHex, eventTypeLabels, mapClientsToEvents }

