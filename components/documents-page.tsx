"use client"

import { useState, useEffect } from "react"
import { getClients, type Client } from "@/lib/superbase"
import { FileText, Search, ChevronLeft, ArrowRight, ChevronRight } from "lucide-react"
import { DocumentComposer } from "@/components/document-composer"
import type { DocumentMapping } from "@/lib/document-types"

type TemplateKolor = "pobyt" | "visa" | "praca" | "obywatelstwo" | "info" | "warn" | "danger"

const COLOR_VARS: Record<TemplateKolor, string> = {
  pobyt: "var(--pobyt)",
  visa: "var(--visa)",
  praca: "var(--praca)",
  obywatelstwo: "var(--obywatelstwo)",
  info: "var(--info)",
  warn: "var(--warn)",
  danger: "var(--danger)",
}

const AVAILABLE_TEMPLATES = new Set<string>(["wniosek-pobyt-czasowy"])

interface DocTemplate {
  id: string
  nazwa: string
  kategoria: string
  opis: string
  pola: string[]
  kolor: TemplateKolor
  popularnosc?: string
}

const DOC_TEMPLATES: DocTemplate[] = [
  { id: "wniosek-pobyt-czasowy", nazwa: "Wniosek o pobyt czasowy i pracę", kategoria: "Pobyt", opis: "Zał. nr 1 - zezwolenie na pobyt czasowy i pracę", pola: ["dane_osobowe", "adres", "cel_pobytu", "pracodawca"], kolor: "pobyt", popularnosc: "Najczęstszy" },
  { id: "wniosek-karta", nazwa: "Wniosek o kartę pobytu", kategoria: "Pobyt", opis: "Formularz do Urzędu Wojewódzkiego", pola: ["dane_osobowe", "adres", "cel_pobytu", "okres"], kolor: "pobyt" },
  { id: "wniosek-wiza", nazwa: "Wniosek wizowy krajowy", kategoria: "Wiza", opis: "Wiza krajowa typu D", pola: ["dane_osobowe", "paszport", "cel_pobytu", "finanse"], kolor: "visa" },
  { id: "zezwolenie-praca", nazwa: "Zezwolenie na pracę", kategoria: "Praca", opis: "Wniosek do Urzędu Pracy", pola: ["dane_osobowe", "pracodawca", "stanowisko", "wynagrodzenie"], kolor: "praca" },
  { id: "obywatelstwo", nazwa: "Wniosek o uznanie za obywatela", kategoria: "Obywatelstwo", opis: "Dla kwalifikujących się rezydentów", pola: ["dane_osobowe", "pobyt_historia", "znajomosc_jezyka"], kolor: "obywatelstwo" },
  { id: "umowa-uslug", nazwa: "Umowa o świadczenie usług", kategoria: "Kancelaria", opis: "Umowa między klientem a doradcą", pola: ["dane_osobowe", "zakres_uslug", "cennik"], kolor: "info" },
  { id: "pelnomocnictwo", nazwa: "Pełnomocnictwo", kategoria: "Kancelaria", opis: "Upoważnienie do reprezentacji", pola: ["dane_osobowe", "mocodawca", "zakres"], kolor: "info" },
  { id: "oswiadczenie-finans", nazwa: "Oświadczenie o źródle finansowania", kategoria: "Pobyt", opis: "Wymagane przy większości spraw", pola: ["dane_osobowe", "srodki_finansowe"], kolor: "warn" },
  { id: "odwolanie", nazwa: "Odwołanie od decyzji", kategoria: "Kancelaria", opis: "W przypadku negatywnej decyzji", pola: ["dane_osobowe", "decyzja", "uzasadnienie"], kolor: "danger" },
]

const RECENT_DOCS = [
  { nazwa: "Wniosek o kartę pobytu - Kowalczyk Anna", data: "16.04.2026", szablon: "wniosek-karta", status: "Wygenerowany" },
  { nazwa: "Pełnomocnictwo - Chen Wei", data: "15.04.2026", szablon: "pelnomocnictwo", status: "Podpisany" },
  { nazwa: "Zezwolenie na pracę - Nowak Jakub", data: "14.04.2026", szablon: "zezwolenie-praca", status: "Wysłany" },
  { nazwa: "Wniosek wizowy - Petrenko Olena", data: "12.04.2026", szablon: "wniosek-wiza", status: "Wygenerowany" },
]

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return (parts[0] || "KL").slice(0, 2).toUpperCase()
}

function getSprawaColor(cel: string | null): TemplateKolor {
  const c = (cel || "").toLowerCase()
  if (c.includes("karta") || c.includes("pobyt") || c.includes("rejestr")) return "pobyt"
  if (c.includes("wiza")) return "visa"
  if (c.includes("prac") || c.includes("praca")) return "praca"
  if (c.includes("obyw")) return "obywatelstwo"
  return "info"
}

function statusStyle(status: string): { bg: string; color: string } {
  if (status === "Podpisany") return { bg: "var(--success-soft)", color: "var(--success)" }
  if (status === "Wysłany") return { bg: "var(--info-soft)", color: "var(--info)" }
  return { bg: "var(--warn-soft)", color: "var(--warn)" }
}

interface BrowseProps {
  onSelect: (t: DocTemplate) => void
}

function BrowseView({ onSelect }: BrowseProps) {
  const [category, setCategory] = useState("Wszystkie")
  const [search, setSearch] = useState("")

  const CATEGORIES = ["Wszystkie", "Pobyt", "Wiza", "Praca", "Obywatelstwo", "Kancelaria"]
  const filtered = DOC_TEMPLATES.filter(t =>
    (category === "Wszystkie" || t.kategoria === category) &&
    (!search || t.nazwa.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="p-6 overflow-auto">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { l: "Szablonów", v: DOC_TEMPLATES.length, c: "var(--brand)" },
          { l: "Wygenerowanych (mies.)", v: "134", c: "var(--success)" },
          { l: "Oczekujących", v: "18", c: "var(--warn)" },
          { l: "Podpisanych", v: "92", c: "var(--info)" },
        ].map((s, i) => (
          <div key={i} className="bg-surface border border-border rounded-card p-4">
            <div className="text-[10px] font-bold text-text-mute uppercase tracking-loosest mb-1.5">{s.l}</div>
            <div className="font-display text-[28px] font-medium text-text tracking-tightest leading-none">{s.v}</div>
            <div className="h-0.5 w-7 rounded-full mt-2.5" style={{ background: s.c }} />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center mb-4">
        <h2 className="font-display text-[18px] font-medium text-text tracking-semi-tight">Wybierz szablon</h2>
        <span className="text-[11px] text-text-mute font-mono tracking-semi-loose uppercase">{filtered.length} dostępnych</span>
        <div className="flex-1 min-w-0" />
        <div className="flex items-center gap-1.5 bg-surface border border-border rounded-btn px-2.5 w-full sm:w-60">
          <Search size={13} className="text-text-mute shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Szukaj szablonu..."
            className="flex-1 h-8 bg-transparent border-none outline-none text-text text-[12px] font-sans placeholder:text-text-mute"
          />
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap mb-5">
        {CATEGORIES.map(k => (
          <button
            key={k}
            onClick={() => setCategory(k)}
            className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all duration-150 cursor-pointer"
            style={{
              border: `1px solid ${category === k ? "var(--text)" : "var(--border)"}`,
              background: category === k ? "var(--text)" : "transparent",
              color: category === k ? "var(--bg)" : "var(--text-dim)",
            }}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-8">
        {filtered.map(t => {
          const col = COLOR_VARS[t.kolor]
          return (
            <TemplateCard key={t.id} t={t} col={col} onSelect={onSelect} />
          )
        })}
      </div>

      <div className="flex items-baseline gap-2.5 mb-3.5">
        <h2 className="font-display text-[18px] font-medium text-text tracking-semi-tight">Ostatnio wygenerowane</h2>
        <span className="text-[11px] text-text-mute font-mono tracking-semi-loose uppercase">{RECENT_DOCS.length}</span>
      </div>
      <div className="bg-surface border border-border rounded-card overflow-hidden">
        {RECENT_DOCS.map((d, i) => {
          const ss = statusStyle(d.status)
          return (
            <div
              key={i}
              className="px-4 py-3 grid items-center cursor-pointer transition-colors hover:bg-surface-hover"
              style={{
                gridTemplateColumns: "36px 1fr auto auto auto",
                gap: "14px",
                borderBottom: i < RECENT_DOCS.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <div className="w-9 h-10 rounded-chip bg-bg border border-border flex items-center justify-center text-text-dim">
                <FileText size={15} />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-text truncate">{d.nazwa}</div>
                <div className="text-[11px] text-text-mute font-mono mt-0.5">{d.data}</div>
              </div>
              <span
                className="text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-pill shrink-0"
                style={{ background: ss.bg, color: ss.color, letterSpacing: "0.05em" }}
              >
                {d.status.toUpperCase()}
              </span>
              <button className="w-7 h-7 rounded-btn border border-border bg-transparent flex items-center justify-center text-text-dim hover:bg-surface-hover transition-colors shrink-0">
                <FileText size={13} />
              </button>
              <ChevronRight size={14} className="text-text-mute shrink-0" />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TemplateCard({ t, col, onSelect }: { t: DocTemplate; col: string; onSelect: (t: DocTemplate) => void }) {
  const [hovered, setHovered] = useState(false)
  const available = AVAILABLE_TEMPLATES.has(t.id)

  return (
    <div
      onClick={() => available && onSelect(t)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="bg-surface rounded-card p-[18px] relative overflow-hidden transition-all duration-150"
      style={{
        border: `1px solid ${hovered && available ? col : "var(--border)"}`,
        opacity: available ? 1 : 0.5,
        cursor: available ? "pointer" : "not-allowed",
      }}
    >
      <div className="flex items-start justify-between mb-3.5">
        <div
          className="w-10 h-10 rounded-[10px] flex items-center justify-center"
          style={{ background: col + "20", color: col }}
        >
          <FileText size={20} />
        </div>
        {available && t.popularnosc && (
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-pill tracking-wide"
            style={{ background: "var(--success-soft)", color: "var(--success)", letterSpacing: "0.05em" }}
          >
            {t.popularnosc.toUpperCase()}
          </span>
        )}
        {!available && (
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-pill tracking-wide"
            style={{ background: "var(--warn-soft)", color: "var(--warn)", letterSpacing: "0.05em" }}
          >
            WKRÓTCE
          </span>
        )}
      </div>
      <div className="text-[10px] text-text-mute uppercase font-bold tracking-loosest mb-1">{t.kategoria}</div>
      <h3 className="font-display text-[18px] font-medium text-text tracking-semi-tight leading-snug mb-1.5">{t.nazwa}</h3>
      <p className="text-[12px] text-text-dim leading-relaxed mb-3.5">{t.opis}</p>
      <div className="flex items-center justify-between text-[11px] text-text-mute">
        <span className="font-mono">{t.pola.length} pól</span>
        <span className="font-semibold flex items-center gap-1" style={{ color: available ? col : "var(--text-mute)" }}>
          {available ? <>Generuj <ArrowRight size={12} /></> : "Niedostępny"}
        </span>
      </div>
    </div>
  )
}

interface SelectProps {
  template: DocTemplate
  clients: Client[]
  loadingClients: boolean
  onBack: () => void
  onNext: (client: Client | null) => void
}

function SelectView({ template, clients, loadingClients, onBack, onNext }: SelectProps) {
  const [client, setClient] = useState<Client | null>(null)
  const [clientSearch, setClientSearch] = useState("")
  const col = COLOR_VARS[template.kolor]

  const filteredClients = clients.filter(c => {
    if (!clientSearch) return true
    const q = clientSearch.toLowerCase()
    return (
      c.Name?.toLowerCase().includes(q) ||
      c.NumerSprawy?.toLowerCase().includes(q) ||
      c.KrajPoch?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-6 max-w-3xl mx-auto w-full overflow-auto">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 px-3 h-8 rounded-btn border border-border bg-transparent text-text text-[12.5px] font-medium hover:bg-surface-hover transition-colors mb-5 cursor-pointer"
      >
        <ChevronLeft size={13} /> Wróć do szablonów
      </button>

      <div className="flex items-start gap-4 mb-7">
        <div className="w-14 h-14 rounded-[12px] flex items-center justify-center shrink-0" style={{ background: col + "20", color: col }}>
          <FileText size={26} />
        </div>
        <div>
          <div className="text-[11px] text-text-mute uppercase font-bold tracking-loosest mb-1">{template.kategoria}</div>
          <h1 className="font-display text-[28px] font-medium text-text tracking-tightest leading-tight">{template.nazwa}</h1>
          <p className="text-[13px] text-text-dim mt-1.5">{template.opis}</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-card p-[18px] mb-4">
        <div className="text-[11px] text-text-mute uppercase font-bold tracking-loosest mb-2.5">Klient</div>
        {!client ? (
          <div>
            <p className="text-[13px] text-text-dim mb-2.5">Wybierz klienta - jego dane zasilą pola dokumentu - albo pomiń i wpisz dane ręcznie.</p>
            <div className="flex items-center gap-1.5 bg-bg border border-border rounded-btn px-2.5 mb-2">
              <Search size={12} className="text-text-mute shrink-0" />
              <input
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
                placeholder="Szukaj klienta..."
                className="flex-1 h-8 bg-transparent border-none outline-none text-text text-[12px] font-sans placeholder:text-text-mute"
              />
            </div>
            <div className="border border-border rounded-btn overflow-hidden max-h-72 overflow-y-auto">
              {loadingClients ? (
                <div className="p-6 text-center text-[13px] text-text-mute">Ładowanie klientów...</div>
              ) : filteredClients.length === 0 ? (
                <div className="p-6 text-center text-[13px] text-text-mute">Nie znaleziono klientów</div>
              ) : filteredClients.map(c => {
                const sprawaColor = COLOR_VARS[getSprawaColor(c.CelPobytu)]
                return (
                  <div
                    key={c.id}
                    onClick={() => setClient(c)}
                    className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-surface-hover transition-colors border-b border-border last:border-b-0"
                  >
                    <div className="w-7 h-7 rounded-chip flex items-center justify-center text-[10.5px] font-semibold shrink-0" style={{ background: sprawaColor + "20", color: sprawaColor }}>
                      {getInitials(c.Name || "KL")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-text truncate">{c.Name || "Brak nazwy"}</div>
                      <div className="text-[11px] text-text-dim font-mono">{c.NumerSprawy || c.id}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-2.5 bg-bg rounded-btn border border-border">
            <div className="w-10 h-10 rounded-btn flex items-center justify-center text-[13px] font-semibold text-white shrink-0" style={{ background: COLOR_VARS[getSprawaColor(client.CelPobytu)] }}>
              {getInitials(client.Name || "KL")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold text-text">{client.Name || "Brak nazwy"}</div>
              <div className="text-[11px] text-text-dim font-mono">{client.NumerSprawy || client.id} · {client.CelPobytu || "-"}</div>
            </div>
            <button onClick={() => setClient(null)} className="px-2.5 h-6 text-[11px] font-medium text-text border border-border rounded-btn bg-transparent hover:bg-surface-hover shrink-0 cursor-pointer">
              Zmień
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onNext(client)}
          className="h-10 px-5 rounded-btn text-[13px] font-semibold text-white inline-flex items-center justify-center gap-1.5 cursor-pointer"
          style={{ background: "var(--brand)" }}
        >
          Podgląd
        </button>
        {!client && (
          <button
            onClick={() => onNext(null)}
            className="h-10 px-5 rounded-btn text-[13px] font-medium border border-border bg-transparent text-text hover:bg-surface-hover cursor-pointer"
          >
            Wpisz dane ręcznie
          </button>
        )}
      </div>
    </div>
  )
}

export default function DocumentsPage() {
  const [step, setStep] = useState<"browse" | "select" | "compose">("browse")
  const [template, setTemplate] = useState<DocTemplate | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [mapping, setMapping] = useState<DocumentMapping | null>(null)
  const [mappingError, setMappingError] = useState<string | null>(null)

  useEffect(() => {
    getClients()
      .then(data => setClients(data))
      .catch(console.error)
      .finally(() => setLoadingClients(false))
  }, [])

  async function chooseTemplate(t: DocTemplate) {
    setTemplate(t)
    setMappingError(null)
    setMapping(null)
    try {
      const res = await fetch(`/api/documents/mappings/${t.id}`)
      if (!res.ok) {
        const e = await res.json()
        setMappingError(e.error ?? "Nie udało się wczytać mappingu")
        return
      }
      setMapping((await res.json()) as DocumentMapping)
      setStep("select")
    } catch {
      setMappingError("Nie udało się wczytać mappingu")
    }
  }

  if (step === "select" && template) {
    return (
      <SelectView
        template={template}
        clients={clients}
        loadingClients={loadingClients}
        onBack={() => setStep("browse")}
        onNext={c => { setClient(c); setStep("compose") }}
      />
    )
  }

  if (step === "compose" && template && mapping) {
    return (
      <DocumentComposer
        templateId={template.id}
        mapping={mapping}
        client={client}
        onBack={() => setStep("select")}
        onNew={() => { setStep("browse"); setTemplate(null); setClient(null); setMapping(null) }}
      />
    )
  }

  return (
    <>
      {mappingError && (
        <div className="m-6 p-3 rounded-card border border-border text-[12px] text-red-500">
          {mappingError}
        </div>
      )}
      <BrowseView onSelect={chooseTemplate} />
    </>
  )
}
