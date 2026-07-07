import { describe, expect, it } from "vitest"
import { REQUIRED_DOCS } from "@/lib/panel/required-docs"

describe("REQUIRED_DOCS", () => {
  it("mapuje pola boolean na etykiety", () => {
    expect(REQUIRED_DOCS).toEqual([
      { key: "FormWni", label: "Formularz wniosku" },
      { key: "KopiaPasz", label: "Kopia paszportu" },
      { key: "CzteZdjecia", label: "4 zdjęcia" },
      { key: "ZalNrJed", label: "Załącznik nr 1" },
      { key: "ZalBlue", label: "Niebieski załącznik" },
      { key: "Pelnomocnictwo", label: "Pełnomocnictwo" },
    ])
  })
})
