"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarEvent } from "@/lib/calendar-utils"
import { cn } from "@/lib/utils"
import { Calendar } from "lucide-react"

interface WeekViewProps {
  events: CalendarEvent[]
  currentDate: Date
}

export default function WeekView({ events, currentDate }: WeekViewProps) {
  // Obliczanie początku tygodnia (poniedziałek)
  const weekStart = useMemo(() => {
    const start = new Date(currentDate)
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1) // poniedziałek
    start.setDate(diff)
    start.setHours(0, 0, 0, 0)
    return start
  }, [currentDate])

  // Generowanie dni tygodnia
  const weekDays = useMemo(() => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      days.push(date)
    }
    return days
  }, [weekStart])

  // Grupowanie wydarzeń według dnia
  const eventsByDay = useMemo(() => {
    const grouped: { [key: string]: CalendarEvent[] } = {}
    
    weekDays.forEach((day) => {
      const dayKey = day.toISOString().split("T")[0]
      grouped[dayKey] = []
    })

    events.forEach((event) => {
      const eventDate = new Date(event.date)
      eventDate.setHours(0, 0, 0, 0)
      
      weekDays.forEach((day) => {
        const dayStart = new Date(day)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(day)
        dayEnd.setHours(23, 59, 59, 999)

        if (eventDate >= dayStart && eventDate <= dayEnd) {
          const dayKey = day.toISOString().split("T")[0]
          if (!grouped[dayKey]) {
            grouped[dayKey] = []
          }
          grouped[dayKey].push(event)
        }
      })
    })

    return grouped
  }, [events, weekDays])

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const getDayName = (date: Date) => {
    return date.toLocaleDateString("pl-PL", { weekday: "short" })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Widok tygodniowy
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {/* Nagłówki dni */}
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                "p-2 text-center border-b",
                isToday(day) && "bg-primary/10 font-semibold"
              )}
            >
              <div className="text-sm text-muted-foreground">
                {getDayName(day)}
              </div>
              <div
                className={cn(
                  "text-lg mt-1",
                  isToday(day) && "text-primary"
                )}
              >
                {day.getDate()}
              </div>
            </div>
          ))}

          {/* Wydarzenia dla każdego dnia */}
          {weekDays.map((day) => {
            const dayKey = day.toISOString().split("T")[0]
            const dayEvents = eventsByDay[dayKey] || []

            return (
              <div
                key={dayKey}
                className={cn(
                  "min-h-[200px] p-2 border-r border-b",
                  isToday(day) && "bg-primary/5"
                )}
              >
                <div className="space-y-1">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        "p-2 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity",
                        "text-white"
                      )}
                      style={{
                        backgroundColor: event.color
                      }}
                      title={`${event.title} - ${event.clientName}`}
                    >
                      <div className="font-semibold truncate">
                        {event.date.toLocaleTimeString("pl-PL", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="truncate">{event.clientName}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

