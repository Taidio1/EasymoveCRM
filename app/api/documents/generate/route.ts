import { NextRequest, NextResponse } from "next/server"
import { generateDocument } from "@/lib/document-generator"
import type { Client } from "@/lib/superbase"
import type { FieldOverride } from "@/lib/document-types"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { templateId, client, overrides } = body as {
    templateId: string
    client?: Client | null
    overrides?: FieldOverride[]
  }

  if (!templateId || (!client && !overrides)) {
    return NextResponse.json(
      { error: "templateId and (client or overrides) are required" },
      { status: 400 },
    )
  }

  let pdfBytes: Uint8Array
  try {
    pdfBytes = await generateDocument(templateId, client ?? null, overrides)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: `Generation failed: ${message}` }, { status: 500 })
  }

  const namePart = client?.id ?? "reczne"
  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${templateId}-${namePart}.pdf"`,
    },
  })
}
