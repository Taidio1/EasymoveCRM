import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import nodemailer from "nodemailer"
import { getUserFromRequest, assertStaff } from "@/lib/api-auth"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

// Generuje czytelne, w miarę mocne hasło tymczasowe (bez znaków mylących).
function generatePassword(): string {
  const raw = randomBytes(12).toString("base64").replace(/[+/=il1O0]/g, "")
  return `Em-${raw.slice(0, 10)}`
}

// Znajduje użytkownika Auth po e-mailu (przeszukuje strony listy).
async function findAuthUserByEmail(email: string) {
  const admin = getSupabaseAdmin()
  const target = email.toLowerCase()
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error || !data?.users?.length) return null
    const found = data.users.find((u) => u.email?.toLowerCase() === target)
    if (found) return found
    if (data.users.length < 200) return null
  }
  return null
}

export async function POST(request: Request) {
  try {
    const caller = await getUserFromRequest(request)
    if (!caller) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 })
    await assertStaff(caller.id)

    const { clientId } = await request.json()
    if (!clientId) return NextResponse.json({ error: "Brak clientId" }, { status: 400 })

    const admin = getSupabaseAdmin()
    const { data: client, error: cErr } = await admin
      .from("clients").select('id,"Email","Name","NumerSprawy"').eq("id", clientId).maybeSingle()
    if (cErr || !client) return NextResponse.json({ error: "Nie znaleziono klienta" }, { status: 404 })
    if (!client.Email) return NextResponse.json({ error: "Klient nie ma adresu e-mail" }, { status: 400 })

    const email = client.Email
    const password = generatePassword()

    // Utwórz konto z hasłem (od razu potwierdzone, by klient mógł się zalogować).
    const { error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "Client" },
    })

    // Jeśli konto już istnieje — zresetuj hasło i upewnij się, że rola = Client.
    if (createErr) {
      if (/already.*registered|already.*been|exists|duplicate/i.test(createErr.message)) {
        const existing = await findAuthUserByEmail(email)
        if (!existing) {
          return NextResponse.json({ error: "Konto istnieje, ale nie udało się go odnaleźć" }, { status: 500 })
        }
        const { error: updErr } = await admin.auth.admin.updateUserById(existing.id, {
          password,
          email_confirm: true,
          user_metadata: { ...(existing.user_metadata ?? {}), role: "Client" },
        })
        if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })
      } else {
        return NextResponse.json({ error: createErr.message }, { status: 500 })
      }
    }

    // Włącz dostęp do panelu dla tego wiersza.
    const { error: upErr } = await admin
      .from("clients").update({ portal_enabled: true }).eq("id", clientId)
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    // Wyślij dane logowania na adres admina (przez istniejący nodemailer).
    let emailed = false
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD && process.env.ADMIN_EMAIL) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
        })
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: process.env.ADMIN_EMAIL,
          subject: `[Panel klienta] Dane logowania — ${client.Name ?? email}`,
          html: `
            <h2>Dostęp do panelu klienta utworzony</h2>
            <p>Przekaż poniższe dane klientowi <strong>${client.Name ?? "—"}</strong>
               (sprawa ${client.NumerSprawy ?? "—"}). Logowanie na stronie <strong>/login</strong>.</p>
            <p><strong>Login (e-mail):</strong> ${email}</p>
            <p><strong>Hasło tymczasowe:</strong> ${password}</p>
            <p style="color:#888">Klient może zmienić hasło po zalogowaniu. Hasło traktuj poufnie.</p>`,
        })
        emailed = true
      }
    } catch (mailErr) {
      console.error("invite mail:", mailErr) // brak maila nie blokuje — hasło wraca w odpowiedzi
    }

    return NextResponse.json({ success: true, email, password, emailed })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Błąd zaproszenia"
    const status = /uprawnień/.test(msg) ? 403 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
