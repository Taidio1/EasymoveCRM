import { describe, expect, it } from "vitest"
import { isYes, emptyToNull, toDateInputValue } from "@/lib/client-utils"

describe("isYes", () => {
  it("rozpoznaje wartości prawdziwe", () => {
    expect(isYes(true)).toBe(true)
    expect(isYes("true")).toBe(true)
    expect(isYes("Yes")).toBe(true)
    expect(isYes("yes")).toBe(true)
    expect(isYes(1)).toBe(true)
    expect(isYes("1")).toBe(true)
  })
  it("rozpoznaje wartości fałszywe", () => {
    expect(isYes(false)).toBe(false)
    expect(isYes(null)).toBe(false)
    expect(isYes(undefined)).toBe(false)
    expect(isYes("")).toBe(false)
    expect(isYes("no")).toBe(false)
  })
})

describe("emptyToNull", () => {
  it("zamienia pusty/whitespace string na null", () => {
    expect(emptyToNull("")).toBeNull()
    expect(emptyToNull("   ")).toBeNull()
  })
  it("zachowuje niepusty string (przycięty)", () => {
    expect(emptyToNull("  abc ")).toBe("abc")
  })
})

describe("toDateInputValue", () => {
  it("konwertuje ISO na yyyy-MM-dd", () => {
    expect(toDateInputValue("2026-06-18T10:30:00.000Z")).toBe("2026-06-18")
    expect(toDateInputValue("2026-06-18")).toBe("2026-06-18")
  })
  it("zwraca pusty string dla null/undefined/pustego", () => {
    expect(toDateInputValue(null)).toBe("")
    expect(toDateInputValue(undefined)).toBe("")
    expect(toDateInputValue("")).toBe("")
  })
})
