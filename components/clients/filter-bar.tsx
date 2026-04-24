"use client"

import { Search, Filter, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FilterBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  activeStatus: string
  onStatusChange: (status: string) => void
  counts: {
    all: number
    urgent: number
    active: number
    pending: number
  }
  onNewClientClick: () => void
}

export function FilterBar({
  searchTerm,
  onSearchChange,
  activeStatus,
  onStatusChange,
  counts,
  onNewClientClick,
}: FilterBarProps) {
  const statusChips = [
    { id: "all", label: "Wszyscy", count: counts.all },
    { id: "urgent", label: "Pilne", count: counts.urgent },
    { id: "active", label: "Aktywne", count: counts.active },
    { id: "pending", label: "Oczekujące", count: counts.pending },
  ]

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
      <div className="flex flex-wrap items-center gap-2">
        {statusChips.map((chip) => (
          <button
            key={chip.id}
            onClick={() => onStatusChange(chip.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-chip text-xxs font-semibold transition-all",
              activeStatus === chip.id
                ? "bg-brand text-white shadow-btn-primary"
                : "bg-surface hover:bg-surface-hover text-text-dim border border-border"
            )}
          >
            <span>{chip.label}</span>
            <span
              className={cn(
                "flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px]",
                activeStatus === chip.id
                  ? "bg-white/20 text-white"
                  : "bg-muted text-text-mute"
              )}
            >
              {chip.count}
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-[320px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-mute" />
          <Input
            type="search"
            placeholder="Szukaj klientów..."
            className="h-9 pl-9 bg-surface border-border rounded-btn text-sm"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <Button variant="outline" className="h-9 gap-2 text-sm-plus border-border text-text font-medium px-3">
          <Filter className="h-4 w-4 text-text-dim" />
          Filtry
        </Button>

        <Button 
          onClick={onNewClientClick}
          className="h-9 gap-2 bg-brand hover:bg-brand-hover text-white shadow-btn-primary px-3 text-sm-plus font-semibold"
        >
          <Plus className="h-4 w-4" />
          Nowy klient
        </Button>
      </div>
    </div>
  )
}
