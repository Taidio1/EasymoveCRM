"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { type Client } from "@/lib/superbase"

interface PipelinePanelProps {
  clients: Client[]
  isLoading?: boolean
}

export function PipelinePanel({ clients, isLoading }: PipelinePanelProps) {
  const stages = [
    { label: "Nowe", color: "bg-blue-500" },
    { label: "Weryfikacja", color: "bg-yellow-500" },
    { label: "Złożone", color: "bg-orange-500" },
    { label: "Oczekiwanie", color: "bg-purple-500" },
    { label: "Decyzja", color: "bg-green-500" },
  ]

  const getStageCount = (label: string) => {
    return clients.filter(client => {
      const status = client.Status?.toLowerCase() || ""
      if (label === "Nowe") return status.includes("nowy") || status.includes("w trakcie")
      if (label === "Weryfikacja") return status.includes("weryfikacja")
      if (label === "Złożone") return status.includes("złożone") || status.includes("złożony")
      if (label === "Oczekiwanie") return status.includes("oczekiwanie")
      if (label === "Decyzja") return status.includes("decyzja") || status.includes("zakończony")
      return false
    }).length
  }

  const counts = stages.map(stage => ({
    ...stage,
    count: getStageCount(stage.label)
  }))

  const maxCount = Math.max(...counts.map(c => c.count), 1)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Pipeline Spraw</CardTitle>
        <CardDescription>Etapy procesowania wniosków</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-[100px] h-4 bg-muted rounded"></div>
                <div className="flex-1 h-2 bg-muted rounded"></div>
                <div className="w-[40px] h-4 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {counts.map((stage) => {
              const percentage = (stage.count / maxCount) * 100
              return (
                <div key={stage.label} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-muted-foreground w-[100px] shrink-0">
                    {stage.label}
                  </span>
                  <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${stage.color} transition-all duration-500 ease-out rounded-full shadow-inner`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-right w-[40px] shrink-0">
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
