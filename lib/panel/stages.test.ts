import { describe, expect, it } from "vitest"
import { STAGES, computeTimeline, currentStageLabel } from "@/lib/panel/stages"

describe("STAGES", () => {
  it("ma 5 etapów w ustalonej kolejności", () => {
    expect(STAGES.map((s) => s.label)).toEqual([
      "Wniosek złożony",
      "Wniosek wydany / zarejestrowany",
      "Decyzja w toku / odbiór decyzji",
      "Odbiór karty pobytu",
      "Legalizacja zakończona",
    ])
  })
})

describe("computeTimeline", () => {
  it("oznacza wcześniejsze jako done, bieżący jako current, kolejne jako pending", () => {
    const t = computeTimeline(3)
    expect(t.map((s) => s.status)).toEqual(["done", "done", "current", "pending", "pending"])
  })
  it("stage > 5 oznacza wszystko jako done", () => {
    expect(computeTimeline(6).every((s) => s.status === "done")).toBe(true)
  })
  it("null traktuje jak brak postępu (wszystko pending)", () => {
    expect(computeTimeline(null).every((s) => s.status === "pending")).toBe(true)
  })
})

describe("currentStageLabel", () => {
  it("zwraca etykietę bieżącego etapu", () => {
    expect(currentStageLabel(3)).toBe("Decyzja w toku / odbiór decyzji")
  })
  it("zwraca 'Zakończona' gdy stage > 5", () => {
    expect(currentStageLabel(6)).toBe("Zakończona")
  })
})
