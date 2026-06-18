"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Client } from "@/lib/superbase"
import { User, MessageSquare } from "lucide-react"
import { usePanelEditor } from "@/hooks/use-panel-editor"
import { EditActions } from "@/components/clients/edit-actions"
import { emptyToNull } from "@/lib/client-utils"

interface NotesPanelProps {
  client: Client
  onSave: (patch: Partial<Client>) => Promise<void>
}

interface NotesDraft {
  Notes: string
}

export function NotesPanel({ client, onSave }: NotesPanelProps) {
  const editor = usePanelEditor<NotesDraft>({
    initial: () => ({ Notes: client.Notes ?? "" }),
    toPatch: (draft) => ({ Notes: emptyToNull(draft.Notes) }),
    onSave,
  })

  const author = client.Creator || "System"
  const date = client.CreatedDate ? new Date(client.CreatedDate).toLocaleDateString("pl-PL") : "Początek"

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-6 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-bold uppercase tracking-widest text-text-mute flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Notatki
        </CardTitle>
        <EditActions
          isEditing={editor.isEditing}
          isSaving={editor.isSaving}
          onEdit={editor.startEdit}
          onSave={editor.submit}
          onCancel={editor.cancel}
        />
      </CardHeader>
      <CardContent className="px-0 flex flex-col gap-6">
        {editor.isEditing ? (
          <Textarea
            placeholder="Notatka dotycząca klienta..."
            className="min-h-[140px] resize-none border-border-strong focus-visible:ring-brand/30 bg-surface/20 rounded-card text-sm p-4"
            value={editor.draft.Notes}
            onChange={(e) => editor.setField("Notes", e.target.value)}
          />
        ) : client.Notes ? (
          <div className="p-4 rounded-card border border-border bg-surface/30 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center">
                <User className="h-3 w-3 text-brand" />
              </div>
              <span className="text-xs font-semibold text-text">{author}</span>
              <span className="text-[10px] text-text-mute font-mono uppercase">{date}</span>
            </div>
            <p className="text-sm text-text-dim leading-relaxed whitespace-pre-wrap">{client.Notes}</p>
          </div>
        ) : (
          <p className="text-sm text-text-mute italic px-2">Brak notatek dla tego klienta.</p>
        )}
      </CardContent>
    </Card>
  )
}
