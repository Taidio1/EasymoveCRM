"use client"

import type { Client } from "@/lib/superbase"
import { computeTimeline, currentStageLabel } from "@/lib/panel/stages"
import { toDateInputValue } from "@/lib/client-utils"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export function ProgressTimeline({ client }: { client: Client }) {
  const steps = computeTimeline(client.stage as unknown as number)
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-text-mute">Postęp sprawy</p>
      <h1 className="text-xl font-semibold mt-1">{currentStageLabel(client.stage as unknown as number)}</h1>

      <div className="mt-5">
        {steps.map((step, i) => {
          const date = toDateInputValue(client[step.dateField] as string | null)
          const last = i === steps.length - 1
          return (
            <div key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] border-2",
                  step.status === "done" && "bg-emerald-500 border-emerald-500 text-white",
                  step.status === "current" && "border-amber-500 bg-amber-500/15 text-amber-500",
                  step.status === "pending" && "border-border")}>
                  {step.status === "done" ? <Check size={12} /> : step.status === "current" ? "●" : ""}
                </span>
                {!last && <span className={cn("w-0.5 flex-1 min-h-[28px]",
                  step.status === "done" ? "bg-emerald-500" : "bg-border")} />}
              </div>
              <div className={cn("pb-4", step.status === "pending" && "opacity-50")}>
                <p className="text-sm font-medium">{step.label}</p>
                <p className="text-xs text-text-mute mt-0.5">{date || "—"}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
