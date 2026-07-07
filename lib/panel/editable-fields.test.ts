import { describe, expect, it } from "vitest"
import { EDITABLE_CLIENT_FIELDS, pickEditableFields } from "@/lib/panel/editable-fields"

describe("pickEditableFields", () => {
  it("przepuszcza tylko dozwolone pola", () => {
    const out = pickEditableFields({
      Name: "Anna", Phone: "600", Status: "HACK", NumerSprawy: "X", TotalSpend: "999",
    })
    expect(out).toEqual({ Name: "Anna", Phone: "600" })
  })
  it("pomija pola nieobecne w wejściu", () => {
    expect(pickEditableFields({ Adres: "ul. X" })).toEqual({ Adres: "ul. X" })
  })
  it("lista zawiera dokładnie ustalone pola", () => {
    expect([...EDITABLE_CLIENT_FIELDS]).toEqual(
      ["Name", "Phone", "Adres", "Birthday", "KrajPoch", "CelPobytu"])
  })
})
