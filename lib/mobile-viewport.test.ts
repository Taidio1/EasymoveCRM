import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const root = process.cwd()

describe("mobile form viewport behavior", () => {
  it("keeps focused form controls at iOS-safe font size on touch devices", () => {
    const css = readFileSync(resolve(root, "app/globals.css"), "utf8")

    expect(css).toContain("@media (hover: none) and (pointer: coarse)")
    expect(css).toContain("input:not([type=\"button\"])")
    expect(css).toContain("select")
    expect(css).toContain("textarea")
    expect(css).toContain("font-size: 16px !important")
  })

  it("does not autofocus the add-client name field on small mobile screens", () => {
    const wizard = readFileSync(resolve(root, "components/add-client-wizard.tsx"), "utf8")

    expect(wizard).toContain("autoFocus={!isSmallMobile}")
  })

  it("hides add-client step labels on small mobile screens", () => {
    const wizard = readFileSync(resolve(root, "components/add-client-wizard.tsx"), "utf8")

    expect(wizard).toContain("isSmallMobile || isXSmall ? \"hidden\" : \"block\"")
  })
})
