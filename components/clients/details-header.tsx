"use client"

import { ArrowLeft, Mail, Phone, Plus, UserPlus, Loader2, Copy, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Client, supabase } from "@/lib/superbase"
import { getInitials, getFlagEmoji, emptyToNull } from "@/lib/client-utils"
import { usePanelEditor } from "@/hooks/use-panel-editor"
import { EditActions } from "@/components/clients/edit-actions"
import { RoleGuard } from "@/components/role-guard"
import { toast } from "@/hooks/use-toast"
import { headerSchema, validateWith } from "@/lib/client-schema"

interface InviteResult {
  email: string
  password: string
  emailed: boolean
}

interface DetailsHeaderProps {
  client: Client
  onSave: (patch: Partial<Client>) => Promise<void>
}

interface HeaderDraft {
  Name: string
  Status: string
  CelPobytu: string
  KrajPoch: string
}

export function DetailsHeader({ client, onSave }: DetailsHeaderProps) {
  const router = useRouter()
  const [inviting, setInviting] = useState(false)
  const [result, setResult] = useState<InviteResult | null>(null)
  const [copied, setCopied] = useState(false)

  const invite = async () => {
    setInviting(true)
    try {
      const { data } = await supabase.auth.getSession()
      const res = await fetch("/api/panel/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ clientId: client.id }),
      })
      const body = await res.json().catch(() => ({}))
      if (res.ok && body.password) {
        setCopied(false)
        setResult({ email: body.email, password: body.password, emailed: Boolean(body.emailed) })
      } else {
        toast({
          title: "Błąd",
          description: body.error ?? `Nie udało się zaprosić klienta (HTTP ${res.status}).`,
          variant: "destructive",
        })
      }
    } catch (e) {
      toast({
        title: "Błąd",
        description: e instanceof Error ? e.message : "Nie udało się zaprosić klienta.",
        variant: "destructive",
      })
    } finally {
      setInviting(false)
    }
  }

  const copyCreds = async () => {
    if (!result) return
    await navigator.clipboard.writeText(`Login: ${result.email}\nHasło: ${result.password}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const editor = usePanelEditor<HeaderDraft>({
    initial: () => ({
      Name: client.Name ?? "",
      Status: client.Status ?? "",
      CelPobytu: client.CelPobytu ?? "",
      KrajPoch: client.KrajPoch ?? "",
    }),
    validate: (draft) => validateWith(headerSchema, draft),
    toPatch: (draft) => ({
      Name: draft.Name.trim(),
      Status: draft.Status.trim(),
      CelPobytu: emptyToNull(draft.CelPobytu),
      KrajPoch: emptyToNull(draft.KrajPoch),
    }),
    onSave,
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 -ml-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-text-dim hover:text-text h-8 px-2 flex items-center gap-1.5"
          onClick={() => router.push("/clients")}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-[13px] font-medium">Powrót</span>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-[44px] h-[44px] rounded-full bg-gradient-to-br from-brand to-brand-deep flex items-center justify-center text-white font-semibold text-sm shrink-0 shadow-sm">
            {getInitials(client.Name)}
          </div>

          {editor.isEditing ? (
            <div className="flex flex-col gap-2 flex-1 w-full md:flex-none md:min-w-[280px]">
              <div className="flex flex-col gap-1">
                <Input
                  value={editor.draft.Name}
                  onChange={(e) => editor.setField("Name", e.target.value)}
                  className="h-11 md:h-9 text-lg font-bold"
                  placeholder="Imię i nazwisko"
                />
                {editor.errors.Name && <span className="text-[11px] text-danger">{editor.errors.Name}</span>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <Input value={editor.draft.Status} onChange={(e) => editor.setField("Status", e.target.value)} className="h-11 md:h-8 text-xs" placeholder="Status" />
                  {editor.errors.Status && <span className="text-[11px] text-danger">{editor.errors.Status}</span>}
                </div>
                <Input value={editor.draft.CelPobytu} onChange={(e) => editor.setField("CelPobytu", e.target.value)} className="h-11 md:h-8 text-xs" placeholder="Cel pobytu" />
                <Input value={editor.draft.KrajPoch} onChange={(e) => editor.setField("KrajPoch", e.target.value)} className="h-11 md:h-8 text-xs" placeholder="Kraj pochodzenia" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-text leading-none">{client.Name}</h1>
                <span className="text-xl leading-none" title={client.KrajPoch || "Nieznany"}>
                  {getFlagEmoji(client.KrajPoch || client.country_name)}
                </span>
                <Badge variant="outline" className="uppercase text-[10px] font-bold px-1.5 py-0 h-5 border-brand/20 text-brand bg-brand-soft tracking-wider rounded-pill">
                  {client.Status}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs-plus text-text-dim">
                <span className="font-mono text-text-mute tracking-tight">ID: {String(client.id).substring(0, 8)}</span>
                <span className="w-1 h-1 rounded-full bg-border-strong shrink-0" />
                <span className="font-medium text-text-dim">{client.CelPobytu || "Brak typu"}</span>
                <span className="w-1 h-1 rounded-full bg-border-strong shrink-0" />
                <span className="text-text-dim">{client.KrajPoch || client.country_name || "Brak kraju"}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-2 md:mt-0">
          <EditActions
            isEditing={editor.isEditing}
            isSaving={editor.isSaving}
            onEdit={editor.startEdit}
            onSave={editor.submit}
            onCancel={editor.cancel}
          />
          {!editor.isEditing && (
            <>
              <RoleGuard allowedRoles={["Admin", "Boss"]}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-4 text-[13px] font-medium border-border-strong hover:bg-surface-hover text-text-dim hover:text-text"
                  onClick={invite}
                  disabled={inviting}
                >
                  {inviting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  {client.portal_enabled ? "Ponów zaproszenie" : "Zaproś do panelu"}
                </Button>
              </RoleGuard>
              <Button variant="outline" size="sm" className="h-9 px-4 text-[13px] font-medium border-border-strong hover:bg-surface-hover text-text-dim hover:text-text">
                <Mail className="mr-2 h-4 w-4" />
                E-mail
              </Button>
              <Button variant="outline" size="sm" className="h-9 px-4 text-[13px] font-medium border-border-strong hover:bg-surface-hover text-text-dim hover:text-text">
                <Phone className="mr-2 h-4 w-4" />
                Zadzwoń
              </Button>
              <Button size="sm" className="h-9 px-4 text-[13px] font-semibold bg-brand hover:bg-brand-hover text-white shadow-btn-primary border-none rounded-btn">
                <Plus className="mr-2 h-4 w-4" />
                Nowa akcja
              </Button>
            </>
          )}
        </div>
      </div>

      <Dialog open={!!result} onOpenChange={(o) => !o && setResult(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Dane logowania do panelu</DialogTitle>
            <DialogDescription>
              Przekaż je klientowi. Hasło jest tymczasowe — klient może je zmienić po zalogowaniu na <strong>/login</strong>.
              {result?.emailed
                ? " Wysłano je również na e-mail administratora."
                : " (E-mail administratora nieskonfigurowany — skopiuj dane poniżej.)"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3 text-[13px]">
            <div className="flex justify-between gap-3">
              <span className="text-text-mute">Login</span>
              <span className="font-mono font-medium break-all text-right">{result?.email}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-text-mute">Hasło</span>
              <span className="font-mono font-medium break-all text-right">{result?.password}</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={copyCreds} className="w-full sm:w-auto">
              {copied ? <Check className="mr-2 h-4 w-4 text-success" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Skopiowano" : "Kopiuj login i hasło"}
            </Button>
            <Button onClick={() => setResult(null)} className="w-full sm:w-auto">Gotowe</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
