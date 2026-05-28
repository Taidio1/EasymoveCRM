"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import { type Client } from "@/lib/superbase"

interface PipelinePanelProps {
  clients: Client[]
  isLoading?: boolean
}

const STAGES = [
  { label: "Nowe",        color: "bg-cyan-400",    match: (s: string) => s.includes("nowy") || s.includes("nowa") },
  { label: "Analiza",     color: "bg-violet-500",  match: (s: string) => s.includes("weryfikacja") || s.includes("analiza") },
  { label: "W toku",      color: "bg-sky-500",     match: (s: string) => s.includes("w trakcie") || s.includes("złożone") || s.includes("złożony") },
  { label: "Oczekiwanie", color: "bg-amber-400",   match: (s: string) => s.includes("oczekiwanie") || s.includes("braki") },
  { label: "Zakończone",  color: "bg-emerald-500", match: (s: string) => s.includes("zakończony") || s.includes("decyzja") },
]

export function PipelinePanel({ clients, isLoading }: PipelinePanelProps) {
  const counts = STAGES.map(stage => ({
    ...stage,
    count: clients.filter(c => stage.match(c.Status?.toLowerCase() || "")).length,
  }))

  const maxCount = Math.max(...counts.map(c => c.count), 1)

  return (
    <Card className="bg-surface border-border shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm-plus font-bold text-text uppercase tracking-semi-loose">
              Pipeline spraw
            </h2>
            <p className="text-[11px] text-text-mute mt-0.5">Stan wszystkich spraw w systemie</p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-text-mute hover:text-brand gap-1 h-7 px-2">
            Ten miesiąc <ChevronRight className="size-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-[80px] h-3.5 bg-muted rounded shrink-0" />
                <div className="flex-1 h-2.5 bg-muted rounded" />
                <div className="w-8 h-3.5 bg-muted rounded shrink-0" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {counts.map((stage) => {
              const pct = Math.max((stage.count / maxCount) * 100, stage.count > 0 ? 4 : 0)
              return (
                <div key={stage.label} className="flex items-center gap-3">
                  <span className="text-sm text-text-mute w-[90px] shrink-0">{stage.label}</span>
                  <div className="flex-1 h-2 bg-surface-raised rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stage.color} rounded-full transition-all duration-700 ease-out`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-text w-7 text-right shrink-0">
                    {stage.count}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
