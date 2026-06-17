import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/supabase-admin", () => ({ getSupabaseAdmin: () => ({}) }))

import { normalizeFieldDefinitionInput, validateFieldDefinitionInput } from "@/lib/document-field-definitions-store"

describe("document field definitions validation", () => {
  it("accepts and normalizes a field definition", () => {
    expect(normalizeFieldDefinitionInput({
      label: " Imie i nazwisko ",
      dataKey: " Name ",
      category: " Dane osobowe ",
      description: " Pelna nazwa klienta ",
      transform: " uppercase ",
    })).toEqual({
      label: "Imie i nazwisko",
      dataKey: "Name",
      category: "Dane osobowe",
      description: "Pelna nazwa klienta",
      transform: "uppercase",
    })
  })

  it("rejects missing required label and dataKey", () => {
    expect(validateFieldDefinitionInput({ label: "", dataKey: "" })).toEqual([
      "Brak label",
      "Brak dataKey",
    ])
  })

  it("omits empty optional metadata", () => {
    expect(normalizeFieldDefinitionInput({
      label: "Kraj pochodzenia",
      dataKey: "KrajPoch",
      category: "",
      description: " ",
      transform: null,
    })).toEqual({
      label: "Kraj pochodzenia",
      dataKey: "KrajPoch",
    })
  })
})
