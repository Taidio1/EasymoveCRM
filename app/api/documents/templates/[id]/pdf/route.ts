import { NextResponse } from "next/server"
import { downloadDocumentTemplatePdf } from "@/lib/document-template-storage"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const pdfBytes = await downloadDocumentTemplatePdf(id)
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${id}.pdf"`,
        "Cache-Control": "private, max-age=60",
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    const status = message.toLowerCase().includes("not found") ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
