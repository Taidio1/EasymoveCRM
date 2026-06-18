"use client"

import { type Client } from "@/lib/superbase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePanelEditor } from "@/hooks/use-panel-editor"
import { EditActions } from "@/components/clients/edit-actions"
import { caseDataSchema, validateWith } from "@/lib/client-schema"
import { emptyToNull, toDateInputValue } from "@/lib/client-utils"

interface CaseDataPanelProps {
  client: Client
  onSave: (patch: Partial<Client>) => Promise<void>
}

interface CaseDraft {
  NumerSprawy: string
  PodLegPob: string
  Birthday: string
  DataZloWnio: string
  DataWydWni: string
  DataOdbKartyPob: string
  DataOdbDecyzji: string
  DataZakLegPob: string
}

const TEXT_FIELDS: Array<{ key: "NumerSprawy" | "PodLegPob"; label: string }> = [
  { key: "NumerSprawy", label: "Numer sprawy" },
  { key: "PodLegPob", label: "Podstawa legalnego pobytu" },
]

const DATE_FIELDS: Array<{ key: keyof CaseDraft; label: string }> = [
  { key: "Birthday", label: "Data urodzenia" },
  { key: "DataZloWnio", label: "Data złożenia wniosku" },
  { key: "DataWydWni", label: "Data wydania wniosku" },
  { key: "DataOdbKartyPob", label: "Data odbioru karty pobytu" },
  { key: "DataOdbDecyzji", label: "Data odbioru decyzji" },
  { key: "DataZakLegPob", label: "Data zakończenia legalnego pobytu" },
]

function displayDate(value: string | null | undefined): string {
  const v = toDateInputValue(value)
  if (!v) return "Brak danych"
  return new Date(v).toLocaleDateString("pl-PL")
}

export function CaseDataPanel({ client, onSave }: CaseDataPanelProps) {
  const editor = usePanelEditor<CaseDraft>({
    initial: () => ({
      NumerSprawy: client.NumerSprawy ?? "",
      PodLegPob: client.PodLegPob ?? "",
      Birthday: toDateInputValue(client.Birthday),
      DataZloWnio: toDateInputValue(client.DataZloWnio),
      DataWydWni: toDateInputValue(client.DataWydWni),
      DataOdbKartyPob: toDateInputValue(client.DataOdbKartyPob),
      DataOdbDecyzji: toDateInputValue(client.DataOdbDecyzji),
      DataZakLegPob: toDateInputValue(client.DataZakLegPob),
    }),
    validate: (draft) => validateWith(caseDataSchema, draft),
    toPatch: (draft) => ({
      NumerSprawy: emptyToNull(draft.NumerSprawy),
      PodLegPob: emptyToNull(draft.PodLegPob),
      Birthday: emptyToNull(draft.Birthday),
      DataZloWnio: emptyToNull(draft.DataZloWnio),
      DataWydWni: emptyToNull(draft.DataWydWni),
      DataOdbKartyPob: emptyToNull(draft.DataOdbKartyPob),
      DataOdbDecyzji: emptyToNull(draft.DataOdbDecyzji),
      DataZakLegPob: emptyToNull(draft.DataZakLegPob),
    }),
    onSave,
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Dane sprawy</CardTitle>
        <EditActions
          isEditing={editor.isEditing}
          isSaving={editor.isSaving}
          onEdit={editor.startEdit}
          onSave={editor.submit}
          onCancel={editor.cancel}
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {TEXT_FIELDS.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-1">
            <Label className="text-[10px] text-text-mute uppercase font-semibold tracking-wider">{label}</Label>
            {editor.isEditing ? (
              <Input
                value={editor.draft[key]}
                onChange={(e) => editor.setField(key, e.target.value)}
                className="h-11 md:h-8 text-[13px]"
              />
            ) : (
              <span className="text-[13px] font-medium text-text">{client[key] || "Brak danych"}</span>
            )}
          </div>
        ))}

        {DATE_FIELDS.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-1">
            <Label className="text-[10px] text-text-mute uppercase font-semibold tracking-wider">{label}</Label>
            {editor.isEditing ? (
              <Input
                type="date"
                value={editor.draft[key]}
                onChange={(e) => editor.setField(key, e.target.value)}
                className="h-11 md:h-8 text-[13px]"
              />
            ) : (
              <span className="text-[13px] font-medium text-text">{displayDate(client[key as keyof Client] as string | null)}</span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
