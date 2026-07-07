"use client"

import { useRef, useState } from "react"
import { type Client, uploadOfficeDocument } from "@/lib/superbase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertCircle, Upload, Loader2 } from "lucide-react"
import { usePanelEditor } from "@/hooks/use-panel-editor"
import { EditActions } from "@/components/clients/edit-actions"
import { toast } from "@/hooks/use-toast"
import { isYes } from "@/lib/client-utils"

interface DocsChecklistPanelProps {
  client: Client
  onSave: (patch: Partial<Client>) => Promise<void>
}

type DocKey = "FormWni" | "ZalNrJed" | "KopiaPasz" | "ZalBlue" | "CzteZdjecia" | "Pelnomocnictwo"

const DOCS: Array<{ key: DocKey; label: string }> = [
  { key: "FormWni", label: "Formularz wniosku" },
  { key: "ZalNrJed", label: "Załącznik nr 1" },
  { key: "KopiaPasz", label: "Kopia paszportu" },
  { key: "ZalBlue", label: "Załącznik niebieski" },
  { key: "CzteZdjecia", label: "4 zdjęcia" },
  { key: "Pelnomocnictwo", label: "Pełnomocnictwo" },
]

type DocsDraft = Record<DocKey, boolean>

export function DocsChecklistPanel({ client, onSave }: DocsChecklistPanelProps) {
  const editor = usePanelEditor<DocsDraft>({
    initial: () => ({
      FormWni: isYes(client.FormWni),
      ZalNrJed: isYes(client.ZalNrJed),
      KopiaPasz: isYes(client.KopiaPasz),
      ZalBlue: isYes(client.ZalBlue),
      CzteZdjecia: isYes(client.CzteZdjecia),
      Pelnomocnictwo: isYes(client.Pelnomocnictwo),
    }),
    toPatch: (draft) => ({ ...draft }),
    onSave,
  })

  const completedCount = DOCS.filter((d) => isYes(client[d.key])).length

  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const onPickOffice = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ok = await uploadOfficeDocument(client.id, file)
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ""
    toast(ok
      ? { title: "Udostępniono", description: "Plik jest widoczny dla klienta w panelu." }
      : { title: "Błąd", description: "Nie udało się udostępnić pliku.", variant: "destructive" })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Dokumenty</CardTitle>
        <div className="flex items-center gap-2">
          {!editor.isEditing && (
            <span className="text-xs font-semibold text-text-mute">{completedCount}/{DOCS.length}</span>
          )}
          <EditActions
            isEditing={editor.isEditing}
            isSaving={editor.isSaving}
            onEdit={editor.startEdit}
            onSave={editor.submit}
            onCancel={editor.cancel}
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 md:gap-3">
        {DOCS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between py-2 md:py-0">
            <span className="text-[13px] font-medium text-text">{label}</span>
            {editor.isEditing ? (
              <Checkbox
                checked={editor.draft[key]}
                onCheckedChange={(value) => editor.setField(key, value === true)}
                className="h-6 w-6 md:h-4 md:w-4 [&_svg]:h-5 [&_svg]:w-5 md:[&_svg]:h-4 md:[&_svg]:w-4"
              />
            ) : isYes(client[key]) ? (
              <CheckCircle2 className="w-4 h-4 text-success" />
            ) : (
              <AlertCircle className="w-4 h-4 text-warn" />
            )}
          </div>
        ))}

        <div className="mt-2 pt-3 border-t border-border/60">
          <input ref={fileRef} type="file" className="hidden" onChange={onPickOffice}
            accept="application/pdf,image/*" />
          <Button variant="outline" size="sm" className="w-full h-9 text-[13px]"
            disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Udostępnij dokument klientowi
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
