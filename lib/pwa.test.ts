import { describe, expect, it } from "vitest"
import { pwaManifest } from "@/lib/pwa"

describe("pwaManifest", () => {
  it("contains the installability fields required by mobile browsers", () => {
    expect(pwaManifest.name).toBe("Easy Move CRM")
    expect(pwaManifest.short_name).toBe("Easy Move")
    expect(pwaManifest.start_url).toBe("/")
    expect(pwaManifest.scope).toBe("/")
    expect(pwaManifest.display).toBe("standalone")
    expect(pwaManifest.prefer_related_applications).toBe(false)
  })

  it("provides 192px and 512px maskable icons", () => {
    const iconSizes = pwaManifest.icons.map((icon) => icon.sizes)
    const purposesBySize = new Map(
      pwaManifest.icons.map((icon) => [icon.sizes, icon.purpose]),
    )

    expect(iconSizes).toContain("192x192")
    expect(iconSizes).toContain("512x512")
    expect(purposesBySize.get("192x192")).toContain("maskable")
    expect(purposesBySize.get("512x512")).toContain("maskable")
  })
})
