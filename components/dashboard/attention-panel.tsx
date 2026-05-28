"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import { type Client } from "@/lib/superbase"

interface AttentionPanelProps {
  clients: Client[]
  isLoading?: boolean
}

const AVATAR_COLORS = [
  "bg-pink-500",
  "bg-indigo-500",
  "bg-cyan-500",
  "bg-teal-500",
  "bg-orange-500",
]

function getDeadlineBadge(client: Client): { label: string; color: string } {
  if (!client.DataZakLegPob) return { label: "—", color: "text-text-mute" }
  const diff = Math.ceil((new Date(client.DataZakLegPob).getTime() - Date.now()) / 86400000)
  if (diff < 0) return { label: "PO TERMINIE", color: "text-danger font-bold" }
  if (diff === 0) return { label: "DZISIAJ", color: "text-danger font-bold" }
  if (diff === 1) return { label: "JUTRO", color: "text-warn font-bold" }
  if (diff <= 7) return { label: `za ${diff}d`, color: "text-warn font-semibold" }
  return { label: `za ${diff}d`, color: "text-text-dim" }
}

function getDeadlineDate(client: Client): string {
  if (!client.DataZakLegPob) return ""
  return new Date(client.DataZakLegPob).toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export function AttentionPanel({ clients, isLoading }: AttentionPanelProps) {
  const attentionItems = clients
    .filter(client =>
      client.Status?.toLowerCase() === "weryfikacja" ||
      client.Status?.toLowerCase() === "braki" ||
      client.Status?.toLowerCase() === "w trakcie"
    )
    .sort((a, b) => {
      const da = a.DataZakLegPob ? new Date(a.DataZakLegPob).getTime() : Infinity
      const db = b.DataZakLegPob ? new Date(b.DataZakLegPob).getTime() : Infinity
      return da - db
    })
    .slice(0, 5)

  return (
    <Card className="bg-surface border-border shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm-plus font-bold text-text uppercase tracking-semi-loose">
              Wymagają Twojej uwagi
            </h2>
            <p className="text-[11px] text-text-mute mt-0.5">Sprawy pilne z bliskim terminem</p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-text-mute hover:text-brand gap-1 h-7 px-2">
            Wszystkie <ChevronRight className="size-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
                <div className="w-14 h-5 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : attentionItems.length > 0 ? (
          <div className="space-y-1">
            {attentionItems.map((client, i) => {
              const badge = getDeadlineBadge(client)
              const dateStr = getDeadlineDate(client)
              const initials = client.Name.split(" ").map(p => p[0]).join("").substring(0, 2).toUpperCase()
              const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length]
              return (
                <div
                  key={client.id}
                  className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer group"
                >
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center shrink-0`}>
                    <span className="text-[11px] font-bold text-white">{initials}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text truncate">{client.Name}</span>
                      {client.NumerSprawy && (
                        <span className="text-[10px] text-text-mute font-mono shrink-0">
                          #{client.NumerSprawy}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-text-mute truncate mt-0.5">
                      {client.CelPobytu || "Brak informacji"} — {client.Status}
                    </p>
                  </div>

                  {/* Deadline */}
                  <div className="flex flex-col items-end shrink-0 text-right">
                    <span className={`text-[11px] ${badge.color}`}>{badge.label}</span>
                    <span className="text-[10px] text-text-mute">{dateStr}</span>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="size-4 text-border-strong group-hover:text-brand shrink-0 transition-colors" />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-text-mute text-sm">
            Brak spraw wymagających pilnej uwagi.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
