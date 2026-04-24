"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarEvent, eventTypeColorsHex, eventTypeLabels } from "@/lib/calendar-utils"
import { cn } from "@/lib/utils"
import { Calendar } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface WeekViewProps {
  events: CalendarEvent[]
  currentDate: Date
}

const HOURS = Array.from({ length: 10 }, (_, i) => i + 8) // 8:00 - 17:00

export default function WeekView({ events, currentDate }: WeekViewProps) {
  // Obliczanie początku tygodnia (poniedziałek)
  const weekStart = useMemo(() => {
    const start = new Date(currentDate)
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1)
    start.setDate(diff)
    start.setHours(0, 0, 0, 0)
    return start
  }, [currentDate])

  // Generowanie dni tygodnia
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      return date
    })
  }, [weekStart])

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const getDayName = (date: Date) => {
    return date.toLocaleDateString("pl-PL", { weekday: "short" }).toUpperCase().replace(".", "")
  }

  // Grupowanie wydarzeń według dnia
  const eventsByDay = useMemo(() => {
    const grouped: { [key: string]: CalendarEvent[] } = {}
    
    weekDays.forEach((day) => {
      const dayKey = day.toISOString().split("T")[0]
      grouped[dayKey] = []
    })

    events.forEach((event) => {
      const eventDate = new Date(event.date)
      const dayKey = eventDate.toISOString().split("T")[0]
      
      if (grouped[dayKey]) {
        grouped[dayKey].push(event)
      }
    })

    return grouped
  }, [events, weekDays])

  return (
    <Card className="shadow-sm border-border overflow-hidden">
      <CardHeader className="py-4 border-b">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-brand" />
          Widok tygodniowy
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col">
          {/* Nagłówki dni */}
          <div className="flex border-b border-border bg-muted/30">
            <div className="w-[60px] border-r border-border shrink-0" />
            <div className="grid grid-cols-7 flex-1">
              {weekDays.map((day, i) => (
                <div
                  key={i}
                  className={cn(
                    "py-3 text-center border-r border-border last:border-r-0",
                    isToday(day) && "bg-brand-soft"
                  )}
                >
                  <div className="text-[10px] font-bold text-muted-foreground tracking-wider mb-1">
                    {getDayName(day)}
                  </div>
                  <div
                    className={cn(
                      "text-[18px] font-semibold leading-none",
                      isToday(day) && "text-brand"
                    )}
                  >
                    {day.getDate()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Siatka godzinowa z wydarzeniami */}
          <ScrollArea className="h-[600px]">
            <div className="flex relative">
              {/* Kolumna godzin */}
              <div className="w-[60px] shrink-0 border-r border-border bg-muted/10">
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="h-[60px] border-b border-border/50 last:border-b-0 px-2 py-1 text-right"
                  >
                    <span className="text-[10px] font-mono text-muted-foreground font-medium">
                      {hour}:00
                    </span>
                  </div>
                ))}
              </div>

              {/* Grid dni */}
              <div className="grid grid-cols-7 flex-1 relative bg-background">
                {/* Linie pomocnicze (poziome) */}
                <div className="absolute inset-0 pointer-events-none">
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="h-[60px] border-b border-border/40 last:border-b-0"
                    />
                  ))}
                </div>

                {weekDays.map((day, dayIdx) => {
                  const dayKey = day.toISOString().split("T")[0]
                  const dayEvents = eventsByDay[dayKey] || []

                  return (
                    <div
                      key={dayIdx}
                      className={cn(
                        "relative h-[600px] border-r border-border last:border-r-0",
                        isToday(day) && "bg-brand-soft/10"
                      )}
                    >
                      {dayEvents.map((event) => {
                        const date = new Date(event.date)
                        const startHour = date.getHours() + date.getMinutes() / 60
                        const duration = 1.0 // Domyślny czas trwania: 1 godzina

                        // Filtrowanie wydarzeń poza zakresem 8:00 - 18:00 (do wyświetlania w gridzie 8-17)
                        if (startHour < 8 || startHour >= 18) return null

                        const top = (startHour - 8) * 60
                        const height = duration * 60 - 2
                        const color = eventTypeColorsHex[event.type] || "#3b82f6"

                        return (
                          <div
                            key={event.id}
                            className="absolute left-1 right-1 rounded-sm p-1.5 overflow-hidden cursor-pointer hover:shadow-md transition-shadow z-10 group"
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              backgroundColor: `${color}20`,
                              borderLeft: `3px solid ${color}`,
                            }}
                            title={`${event.title} - ${event.clientName}`}
                          >
                            <div className="flex justify-between items-start mb-0.5">
                              <span className="text-[9px] font-mono font-bold opacity-80">
                                {date.toLocaleTimeString("pl-PL", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {event.priority === "high" && (
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-0.5 animate-pulse" />
                              )}
                            </div>
                            <div className="text-[10px] font-bold leading-tight truncate text-text">
                              {event.clientName}
                            </div>
                            <div className="text-[9px] truncate opacity-80 text-text/80 font-medium">
                              {eventTypeLabels[event.type] || event.title}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}
