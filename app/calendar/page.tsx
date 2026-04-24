"use client"

import { useState, useEffect, useMemo } from "react"
import { Client, getClients } from "@/lib/superbase"
import MainLayout from "@/components/main-layout"
import DayView from "@/components/calendar/day-view"
import WeekView from "@/components/calendar/week-view"
import MonthView from "@/components/calendar/month-view"
import ListView from "@/components/calendar/list-view"
import { CalendarToolbar } from "@/components/calendar/toolbar"
import { mapClientsToEvents } from "@/lib/calendar-utils"

export default function CalendarPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"day" | "week" | "month" | "list">("month")

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
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Kalendarz</h1>
            <p className="text-muted-foreground">Zarządzanie terminami urzędowymi</p>
          </div>
        </div>

        {/* Nowy Toolbar */}
        <div className="bg-surface border border-border rounded-panel p-1.5 shadow-sm">
          <CalendarToolbar 
            view={view}
            onViewChange={setView}
            dateHeader={getDateHeader()}
            onPrev={goToPrevious}
            onNext={goToNext}
            onToday={goToToday}
          />
        </div>

        {/* Widoki kalendarza */}
        <div className="min-h-[600px]">
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
