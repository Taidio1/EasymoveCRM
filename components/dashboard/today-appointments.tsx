import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { type Client } from "@/lib/superbase"

interface Appointment {
  id: string
  time: string
  clientName: string
  caseType: 'visa' | 'pobyt' | 'obywatelstwo' | 'praca'
  caseLabel: string
}

interface TodayAppointmentsProps {
  clients?: Client[]
}

export function TodayAppointments({ clients = [] }: TodayAppointmentsProps) {
  // Map real clients to appointments format for visualization
  const appointments: Appointment[] = clients.slice(0, 4).map((c, i) => ({
    id: c.id,
    time: ["09:00", "10:30", "13:00", "15:30"][i] || "12:00",
    clientName: c.Name,
    caseType: (c.CelPobytu?.toLowerCase().includes("wiza") ? "visa" : 
               c.CelPobytu?.toLowerCase().includes("obywatelstwo") ? "obywatelstwo" : 
               c.CelPobytu?.toLowerCase().includes("praca") ? "praca" : "pobyt") as any,
    caseLabel: c.CelPobytu || "Pobyt Czasowy"
  }))

  return (
    <Card className="bg-surface border-border shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm-plus font-bold text-text uppercase tracking-semi-loose">
          Dzisiejsze spotkania
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {appointments.length > 0 ? appointments.map((apt) => (
            <div key={apt.id} className="flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs font-bold text-brand bg-brand-soft/30 px-2 py-1 rounded-chip">
                  {apt.time}
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-text group-hover:text-brand transition-colors">
                    {apt.clientName}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={cn("w-1.5 h-1.5 rounded-full", {
                      "bg-pobyt": apt.caseType === 'pobyt',
                      "bg-visa": apt.caseType === 'visa',
                      "bg-obywatelstwo": apt.caseType === 'obywatelstwo',
                      "bg-praca": apt.caseType === 'praca',
                    })} />
                    <span className="text-2xs text-text-mute uppercase tracking-wider">
                      {apt.caseLabel}
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-8 h-8 rounded-btn border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-1.5 h-1.5 rounded-full bg-border-strong" />
              </div>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground py-4 text-center">Brak zaplanowanych spotkań.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
