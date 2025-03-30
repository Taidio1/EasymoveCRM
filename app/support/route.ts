import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, topic, message } = body

    // Konfiguracja transportera maili
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })

    // Przygotowanie wiadomości
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL, // Twój adres email
      subject: `[${topic}] ${title}`,
      text: message,
      html: `
        <h2>Nowy ticket wsparcia</h2>
        <p><strong>Temat:</strong> ${topic}</p>
        <p><strong>Tytuł:</strong> ${title}</p>
        <p><strong>Wiadomość:</strong></p>
        <p>${message}</p>
      `,
    }

    // Wysłanie maila
    await transporter.sendMail(mailOptions)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Błąd podczas wysyłania maila:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas wysyłania ticketu" },
      { status: 500 }
    )
  }
} 