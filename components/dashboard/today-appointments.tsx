import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"
import { type Client } from "@/lib/superbase"

interface Appointment {
  id: string
  time: string
  clientName: string
  caseType: 'visa' | 'pobyt' | 'obywatelstwo' | 'praca'
  caseLabel: string
  isUrgent?: boolean
}

interface TodayAppointmentsProps {
  clients?: Client[]
}

export function TodayAppointments({ clients = [] }: TodayAppointmentsProps) {
  // Map real clients to appointments format for visualization
  const appointments: Appointment[] = clients.slice(0, 4).map((c, i) => ({
    id: c.id,
    time: ["09:00", "10:30", "13:00", "15:00"][i] || "12:00",
    clientName: c.Name,
    caseType: (c.CelPobytu?.toLowerCase().includes("wiza") ? "visa" :
               c.CelPobytu?.toLowerCase().includes("obywatelstwo") ? "obywatelstwo" :
               c.CelPobytu?.toLowerCase().includes("praca") ? "praca" : "pobyt") as any,
    caseLabel: c.CelPobytu || "Pobyt Czasowy",
    isUrgent: i < 2, // Mark first 2 as urgent for demo
  }))

  const urgentCount = appointments.filter(a => a.isUrgent).length

  return (
    <Card className="bg-surface border-border shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm-plus font-bold text-text uppercase tracking-semi-loose">
              Dzisiejsze terminy
            </h2>
            <p className="text-[11px] text-text-mute mt-0.5">
              {appointments.length} spotkań{urgentCount > 0 ? `, ${urgentCount} pilne` : ""}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-text-mute hover:text-brand gap-1 h-7 px-2">
            Kalendarz <ChevronRight className="size-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {appointments.length > 0 ? appointments.map((apt) => (
            <div key={apt.id} className="flex items-center gap-3 group cursor-pointer">
              {/* Time */}
              <div className="w-[46px] shrink-0">
                <span className="font-mono text-xs font-bold text-text">{apt.time}</span>
              </div>

              {/* Divider dot */}
              <div className={cn("w-2 h-2 rounded-full shrink-0", {
                "bg-pobyt": apt.caseType === 'pobyt',
                "bg-visa": apt.caseType === 'visa',
                "bg-obywatelstwo": apt.caseType === 'obywatelstwo',
                "bg-praca": apt.caseType === 'praca',
              })} />

              {/* Client + case */}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-text truncate block group-hover:text-brand transition-colors">
                  {apt.clientName}
                </span>
                <span className="text-[11px] text-text-mute truncate block">
                  {apt.caseLabel}
                </span>
              </div>

              {/* Urgent badge */}
              {apt.isUrgent && (
                <span className="text-[10px] font-bold text-danger border border-danger/30 bg-danger/10 px-1.5 py-0.5 rounded shrink-0">
                  PILNE
                </span>
              )}
            </div>
          )) : (
            <p className="text-sm text-text-mute py-4 text-center">Brak zaplanowanych spotkań.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
