"use client"

import { type Client } from "@/lib/superbase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePanelEditor } from "@/hooks/use-panel-editor"
import { EditActions } from "@/components/clients/edit-actions"
import { emptyToNull } from "@/lib/client-utils"

interface FinancesPanelProps {
  client: Client
  onSave: (patch: Partial<Client>) => Promise<void>
}

interface FinancesDraft {
  TotalSpend: string
  StatusPla: string
}

export function FinancesPanel({ client, onSave }: FinancesPanelProps) {
  const editor = usePanelEditor<FinancesDraft>({
    initial: () => ({
      TotalSpend: client.TotalSpend ?? "",
      StatusPla: client.StatusPla ?? "",
    }),
    toPatch: (draft) => ({
      TotalSpend: emptyToNull(draft.TotalSpend),
      StatusPla: emptyToNull(draft.StatusPla),
    }),
    onSave,
  })

  const totalSpendStr = client.TotalSpend?.replace(/[^\d.-]/g, "") || "0"
  const total = parseFloat(totalSpendStr) || 0

  let paid = 0
  const statusLower = client.StatusPla?.toLowerCase() ?? ""
  if (statusLower.includes("opłacon") || statusLower.includes("zapłacon")) {
    paid = total
  } else if (statusLower.includes("zaliczka")) {
    paid = total * 0.5
  }

  const remaining = total - paid
  const percentage = total > 0 ? Math.round((paid / total) * 100) : 0
  const isPaid = statusLower.includes("opłacon") || statusLower.includes("zapłacon")

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Finanse</CardTitle>
        <EditActions
          isEditing={editor.isEditing}
          isSaving={editor.isSaving}
          onEdit={editor.startEdit}
          onSave={editor.submit}
          onCancel={editor.cancel}
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {editor.isEditing ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] text-text-mute uppercase font-semibold tracking-wider">Wartość całkowita (PLN)</Label>
              <Input
                value={editor.draft.TotalSpend}
                onChange={(e) => editor.setField("TotalSpend", e.target.value)}
                className="h-11 md:h-8 text-[13px]"
                placeholder="np. 1500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] text-text-mute uppercase font-semibold tracking-wider">Status płatności</Label>
              <Input
                value={editor.draft.StatusPla}
                onChange={(e) => editor.setField("StatusPla", e.target.value)}
                className="h-11 md:h-8 text-[13px]"
                placeholder="np. Opłacone / Zaliczka"
              />
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-text-mute">Status</span>
                {client.StatusPla ? (
                  <Badge variant={isPaid ? "success" : "warn"}>{client.StatusPla}</Badge>
                ) : (
                  <span className="font-semibold text-text">Brak danych</span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-text-mute">Opłacono {percentage}%</span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-border">
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-text-mute">Wartość całkowita</span>
                <span className="font-semibold text-text">{total.toLocaleString("pl-PL", { style: "currency", currency: "PLN" })}</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-text-mute">Zapłacono</span>
                <span className="font-semibold text-success">{paid.toLocaleString("pl-PL", { style: "currency", currency: "PLN" })}</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-text-mute">Pozostało</span>
                <span className="font-semibold text-text">{remaining.toLocaleString("pl-PL", { style: "currency", currency: "PLN" })}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
