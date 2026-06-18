"use client"

import { type Client } from "@/lib/superbase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Mail, Phone, MapPin, Building2, UserCircle } from "lucide-react"
import { usePanelEditor } from "@/hooks/use-panel-editor"
import { EditActions } from "@/components/clients/edit-actions"
import { contactSchema, validateWith } from "@/lib/client-schema"
import { emptyToNull } from "@/lib/client-utils"

interface ContactPanelProps {
  client: Client
  onSave: (patch: Partial<Client>) => Promise<void>
}

interface ContactDraft {
  Email: string
  Phone: string
  Adres: string
  Firma: string
  Inspektor: string
}

const FIELDS: Array<{ key: keyof ContactDraft; label: string; icon: typeof Mail; type?: string }> = [
  { key: "Email", label: "E-mail", icon: Mail, type: "email" },
  { key: "Phone", label: "Telefon", icon: Phone },
  { key: "Adres", label: "Adres", icon: MapPin },
  { key: "Firma", label: "Firma", icon: Building2 },
  { key: "Inspektor", label: "Inspektor", icon: UserCircle },
]

export function ContactPanel({ client, onSave }: ContactPanelProps) {
  const editor = usePanelEditor<ContactDraft>({
    initial: () => ({
      Email: client.Email ?? "",
      Phone: client.Phone ?? "",
      Adres: client.Adres ?? "",
      Firma: client.Firma ?? "",
      Inspektor: client.Inspektor ?? "",
    }),
    validate: (draft) => validateWith(contactSchema, draft),
    toPatch: (draft) => ({
      Email: emptyToNull(draft.Email),
      Phone: emptyToNull(draft.Phone),
      Adres: emptyToNull(draft.Adres),
      Firma: emptyToNull(draft.Firma),
      Inspektor: emptyToNull(draft.Inspektor),
    }),
    onSave,
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Kontakt</CardTitle>
        <EditActions
          isEditing={editor.isEditing}
          isSaving={editor.isSaving}
          onEdit={editor.startEdit}
          onSave={editor.submit}
          onCancel={editor.cancel}
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {FIELDS.map(({ key, label, icon: Icon, type }) => (
          <div key={key} className="flex items-start gap-3">
            <div className="mt-0.5 text-text-mute">
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex flex-col gap-0.5 flex-1">
              <span className="text-[10px] text-text-mute uppercase font-semibold tracking-wider">{label}</span>
              {editor.isEditing ? (
                <div className="flex flex-col gap-1">
                  <Input
                    type={type ?? "text"}
                    value={editor.draft[key]}
                    onChange={(e) => editor.setField(key, e.target.value)}
                    className="h-11 md:h-8 text-[13px]"
                  />
                  {editor.errors[key] && (
                    <span className="text-[11px] text-danger">{editor.errors[key]}</span>
                  )}
                </div>
              ) : (
                <span className="text-[13px] font-medium text-text">{client[key] || "Brak danych"}</span>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
