import { describe, expect, it } from "vitest"
import { clientFormSchema, contactSchema, validateWith } from "@/lib/client-schema"

describe("clientFormSchema", () => {
  it("odrzuca zbyt krótkie Name", () => {
    const result = clientFormSchema.safeParse({ Name: "A", Status: "Aktywny" })
    expect(result.success).toBe(false)
  })
  it("przyjmuje poprawne minimum", () => {
    const result = clientFormSchema.safeParse({ Name: "Anna", Status: "Aktywny" })
    expect(result.success).toBe(true)
  })
})

describe("validateWith", () => {
  it("zwraca null gdy brak błędów", () => {
    expect(validateWith(contactSchema, { Email: "a@b.pl", Phone: "", Adres: "", Firma: "", Inspektor: "" })).toBeNull()
  })
  it("zwraca mapę błędów per pole dla błędnego e-maila", () => {
    const errors = validateWith(contactSchema, { Email: "nie-email", Phone: "", Adres: "", Firma: "", Inspektor: "" })
    expect(errors).not.toBeNull()
    expect(errors?.Email).toBeTruthy()
  })
})
