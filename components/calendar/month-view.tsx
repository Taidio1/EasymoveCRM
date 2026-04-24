"use client"

import { useMemo } from "react"
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday
} from "date-fns"
import { pl } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarEvent, eventTypeColorsHex } from "@/lib/calendar-utils"
import { cn } from "@/lib/utils"
import { Calendar as CalendarIcon } from "lucide-react"

interface MonthViewProps {
  events: CalendarEvent[]
  currentDate: Date
  onMonthChange?: (date: Date) => void
}

const WEEKDAYS = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"]

export default function MonthView({ events, currentDate }: MonthViewProps) {
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

    return eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd,
    })
  }, [currentDate])

  const eventsByDay = useMemo(() => {
    const grouped: { [key: string]: CalendarEvent[] } = {}
    events.forEach((event) => {
      const dayKey = format(event.date, "yyyy-MM-dd")
      if (!grouped[dayKey]) grouped[dayKey] = []
      grouped[dayKey].push(event)
    })
    return grouped
  }, [events])

  return (
    <Card className="shadow-sm border-border overflow-hidden">
      <CardHeader className="py-4 border-b">
        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-text">
          <CalendarIcon className="h-5 w-5 text-brand" />
          Widok miesięczny
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-7 border-b border-border bg-muted/20">
          {WEEKDAYS.map((name) => (
            <div key={name} className="py-3 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-widest border-r border-border last:border-r-0">
              {name}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd")
            const dayEvents = eventsByDay[dayKey] || []
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isTodayDay = isToday(day)

            return (
              <div
                key={day.toString()}
                className={cn(
                  "min-h-[110px] lg:min-h-[140px] p-1 border-r border-b border-border last:border-r-0 relative transition-colors",
                  !isCurrentMonth && "bg-muted/5 opacity-40",
                  isTodayDay && "bg-brand-soft/30"
                )}
              >
                <div className="flex justify-end p-1">
                  <span className={cn(
                    "text-[13px] font-bold w-7 h-7 flex items-center justify-center rounded-full transition-colors",
                    isTodayDay ? "bg-brand text-white shadow-brand-soft" : "text-muted-foreground"
                  )}>
                    {format(day, "d")}
                  </span>
                </div>
                <div className="space-y-1 mt-1 px-1 overflow-hidden">
                  {dayEvents.slice(0, 4).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-pill hover:bg-background/80 cursor-pointer transition-all border border-transparent hover:border-border/50 shadow-sm"
                      title={`${event.clientName}: ${event.title}`}
                    >
                      <div 
                        className="w-2 h-2 rounded-full shrink-0" 
                        style={{ backgroundColor: eventTypeColorsHex[event.type] }}
                      />
                      <span className="text-[10.5px] font-bold truncate text-text leading-none">
                        {event.clientName}
                      </span>
                    </div>
                  ))}
                  {dayEvents.length > 4 && (
                    <div className="text-[10px] font-extrabold text-brand pl-2.5 pt-0.5 uppercase tracking-tighter">
                      + {dayEvents.length - 4} więcej
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
