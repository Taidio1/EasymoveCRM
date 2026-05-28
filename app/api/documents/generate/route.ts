import { NextRequest, NextResponse } from "next/server"
import { generateDocument } from "@/lib/document-generator"
import type { Client } from "@/lib/superbase"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { templateId, client } = body as { templateId: string; client: Client }

  if (!templateId || !client) {
    return NextResponse.json({ error: "templateId and client are required" }, { status: 400 })
  }

  let pdfBytes: Uint8Array
  try {
    pdfBytes = await generateDocument(templateId, client)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: `Generation failed: ${message}` }, { status: 500 })
  }

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${templateId}-${client.id}.pdf"`,
    },
  })
}
