import type { Client } from "@/lib/superbase"

type DateField = Extract<keyof Client,
  "DataZloWnio" | "DataWydWni" | "DataOdbDecyzji" | "DataOdbKartyPob" | "DataZakLegPob">

export interface StageDef { key: string; label: string; dateField: DateField }

export const STAGES: StageDef[] = [
  { key: "submitted",  label: "Wniosek złożony",                  dateField: "DataZloWnio" },
  { key: "registered", label: "Wniosek wydany / zarejestrowany",  dateField: "DataWydWni" },
  { key: "decision",   label: "Decyzja w toku / odbiór decyzji",  dateField: "DataOdbDecyzji" },
  { key: "card",       label: "Odbiór karty pobytu",              dateField: "DataOdbKartyPob" },
  { key: "done",       label: "Legalizacja zakończona",           dateField: "DataZakLegPob" },
]

export type TimelineStatus = "done" | "current" | "pending"
export interface TimelineStep extends StageDef { status: TimelineStatus }

export function computeTimeline(stage: number | null | undefined): TimelineStep[] {
  const s = typeof stage === "number" ? stage : 0
  return STAGES.map((def, i) => {
    const n = i + 1
    const status: TimelineStatus = n < s ? "done" : n === s ? "current" : "pending"
    return { ...def, status }
  })
}

export function currentStageLabel(stage: number | null | undefined): string {
  const s = typeof stage === "number" ? stage : 0
  if (s > STAGES.length) return "Zakończona"
  if (s < 1) return "Sprawa nierozpoczęta"
  return STAGES[s - 1].label
}
