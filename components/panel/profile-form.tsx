"use client"

import { useState } from "react"
import type { Client } from "@/lib/superbase"
import { updateMyClient } from "@/lib/panel/client-self"
import { toDateInputValue } from "@/lib/client-utils"
import { useAuth } from "@/hooks/use-auth"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { Loader2, LogOut } from "lucide-react"

const EDITABLE: { key: keyof Client; label: string; type?: string }[] = [
  { key: "Name", label: "Imię i nazwisko" },
  { key: "Phone", label: "Telefon" },
  { key: "Adres", label: "Adres" },
  { key: "Birthday", label: "Data urodzenia", type: "date" },
  { key: "KrajPoch", label: "Kraj pochodzenia" },
  { key: "CelPobytu", label: "Cel pobytu" },
]

const READONLY: { key: keyof Client; label: string }[] = [
  { key: "Email", label: "E-mail (login)" },
  { key: "NumerSprawy", label: "Numer sprawy" },
]

function getInitials(name?: string | null, email?: string | null) {
  const source = (name ?? "").trim()
  if (source) {
    const parts = source.split(/\s+/)
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase()
    return source.substring(0, 2).toUpperCase()
  }
  if (email) return email.substring(0, 2).toUpperCase()
  return "?"
}

export function ProfileForm({ client }: { client: Client }) {
  const { logout } = useAuth()
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const f of EDITABLE) {
      const raw = client[f.key] as string | null
      init[f.key as string] = f.type === "date" ? toDateInputValue(raw) : (raw ?? "")
    }
    return init
  })
  const [saving, setSaving] = useState(false)

  const onSave = async () => {
    setSaving(true)
    const ok = await updateMyClient(values)
    setSaving(false)
    toast(ok
      ? { title: "Zapisano", description: "Twoje dane zostały zaktualizowane." }
      : { title: "Błąd", description: "Nie udało się zapisać danych.", variant: "destructive" })
  }

  const displayName = (client.Name ?? "").trim() || "Mój profil"

  return (
    <div className="space-y-5">
      {/* Profile header */}
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-gradient-to-br from-brand to-brand-deep px-5 py-7 text-center text-white shadow-brand-soft">
        <div className="flex size-20 items-center justify-center rounded-full bg-white/15 text-2xl font-bold ring-4 ring-white/10">
          {getInitials(client.Name, client.Email)}
        </div>
        <div className="space-y-0.5">
          <h1 className="text-lg font-semibold leading-tight">{displayName}</h1>
          {client.NumerSprawy && (
            <p className="text-xs text-white/70">Sprawa nr {client.NumerSprawy}</p>
          )}
          {client.Email && (
            <p className="text-xs text-white/70">{client.Email}</p>
          )}
        </div>
      </div>

      {/* Editable data card */}
      <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-mute">
          Dane osobowe
        </p>
        <div className="space-y-3">
          {EDITABLE.map((f) => (
            <div key={f.key as string} className="space-y-1.5">
              <Label htmlFor={f.key as string}>{f.label}</Label>
              <Input id={f.key as string} type={f.type ?? "text"}
                value={values[f.key as string]}
                onChange={(e) => setValues((v) => ({ ...v, [f.key as string]: e.target.value }))} />
            </div>
          ))}
        </div>
      </section>

      {/* Read-only account card */}
      <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-mute">
          Konto (tylko do odczytu)
        </p>
        <div className="space-y-3">
          {READONLY.map((f) => (
            <div key={f.key as string} className="space-y-1.5">
              <Label>{f.label}</Label>
              <Input value={(client[f.key] as string | null) ?? "—"} disabled />
            </div>
          ))}
        </div>
      </section>

      <Button className="w-full" onClick={onSave} disabled={saving}>
        {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Zapisywanie...</> : "Zapisz zmiany"}
      </Button>

      <Button variant="outline" className="w-full text-red-500 hover:text-red-600" onClick={() => logout()}>
        <LogOut className="mr-2 h-4 w-4" />
        Wyloguj się
      </Button>
    </div>
  )
}
