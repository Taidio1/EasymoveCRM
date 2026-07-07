import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { getUserFromRequest } from "@/lib/api-auth"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user?.email) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 })

    const { message } = await request.json()
    if (!message || String(message).trim().length < 5) {
      return NextResponse.json({ error: "Wiadomość zbyt krótka" }, { status: 400 })
    }

    const { data: client } = await getSupabaseAdmin()
      .from("clients").select('"Name","NumerSprawy"').ilike("Email", user.email)
      .eq("portal_enabled", true).maybeSingle()

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
    })

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      replyTo: user.email,
      subject: `[Panel klienta] Zapytanie — ${client?.Name ?? user.email}`,
      html: `
        <h2>Nowe zapytanie z panelu klienta</h2>
        <p><strong>Klient:</strong> ${client?.Name ?? "—"} (${user.email})</p>
        <p><strong>Numer sprawy:</strong> ${client?.NumerSprawy ?? "—"}</p>
        <p><strong>Wiadomość:</strong></p>
        <p>${String(message).replace(/</g, "&lt;")}</p>`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("inquiry:", error)
    return NextResponse.json({ error: "Błąd wysyłki zapytania" }, { status: 500 })
  }
}
