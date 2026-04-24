"use client"

import React, { useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CalendarEvent, eventTypeLabels } from "@/lib/calendar-utils"
import { cn } from "@/lib/utils"
import { Clock, Calendar } from "lucide-react"

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
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    }
  }

  if (upcomingEvents.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-panel overflow-hidden p-12 text-center">
        <Calendar className="h-12 w-12 text-text-mute mx-auto mb-4 opacity-20" />
        <h3 className="text-lg font-medium text-text mb-1">Brak nadchodzących terminów</h3>
        <p className="text-sm text-text-dim">Wszystkie Twoje zadania są aktualnie wykonane.</p>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-panel overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-surface-hover/50">
            <TableRow className="hover:bg-transparent border-b border-border">
              <TableHead className="w-[100px] h-10 py-0 text-xxs font-bold uppercase tracking-loosest text-text-mute">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Czas
                </div>
              </TableHead>
              <TableHead className="h-10 py-0 text-xxs font-bold uppercase tracking-loosest text-text-mute">
                Klient
              </TableHead>
              <TableHead className="h-10 py-0 text-xxs font-bold uppercase tracking-loosest text-text-mute">
                Rodzaj sprawy
              </TableHead>
              <TableHead className="h-10 py-0 text-xxs font-bold uppercase tracking-loosest text-text-mute">
                Opis / Typ
              </TableHead>
              <TableHead className="w-[120px] h-10 py-0 text-xxs font-bold uppercase tracking-loosest text-text-mute text-right">
                Priorytet
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(eventsByDate).map(([dateKey, dateEvents]) => (
              <React.Fragment key={dateKey}>
                {/* Sticky Header dla daty */}
                <TableRow className="hover:bg-transparent border-b border-border bg-surface-hover/30 sticky top-0 z-10 backdrop-blur-sm">
                  <TableCell colSpan={5} className="py-2 px-4 h-9">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-brand uppercase tracking-wider">
                        {formatDateHeader(dateKey)}
                      </span>
                      <span className="text-[10px] font-medium text-text-mute">
                        {dateEvents.length} {dateEvents.length === 1 ? "wydarzenie" : "wydarzenia"}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>

                {/* Lista wydarzeń dla danej daty */}
                {dateEvents.map((event) => (
                  <TableRow 
                    key={event.id}
                    className="group cursor-pointer hover:bg-surface-hover transition-colors border-b border-border last:border-0"
                  >
                    <TableCell className="py-2.5">
                      <span className="font-mono text-xs font-medium text-text-dim">
                        {event.date.toLocaleTimeString("pl-PL", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <span className="text-sm-plus font-semibold text-text">
                        {event.clientName}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: event.color }}
                        />
                        <span className="text-xs-plus text-text-dim">
                          {eventTypeLabels[event.type]}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <span className="text-xs text-text-mute line-clamp-1">
                        {event.description || event.title}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-pill px-2 py-0.5 text-[10px] font-bold uppercase tracking-semi-loose border-0",
                          event.priority === "high" 
                            ? "bg-danger-soft text-danger" 
                            : event.priority === "medium"
                            ? "bg-warn-soft text-warn"
                            : "bg-info-soft text-info"
                        )}
                      >
                        {event.priority === "high" ? "Pilne" : event.priority === "medium" ? "Ważne" : "Normalny"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between px-6 py-4 bg-surface border-t border-border">
        <div className="text-xs text-text-mute">
          Nadchodzące terminy: <span className="font-semibold text-text">{upcomingEvents.length}</span>
        </div>
      </div>
    </div>
  )
}
