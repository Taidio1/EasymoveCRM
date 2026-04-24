"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Client } from "@/lib/superbase"
import { cn } from "@/lib/utils"
import { CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react"

interface TimelineItemProps {
  date: string
  title: string
  subtitle?: string
  status: "completed" | "current" | "pending" | "alert"
  isLast?: boolean
}

function TimelineItem({ date, title, subtitle, status, isLast }: TimelineItemProps) {
  const getStatusColor = () => {
    switch (status) {
      case "completed": return "bg-success"
      case "current": return "bg-brand"
      case "alert": return "bg-danger"
      default: return "bg-border-strong"
    }
  }

  const getIcon = () => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4 text-white" />
      case "current": return <Clock className="h-4 w-4 text-white" />
      case "alert": return <AlertCircle className="h-4 w-4 text-white" />
      default: return <Circle className="h-3 w-3 text-text-mute" />
    }
  }

  return (
    <div className="flex group">
      {/* Date column - 80px */}
      <div className="w-20 pt-1 flex-shrink-0">
        <span className="font-mono text-[11px] text-text-mute uppercase tracking-wider">{date}</span>
      </div>

      {/* Center line and node */}
      <div className="flex flex-col items-center mx-4">
        <div className={cn(
          "z-10 flex items-center justify-center rounded-full border-2 border-surface shadow-sm transition-transform group-hover:scale-110",
          status === "pending" ? "w-3 h-3 mt-2 bg-surface border-border-strong" : "w-6 h-6 bg-brand",
          getStatusColor()
        )}>
          {getIcon()}
        </div>
        {!isLast && (
          <div className={cn(
            "w-[2px] h-full -mt-1 mb-1",
            status === "completed" ? "bg-success/30" : "bg-border/50"
          )} />
        )}
      </div>

      {/* Right content */}
      <div className="pb-8 pt-0.5">
        <h4 className={cn(
          "text-sm font-semibold",
          status === "pending" ? "text-text-mute" : "text-text"
        )}>{title}</h4>
        {subtitle && (
          <p className="text-xs text-text-dim mt-1 leading-relaxed">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

interface TimelinePanelProps {
  client: Client
}

export function TimelinePanel({ client }: TimelinePanelProps) {
  // Mocking timeline stages based on client status and dates
  const stages = [
    {
      date: client.CreatedDate ? new Date(client.CreatedDate).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' }) : "01.01",
      title: "Rejestracja w systemie",
      subtitle: `Klient został dodany do bazy przez ${client.Creator || 'system'}.`,
      status: "completed" as const
    },
    {
      date: client.DataZloWnio ? new Date(client.DataZloWnio).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' }) : "---",
      title: "Złożenie wniosku",
      subtitle: client.DataZloWnio ? `Wniosek został złożony w urzędzie.` : "Oczekiwanie na komplet dokumentów.",
      status: client.DataZloWnio ? "completed" as const : (client.Status === 'W trakcie' ? "current" as const : "pending" as const)
    },
    {
      date: client.DataOdbDecyzji ? new Date(client.DataOdbDecyzji).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' }) : "---",
      title: "Decyzja urzędowa",
      subtitle: client.DataOdbDecyzji ? `Wydano pozytywną decyzję.` : "Sprawa w toku weryfikacji urzędowej.",
      status: client.DataOdbDecyzji ? "completed" as const : (client.DataZloWnio && !client.DataOdbDecyzji ? "current" as const : "pending" as const)
    },
    {
      date: client.DataOdbKartyPob ? new Date(client.DataOdbKartyPob).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' }) : "---",
      title: "Odbiór karty pobytu",
      subtitle: client.DataOdbKartyPob ? "Karta została odebrana przez klienta." : "Oczekiwanie na druk karty.",
      status: client.DataOdbKartyPob ? "completed" as const : (client.DataOdbDecyzji && !client.DataOdbKartyPob ? "current" as const : "pending" as const)
    }
  ]

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-6">
        <CardTitle className="text-sm font-bold uppercase tracking-widest text-text-mute">Timeline Sprawy</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="flex flex-col">
          {stages.map((stage, index) => (
            <TimelineItem 
              key={index}
              {...stage}
              isLast={index === stages.length - 1}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
