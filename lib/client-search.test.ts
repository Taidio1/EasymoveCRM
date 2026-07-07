import { describe, expect, it } from "vitest"
import { filterClientsForDocumentPreview } from "@/lib/client-search"
import type { Client } from "@/lib/superbase"

const baseClient: Client = {
  id: "1",
  Name: "Anna Kowalska",
  Status: "W trakcie",
  CelPobytu: null,
  PodLegPob: null,
  KrajPoch: null,
  Phone: null,
  Adres: null,
  StatusPla: null,
  DataZloWnio: null,
  Email: null,
  Birthday: null,
  Notes: null,
  Creator: null,
  CreatedDate: null,
  TotalSpend: null,
  Doc: null,
  NumerSprawy: null,
  Inspektor: null,
  DataWydWni: null,
  DataOdbKartyPob: null,
  DataOdbDecyzji: null,
  DataZakLegPob: null,
  Firma: null,
  FormWni: null,
  ZalNrJed: null,
  KopiaPasz: null,
  ZalBlue: null,
  CzteZdjecia: null,
  Pelnomocnictwo: null,
  country_id: null,
  country_name: null,
  portal_enabled: false,
  auth_user_id: null,
  stage: 1,
}

describe("filterClientsForDocumentPreview", () => {
  it("returns every client when query is empty", () => {
    const clients = [
      baseClient,
      { ...baseClient, id: "2", Name: "Piotr Nowak" },
    ]

    expect(filterClientsForDocumentPreview(clients, " ")).toEqual(clients)
  })

  it("matches by name, email, phone, case number and company", () => {
    const clients = [
      {
        ...baseClient,
        id: "1",
        Name: "Anna Kowalska",
        Email: "anna@example.com",
        Phone: "500123456",
        NumerSprawy: "EM-2026-14",
        Firma: "Easy Move",
      },
      {
        ...baseClient,
        id: "2",
        Name: "Piotr Nowak",
        Email: "piotr@example.com",
        Phone: "600111222",
        NumerSprawy: "EM-2026-15",
        Firma: "Other",
      },
    ]

    expect(filterClientsForDocumentPreview(clients, "kowalska")).toEqual([clients[0]])
    expect(filterClientsForDocumentPreview(clients, "ANNA@EXAMPLE")).toEqual([clients[0]])
    expect(filterClientsForDocumentPreview(clients, "500123")).toEqual([clients[0]])
    expect(filterClientsForDocumentPreview(clients, "2026-14")).toEqual([clients[0]])
    expect(filterClientsForDocumentPreview(clients, "easy move")).toEqual([clients[0]])
  })
})
