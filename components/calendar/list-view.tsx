"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarEvent, eventTypeLabels } from "@/lib/calendar-utils"
import { cn } from "@/lib/utils"
import { List, Clock } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface ListViewProps {
  events: CalendarEvent[]
}

export default function ListView({ events }: ListViewProps) {
  // Filtrowanie tylko nadchodzących wydarzeń (od dzisiaj wzwyż)
  const upcomingEvents = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return events.filter((event) => {
      const eventDate = new Date(event.date)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate >= today
    })
  }, [events])

  // Grupowanie według daty
  const eventsByDate = useMemo(() => {
    const grouped: { [key: string]: CalendarEvent[] } = {}
    
    upcomingEvents.forEach((event) => {
      const dateKey = event.date.toISOString().split("T")[0]
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(event)
    })

    // Sortowanie dat
    return Object.keys(grouped)
      .sort()
      .reduce((acc, key) => {
        acc[key] = grouped[key]
        return acc
      }, {} as { [key: string]: CalendarEvent[] })
  }, [upcomingEvents])

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (dateString === today.toISOString().split("T")[0]) {
      return "Dzisiaj"
    } else if (dateString === tomorrow.toISOString().split("T")[0]) {
      return "Jutro"
    } else {
      return date.toLocaleDateString("pl-PL", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List className="h-5 w-5" />
          Lista nadchodzących terminów
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Brak nadchodzących wydarzeń</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(eventsByDate).map(([dateKey, dateEvents]) => (
              <div key={dateKey} className="space-y-3">
                {/* Nagłówek daty */}
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold text-lg">
                    {formatDateHeader(dateKey)}
                  </h3>
                  <Badge variant="secondary" className="ml-auto">
                    {dateEvents.length} {dateEvents.length === 1 ? "wydarzenie" : "wydarzeń"}
                  </Badge>
                </div>

                {/* Lista wydarzeń */}
                <div className="space-y-2 pl-6">
                  {dateEvents.map((event) => (
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
                          <div className="flex items-center gap-2 mb-2">
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
                          <h4 className="font-semibold text-base mb-1">
                            {event.clientName}
                          </h4>
                          {event.description && (
                            <p className="text-sm text-muted-foreground">
                              {event.description}
                            </p>
                          )}
                        </div>
                        {event.priority === "high" && (
                          <Badge variant="destructive" className="ml-2">
                            Wysoki priorytet
                          </Badge>
                        )}
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

