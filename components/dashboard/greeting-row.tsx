"use client"

import { Button } from "@/components/ui/button"
import { Inbox } from "lucide-react"
import { format } from "date-fns"
import { pl } from "date-fns/locale"

export function GreetingRow({ name, stats }: { name: string, stats: { appointments: number, urgent: number } }) {
  const dateStr = format(new Date(), "EEEE, d MMMM yyyy", { locale: pl }).toUpperCase()
  
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <p className="font-mono text-[11px] font-bold text-text-mute tracking-loosest mb-1">
          {dateStr}
        </p>
        <h1 className="text-[26px] font-bold text-text leading-tight">
          Dzień dobry, {name}.
        </h1>
        <p className="text-[15px] text-text-dim mt-1">
          Masz <span className="text-brand font-semibold">{stats.appointments} terminy</span> oraz <span className="text-warn font-semibold">{stats.urgent} spraw pilnych</span> na dzisiaj.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="default" className="gap-2">
          <Inbox className="size-4" />
          <span>Inbox</span>
        </Button>
      </div>
    </div>
  )
}
