import { describe, expect, it } from "vitest"
import {
  CLIENT_FIELD_DEFINITION_PRESETS,
  documentFieldDefinitionOptionLabel,
  documentFieldDefinitionPresetKey,
  filterDocumentFieldDefinitionsForMappingDropdown,
  resolveDocumentFieldDefinitionSource,
} from "@/lib/document-field-definition-presets"

describe("client field definition presets", () => {
  it("includes contact fields from the client database model", () => {
    expect(CLIENT_FIELD_DEFINITION_PRESETS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Email", dataKey: "Email", category: "Kontakt" }),
        expect.objectContaining({ label: "Telefon", dataKey: "Phone", category: "Kontakt" }),
      ]),
    )
  })

  it("does not include duplicate dataKey and transform pairs", () => {
    const keys = CLIENT_FIELD_DEFINITION_PRESETS.map(documentFieldDefinitionPresetKey)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it("includes all document-safe fields from the Client model", () => {
    expect(CLIENT_FIELD_DEFINITION_PRESETS.map(documentFieldDefinitionPresetKey)).toEqual(
      expect.arrayContaining([
        "Name",
        "Email",
        "Phone",
        "Birthday",
        "KrajPoch",
        "country_name",
        "Adres",
        "CelPobytu",
        "PodLegPob",
        "Status",
        "StatusPla",
        "NumerSprawy",
        "Inspektor",
        "Firma",
        "Doc",
        "Notes",
        "Creator",
        "CreatedDate",
        "TotalSpend",
        "DataZloWnio",
        "DataWydWni",
        "DataOdbKartyPob",
        "DataOdbDecyzji",
        "DataZakLegPob",
        "FormWni",
        "ZalNrJed",
        "KopiaPasz",
        "ZalBlue",
        "CzteZdjecia",
        "Pelnomocnictwo",
      ]),
    )
  })

  it("includes address and uppercase transforms as effective data keys", () => {
    expect(CLIENT_FIELD_DEFINITION_PRESETS.map(documentFieldDefinitionPresetKey)).toEqual(
      expect.arrayContaining([
        "Name|uppercase",
        "Adres|address_street",
        "Adres|address_number",
        "Adres|address_zip",
        "Adres|address_city",
      ]),
    )
  })

  it("builds readable dropdown labels with the effective data key", () => {
    expect(documentFieldDefinitionOptionLabel({
      label: "Miasto",
      dataKey: "Adres",
      transform: "address_city",
    })).toBe("Miasto (Adres|address_city)")
  })

  it("uses client model presets when stored field definitions are empty", () => {
    expect(resolveDocumentFieldDefinitionSource([])).toBe(CLIENT_FIELD_DEFINITION_PRESETS)
  })

  it("uses stored field definitions when they are available", () => {
    const stored = [{ label: "Wlasne", dataKey: "Name", category: "Test" }]
    expect(resolveDocumentFieldDefinitionSource(stored)).toBe(stored)
  })

  it("limits mapping dropdown fields to the requested client fields", () => {
    expect(
      filterDocumentFieldDefinitionsForMappingDropdown(CLIENT_FIELD_DEFINITION_PRESETS)
        .map(documentFieldDefinitionPresetKey),
    ).toEqual([
      "Name",
      "CelPobytu",
      "PodLegPob",
      "Phone",
      "Adres",
      "Email",
      "Birthday",
      "Inspektor",
      "NumerSprawy",
      "Firma",
      "KrajPoch",
      "country_name",
    ])
  })
})
