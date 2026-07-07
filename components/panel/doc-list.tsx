"use client"

import { useEffect, useRef, useState } from "react"
import type { Client } from "@/lib/superbase"
import { REQUIRED_DOCS } from "@/lib/panel/required-docs"
import {
  listMyUploads, listOfficeDocs, uploadMyDocument, getSignedUrl, type PanelFile,
} from "@/lib/panel/documents"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { Check, Upload, Download, Loader2 } from "lucide-react"

export function DocList({ client }: { client: Client }) {
  const [uploads, setUploads] = useState<PanelFile[]>([])
  const [office, setOffice] = useState<PanelFile[]>([])
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const refresh = async () => {
    setUploads(await listMyUploads(client.id))
    setOffice(await listOfficeDocs(client.id))
  }
  useEffect(() => { refresh() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    const ok = await uploadMyDocument(client.id, file)
    setBusy(false)
    if (fileRef.current) fileRef.current.value = ""
    if (ok) { toast({ title: "Wgrano plik" }); refresh() }
    else toast({ title: "Błąd", description: "Nie udało się wgrać pliku.", variant: "destructive" })
  }

  const open = async (path: string) => {
    const url = await getSignedUrl(path)
    if (url) window.open(url, "_blank")
    else toast({ title: "Błąd", description: "Nie udało się otworzyć pliku.", variant: "destructive" })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dokumenty</h1>

      <section className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-text-mute">Wymagane od Ciebie</p>
        {REQUIRED_DOCS.map((doc) => {
          const confirmed = Boolean(client[doc.key])
          return (
            <div key={doc.key} className="flex items-center gap-2 bg-surface border border-border rounded-lg p-2.5">
              <span className={confirmed ? "text-emerald-500" : "text-text-mute"}>
                {confirmed ? <Check size={16} /> : <Upload size={16} />}
              </span>
              <span className="text-sm flex-1">{doc.label}</span>
              <span className="text-[11px] text-text-mute">{confirmed ? "potwierdzony" : "do dostarczenia"}</span>
            </div>
          )
        })}

        <input ref={fileRef} type="file" className="hidden" onChange={onPick}
          accept="application/pdf,image/*" />
        <Button variant="outline" className="w-full" disabled={busy}
          onClick={() => fileRef.current?.click()}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Wgraj dokument
        </Button>

        {uploads.length > 0 && (
          <div className="pt-1 space-y-1.5">
            <p className="text-[11px] text-text-mute">Twoje wgrane pliki:</p>
            {uploads.map((f) => (
              <button key={f.path} onClick={() => open(f.path)}
                className="w-full text-left text-sm flex items-center gap-2 p-2 rounded-md hover:bg-surface">
                <Download size={14} className="text-text-mute" />{f.name}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-text-mute">Od biura — do pobrania</p>
        {office.length === 0
          ? <p className="text-sm text-text-mute">Brak dokumentów od biura.</p>
          : office.map((f) => (
            <button key={f.path} onClick={() => open(f.path)}
              className="w-full text-left flex items-center gap-2 bg-surface border border-border rounded-lg p-2.5">
              <Download size={16} className="text-text-mute" />
              <span className="text-sm flex-1">{f.name}</span>
            </button>
          ))}
      </section>
    </div>
  )
}
