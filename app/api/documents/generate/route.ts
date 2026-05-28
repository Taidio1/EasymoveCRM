import { NextRequest, NextResponse } from "next/server"
import { generateDocument } from "@/lib/document-generator"
import { getClients } from "@/lib/superbase"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { templateId, clientId } = body as { templateId: string; clientId: string }

  if (!templateId || !clientId) {
    return NextResponse.json({ error: "templateId and clientId are required" }, { status: 400 })
  }

  const clients = await getClients()
  const client = clients.find((c) => c.id === clientId)

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 })
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
      "Content-Disposition": `attachment; filename="${templateId}-${clientId}.pdf"`,
    },
  })
}
