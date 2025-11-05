"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarEvent, eventTypeLabels } from "@/app/calendar/page"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Calendar as CalendarIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface MonthViewProps {
  events: CalendarEvent[]
  currentDate: Date
  onMonthChange?: (date: Date) => void
}

export default function MonthView({ events, currentDate, onMonthChange }: MonthViewProps) {
  // Grupowanie wydarzeń według daty
  const eventsByDate = useMemo(() => {
    const grouped: { [key: string]: CalendarEvent[] } = {}
    
    events.forEach((event) => {
      const dateKey = event.date.toISOString().split("T")[0]
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(event)
    })

    return grouped
  }, [events])

  // Oznaczanie dat z wydarzeniami
  const modifiers = useMemo(() => {
    const dates: Date[] = []
    Object.keys(eventsByDate).forEach((dateKey) => {
      dates.push(new Date(dateKey))
    })
    return { hasEvents: dates }
  }, [eventsByDate])

  // Wybrana data i wydarzenia dla niej
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return []
    const dateKey = selectedDate.toISOString().split("T")[0]
    return eventsByDate[dateKey] || []
  }, [selectedDate, eventsByDate])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Kalendarz */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Widok miesięczny
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const today = new Date()
                if (onMonthChange) {
                  onMonthChange(today)
                }
                setSelectedDate(today)
              }}
            >
              Dzisiaj
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={currentDate}
            onMonthChange={(date) => {
              if (onMonthChange && date) {
                onMonthChange(date)
              }
            }}
            modifiers={modifiers}
            modifiersClassNames={{
              hasEvents: "bg-primary/20 font-semibold",
            }}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      {/* Lista wydarzeń dla wybranego dnia */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {selectedDate
              ? selectedDate.toLocaleDateString("pl-PL", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "Wybierz datę"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedDate ? (
            <p className="text-sm text-muted-foreground">
              Kliknij na datę w kalendarzu, aby zobaczyć wydarzenia
            </p>
          ) : selectedDateEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Brak wydarzeń w tym dniu
            </p>
          ) : (
            <div className="space-y-3">
              {selectedDateEvents.map((event) => (
                <div
                  key={event.id}
                  className={cn(
                    "p-3 rounded-lg border-l-4",
                    "bg-muted/50 hover:bg-muted transition-colors"
                  )}
                  style={{
                    borderLeftColor: event.color
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge
                      variant="outline"
                      className="text-xs text-white border-0"
                      style={{
                        backgroundColor: event.color
                      }}
                    >
                      {eventTypeLabels[event.type]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {event.date.toLocaleTimeString("pl-PL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm">{event.clientName}</h3>
                  {event.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {event.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

