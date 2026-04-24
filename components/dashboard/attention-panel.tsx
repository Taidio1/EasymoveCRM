"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { type Client } from "@/lib/superbase"

interface AttentionPanelProps {
  clients: Client[]
  isLoading?: boolean
}

export function AttentionPanel({ clients, isLoading }: AttentionPanelProps) {
  // Filter clients that might need attention (e.g., status is "W trakcie", "Oczekiwanie" or missing some docs)
  // For now, let's take the first 5 clients as requested or filter by some logic
  const attentionItems = clients
    .filter(client => 
      client.Status?.toLowerCase() === "weryfikacja" || 
      client.Status?.toLowerCase() === "braki"
    )
    .slice(0, 5)

  const getStatusColor = (status: string | null) => {
    if (!status) return "bg-gray-500"
    const s = status.toLowerCase()
    if (s.includes("pobyt")) return "bg-pobyt"
    if (s.includes("obywatelstwo")) return "bg-obywatelstwo"
    if (s.includes("karta polaka")) return "bg-kartapolaka"
    if (s.includes("inne")) return "bg-inne"
    if (s.includes("pilne") || s.includes("w trakcie")) return "bg-brand"
    return "bg-brand"
  }

  const getGradient = (name: string) => {
    const colors = [
      "from-pink-500 to-orange-500",
      "from-purple-500 to-indigo-500",
      "from-blue-500 to-cyan-500",
      "from-green-500 to-teal-500",
      "from-yellow-500 to-red-500",
    ]
    const index = name.length % colors.length
    return colors[index]
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Wymagają uwagi</CardTitle>
        <CardDescription>Ostatnie sprawy wymagające podjęcia działań</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-muted"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : attentionItems.length > 0 ? (
          <div className="space-y-6">
            {attentionItems.map((client) => (
              <div key={client.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <Avatar className={`h-10 w-10 border-2 border-background shadow-sm bg-gradient-to-br ${getGradient(client.Name)}`}>
                    <AvatarFallback className="bg-transparent text-white font-bold">
                      {client.Name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm group-hover:text-primary transition-colors">
                      {client.Name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {client.CelPobytu || "Brak typu"} • {client.NumerSprawy || `#${String(client.id).substring(0, 5)}`}
                    </span>
                  </div>
                </div>
                <Badge className={`${getStatusColor(client.Status)} text-white hover:${getStatusColor(client.Status)} border-none shadow-sm`}>
                  {client.Status || "Nowy"}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Brak spraw wymagających pilnej uwagi.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
