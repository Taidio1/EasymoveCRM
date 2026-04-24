import { type Client } from "@/lib/superbase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Phone, MapPin, Building2, UserCircle } from "lucide-react"

interface ContactPanelProps {
  client: Client
}

export function ContactPanel({ client }: ContactPanelProps) {
  const contacts = [
    { label: "E-mail", value: client.Email, icon: Mail },
    { label: "Telefon", value: client.Phone, icon: Phone },
    { label: "Adres", value: client.Adres, icon: MapPin },
    { label: "Firma", value: client.Firma, icon: Building2 },
    { label: "Inspektor", value: client.Inspektor, icon: UserCircle },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kontakt</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {contacts.map((contact, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="mt-0.5 text-text-mute">
              <contact.icon className="w-4 h-4" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-text-mute uppercase font-semibold tracking-wider">{contact.label}</span>
              <span className="text-[13px] font-medium text-text">{contact.value || "Brak danych"}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
