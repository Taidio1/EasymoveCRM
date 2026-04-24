"use client"

import { useMemo } from "react"
import { format, isToday } from "date-fns"
import { pl } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarEvent, eventTypeColorsHex, eventTypeLabels } from "@/lib/calendar-utils"
import { cn } from "@/lib/utils"
import { Calendar } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DayViewProps {
  events: CalendarEvent[]
  currentDate: Date
}

const HOURS = Array.from({ length: 10 }, (_, i) => i + 8) // 8:00 - 17:00

export default function DayView({ events, currentDate }: DayViewProps) {
  // Filtrowanie wydarzeń dla wybranego dnia
  const dayEvents = useMemo(() => {
    return events.filter((event) => {
      const eventDate = new Date(event.date)
      return format(eventDate, "yyyy-MM-dd") === format(currentDate, "yyyy-MM-dd")
    })
  }, [events, currentDate])

  const getDayName = (date: Date) => {
    return format(date, "EEEE", { locale: pl }).toUpperCase()
  }

  return (
    <Card className="shadow-sm border-border overflow-hidden">
      <CardHeader className="py-4 border-b">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-brand" />
          Widok dzienny
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col">
          {/* Duży nagłówek dnia */}
          <div className="p-8 border-b border-border bg-muted/10">
            <div className="text-xs font-bold text-muted-foreground tracking-wider mb-2 uppercase">
              {getDayName(currentDate)}
            </div>
            <div className={cn(
              "text-3xl font-bold tracking-tight",
              isToday(currentDate) ? "text-brand" : "text-text"
            )}>
              {format(currentDate, "d MMMM yyyy", { locale: pl })}
            </div>
          </div>

          <ScrollArea className="h-[600px]">
            <div className="flex relative">
              {/* Kolumna godzin */}
              <div className="w-[70px] shrink-0 border-r border-border bg-muted/5">
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="h-[80px] border-b border-border/50 last:border-b-0 px-3 py-2 text-right"
                  >
                    <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                      {hour}:00
                    </span>
                  </div>
                ))}
              </div>

              {/* Grid wydarzeń */}
              <div className="flex-1 relative bg-background">
                {/* Linie pomocnicze */}
                <div className="absolute inset-0 pointer-events-none">
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="h-[80px] border-b border-border/40 last:border-b-0"
                    />
                  ))}
                </div>

                <div className="relative h-[800px] py-0">
                  {dayEvents.map((event) => {
                    const date = new Date(event.date)
                    const startHour = date.getHours() + date.getMinutes() / 60
                    
                    // Tylko w godzinach 8:00 - 18:00 (grid 8-17)
                    if (startHour < 8 || startHour >= 18) return null

                    const top = (startHour - 8) * 80
                    const height = 74 // Stała wysokość dla wydarzeń (prawie cała godzina)
                    const color = eventTypeColorsHex[event.type] || "#3b82f6"

                    return (
                      <div
                        key={event.id}
                        className="absolute left-4 right-4 rounded-md p-4 shadow-sm cursor-pointer hover:shadow-md transition-all z-10 border-l-[4px]"
                        style={{
                          top: `${top + 3}px`,
                          height: `${height}px`,
                          backgroundColor: `${color}15`,
                          borderLeftColor: color,
                        }}
                      >
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="text-[10px] font-mono font-bold opacity-70">
                            {format(date, "HH:mm")}
                          </span>
                          {event.priority === "high" && (
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider">Pilne</span>
                              <span className="bg-red-500 w-2 h-2 rounded-full animate-pulse" />
                            </div>
                          )}
                        </div>
                        <div className="font-bold text-base text-text truncate mb-0.5">
                          {event.clientName}
                        </div>
                        <div className="text-xs text-text/70 truncate font-semibold">
                          {eventTypeLabels[event.type] || event.title}
                        </div>
                      </div>
                    )
                  })}
                  {dayEvents.length === 0 && (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm font-medium">
                      Brak zaplanowanych wydarzeń
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}
