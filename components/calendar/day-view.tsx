"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarEvent } from "@/app/calendar/page"
import { cn } from "@/lib/utils"
import { Clock } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface DayViewProps {
  events: CalendarEvent[]
  currentDate: Date
}

export default function DayView({ events, currentDate }: DayViewProps) {
  // Filtrowanie wydarzeń dla wybranego dnia
  const dayEvents = useMemo(() => {
    const dayStart = new Date(currentDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(currentDate)
    dayEnd.setHours(23, 59, 59, 999)

    return events.filter((event) => {
      const eventDate = new Date(event.date)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate >= dayStart && eventDate <= dayEnd
    })
  }, [events, currentDate])

  // Grupowanie wydarzeń według godzin (dla wydarzeń z godzinami)
  const eventsByHour = useMemo(() => {
    const hours: { [key: number]: CalendarEvent[] } = {}
    
    // Tworzenie struktury dla wszystkich godzin dnia (6:00 - 22:00)
    for (let hour = 6; hour <= 22; hour++) {
      hours[hour] = []
    }

    dayEvents.forEach((event) => {
      const eventHour = event.date.getHours()
      // Jeśli wydarzenie ma godzinę, dodaj do odpowiedniej godziny
      if (eventHour >= 6 && eventHour <= 22) {
        if (!hours[eventHour]) {
          hours[eventHour] = []
        }
        hours[eventHour].push(event)
      } else {
        // Jeśli nie ma godziny lub jest poza zakresem, dodaj do 9:00
        if (!hours[9]) {
          hours[9] = []
        }
        hours[9].push(event)
      }
    })

    return hours
  }, [dayEvents])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Widok dzienny
        </CardTitle>
      </CardHeader>
      <CardContent>
        {dayEvents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Brak wydarzeń w tym dniu</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(eventsByHour)
              .filter(([_, events]) => events.length > 0)
              .map(([hour, hourEvents]) => (
                <div key={hour} className="flex gap-4">
                  {/* Godzina */}
                  <div className="w-20 flex-shrink-0 text-right pt-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      {hour}:00
                    </span>
                  </div>

                  {/* Wydarzenia */}
                  <div className="flex-1 space-y-2">
                    {hourEvents.map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "p-4 rounded-lg border-l-4",
                          "bg-muted/50 hover:bg-muted transition-colors"
                        )}
                      style={{
                        borderLeftColor: event.color
                      }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="outline"
                                className="text-xs text-white border-0"
                                style={{
                                  backgroundColor: event.color
                                }}
                              >
                                {event.title.split(" - ")[0]}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {formatTime(event.date)}
                              </span>
                            </div>
                            <h3 className="font-semibold text-base">{event.clientName}</h3>
                            {event.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

