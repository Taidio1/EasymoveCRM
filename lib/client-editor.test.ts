import { describe, expect, it } from "vitest"
import { diffClientPatch } from "@/lib/client-editor"
import type { Client } from "@/lib/superbase"

const original = { id: "1", Name: "Anna", Email: "a@b.pl", Phone: null, FormWni: false } as unknown as Client

describe("diffClientPatch", () => {
  it("zwraca tylko zmienione pola", () => {
    const patch = diffClientPatch(original, { Email: "nowy@b.pl", Phone: null })
    expect(patch).toEqual({ Email: "nowy@b.pl" })
  })
  it("zwraca pusty obiekt gdy nic się nie zmieniło", () => {
    const patch = diffClientPatch(original, { Email: "a@b.pl", Phone: null })
    expect(patch).toEqual({})
  })
  it("wykrywa zmianę boolean", () => {
    const patch = diffClientPatch(original, { FormWni: true })
    expect(patch).toEqual({ FormWni: true })
  })
})
