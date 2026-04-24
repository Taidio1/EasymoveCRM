import { type Client } from "@/lib/superbase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, AlertCircle } from "lucide-react"

interface DocsChecklistPanelProps {
  client: Client
}

export function DocsChecklistPanel({ client }: DocsChecklistPanelProps) {
  const documents = [
    { label: "Formularz wniosku", value: client.FormWni },
    { label: "Załącznik nr 1", value: client.ZalNrJed },
    { label: "Kopia paszportu", value: client.KopiaPasz },
    { label: "Załącznik niebieski", value: client.ZalBlue },
    { label: "4 zdjęcia", value: client.CzteZdjecia },
    { label: "Pełnomocnictwo", value: client.Pelnomocnictwo },
  ]

  const completedCount = documents.filter(d => d.value).length
  const totalCount = documents.length

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Dokumenty</CardTitle>
        <span className="text-xs font-semibold text-text-mute">{completedCount}/{totalCount}</span>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {documents.map((doc, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-text">{doc.label}</span>
            {doc.value ? (
              <CheckCircle2 className="w-4 h-4 text-success" />
            ) : (
              <AlertCircle className="w-4 h-4 text-warn" />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
