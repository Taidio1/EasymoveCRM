"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getClients, type Client } from "@/lib/superbase"
import {
  FileText, Search, ChevronLeft, ArrowRight, Check, Mail,
  Download, ChevronRight,
} from "lucide-react"

// ─── data ────────────────────────────────────────────────────────────────────

type TemplateKolor = 'pobyt' | 'visa' | 'praca' | 'obywatelstwo' | 'info' | 'warn' | 'danger'

const COLOR_VARS: Record<TemplateKolor, string> = {
  pobyt: 'var(--pobyt)',
  visa: 'var(--visa)',
  praca: 'var(--praca)',
  obywatelstwo: 'var(--obywatelstwo)',
  info: 'var(--info)',
  warn: 'var(--warn)',
  danger: 'var(--danger)',
}

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
  { id: 'wniosek-pobyt-czasowy', nazwa: 'Wniosek o pobyt czasowy i pracę', kategoria: 'Pobyt', opis: 'Zał. nr 1 — zezwolenie na pobyt czasowy i pracę', pola: ['dane_osobowe', 'adres', 'cel_pobytu', 'pracodawca'], kolor: 'pobyt', popularnosc: 'Najczęstszy' },
  { id: 'wniosek-karta', nazwa: 'Wniosek o kartę pobytu', kategoria: 'Pobyt', opis: 'Formularz do Urzędu Wojewódzkiego', pola: ['dane_osobowe', 'adres', 'cel_pobytu', 'okres'], kolor: 'pobyt' },
  { id: 'wniosek-wiza', nazwa: 'Wniosek wizowy krajowy', kategoria: 'Wiza', opis: 'Wiza krajowa typu D', pola: ['dane_osobowe', 'paszport', 'cel_pobytu', 'finanse'], kolor: 'visa' },
  { id: 'zezwolenie-praca', nazwa: 'Zezwolenie na pracę', kategoria: 'Praca', opis: 'Wniosek do Urzędu Pracy', pola: ['dane_osobowe', 'pracodawca', 'stanowisko', 'wynagrodzenie'], kolor: 'praca' },
  { id: 'obywatelstwo', nazwa: 'Wniosek o uznanie za obywatela', kategoria: 'Obywatelstwo', opis: 'Dla kwalifikujących się rezydentów', pola: ['dane_osobowe', 'pobyt_historia', 'znajomosc_jezyka'], kolor: 'obywatelstwo' },
  { id: 'umowa-uslug', nazwa: 'Umowa o świadczenie usług', kategoria: 'Kancelaria', opis: 'Umowa między klientem a doradcą', pola: ['dane_osobowe', 'zakres_uslug', 'cennik'], kolor: 'info' },
  { id: 'pelnomocnictwo', nazwa: 'Pełnomocnictwo', kategoria: 'Kancelaria', opis: 'Upoważnienie do reprezentacji', pola: ['dane_osobowe', 'mocodawca', 'zakres'], kolor: 'info' },
  { id: 'oswiadczenie-finans', nazwa: 'Oświadczenie o źródle finansowania', kategoria: 'Pobyt', opis: 'Wymagane przy większości spraw', pola: ['dane_osobowe', 'srodki_finansowe'], kolor: 'warn' },
  { id: 'odwolanie', nazwa: 'Odwołanie od decyzji', kategoria: 'Kancelaria', opis: 'W przypadku negatywnej decyzji', pola: ['dane_osobowe', 'decyzja', 'uzasadnienie'], kolor: 'danger' },
]

const RECENT_DOCS = [
  { nazwa: 'Wniosek o kartę pobytu — Kowalczyk Anna', data: '16.04.2026', szablon: 'wniosek-karta', status: 'Wygenerowany' },
  { nazwa: 'Pełnomocnictwo — Chen Wei', data: '15.04.2026', szablon: 'pelnomocnictwo', status: 'Podpisany' },
  { nazwa: 'Zezwolenie na pracę — Nowak Jakub', data: '14.04.2026', szablon: 'zezwolenie-praca', status: 'Wysłany' },
  { nazwa: 'Wniosek wizowy — Petrenko Olena', data: '12.04.2026', szablon: 'wniosek-wiza', status: 'Wygenerowany' },
]

const FIELD_DEFS: Record<string, { label: string; fields: string[] }> = {
  dane_osobowe: { label: 'Dane osobowe', fields: ['Imię', 'Nazwisko', 'Data urodzenia', 'PESEL / numer paszportu'] },
  adres: { label: 'Adres zameldowania', fields: ['Ulica i numer', 'Kod pocztowy', 'Miejscowość'] },
  paszport: { label: 'Dane paszportu', fields: ['Numer paszportu', 'Data wydania', 'Data ważności', 'Organ wydający'] },
  cel_pobytu: { label: 'Cel pobytu', fields: ['Cel pobytu', 'Planowany okres', 'Miejsce zameldowania w Polsce'] },
  okres: { label: 'Okres pobytu', fields: ['Data od', 'Data do'] },
  pracodawca: { label: 'Pracodawca', fields: ['Nazwa firmy', 'NIP', 'Adres firmy'] },
  stanowisko: { label: 'Stanowisko', fields: ['Nazwa stanowiska', 'Wymiar etatu', 'Rodzaj umowy'] },
  wynagrodzenie: { label: 'Wynagrodzenie', fields: ['Kwota brutto', 'Waluta', 'Częstotliwość wypłaty'] },
  finanse: { label: 'Sytuacja finansowa', fields: ['Źródło finansowania', 'Posiadane środki'] },
  srodki_finansowe: { label: 'Środki finansowe', fields: ['Kwota', 'Waluta', 'Pochodzenie środków'] },
  pobyt_historia: { label: 'Historia pobytu', fields: ['Data pierwszego przyjazdu', 'Łączny okres pobytu', 'Karty pobytu (historyczne)'] },
  znajomosc_jezyka: { label: 'Znajomość języka polskiego', fields: ['Poziom (A1–C2)', 'Certyfikat (numer)'] },
  zakres_uslug: { label: 'Zakres usług', fields: ['Opis usług'] },
  cennik: { label: 'Cennik', fields: ['Kwota netto', 'Waluta', 'Forma płatności'] },
  mocodawca: { label: 'Mocodawca', fields: ['Imię i nazwisko', 'Adres', 'PESEL'] },
  zakres: { label: 'Zakres pełnomocnictwa', fields: ['Opis zakresu'] },
  decyzja: { label: 'Decyzja', fields: ['Numer decyzji', 'Data decyzji', 'Organ wydający'] },
  uzasadnienie: { label: 'Uzasadnienie odwołania', fields: ['Treść uzasadnienia'] },
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return (parts[0] || 'KL').slice(0, 2).toUpperCase()
}

function getSprawaColor(cel: string | null): TemplateKolor {
  const c = (cel || '').toLowerCase()
  if (c.includes('karta') || c.includes('pobyt') || c.includes('rejestr')) return 'pobyt'
  if (c.includes('wiza')) return 'visa'
  if (c.includes('prac') || c.includes('praca')) return 'praca'
  if (c.includes('obyw')) return 'obywatelstwo'
  return 'info'
}

function statusStyle(status: string): { bg: string; color: string } {
  if (status === 'Podpisany') return { bg: 'var(--success-soft)', color: 'var(--success)' }
  if (status === 'Wysłany') return { bg: 'var(--info-soft)', color: 'var(--info)' }
  return { bg: 'var(--warn-soft)', color: 'var(--warn)' }
}

// ─── browse view ─────────────────────────────────────────────────────────────

interface BrowseProps {
  onSelect: (t: DocTemplate) => void
}

function BrowseView({ onSelect }: BrowseProps) {
  const [category, setCategory] = useState('Wszystkie')
  const [search, setSearch] = useState('')

  const CATEGORIES = ['Wszystkie', 'Pobyt', 'Wiza', 'Praca', 'Obywatelstwo', 'Kancelaria']
  const filtered = DOC_TEMPLATES.filter(t =>
    (category === 'Wszystkie' || t.kategoria === category) &&
    (!search || t.nazwa.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="p-6 overflow-auto">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { l: 'Szablonów', v: DOC_TEMPLATES.length, c: 'var(--brand)' },
          { l: 'Wygenerowanych (mies.)', v: '134', c: 'var(--success)' },
          { l: 'Oczekujących', v: '18', c: 'var(--warn)' },
          { l: 'Podpisanych', v: '92', c: 'var(--info)' },
        ].map((s, i) => (
          <div key={i} className="bg-surface border border-border rounded-card p-4">
            <div className="text-[10px] font-bold text-text-mute uppercase tracking-loosest mb-1.5">{s.l}</div>
            <div className="font-display text-[28px] font-medium text-text tracking-tightest leading-none">{s.v}</div>
            <div className="h-0.5 w-7 rounded-full mt-2.5" style={{ background: s.c }} />
          </div>
        ))}
      </div>

      {/* Toolbar */}
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

      {/* Categories */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {CATEGORIES.map(k => (
          <button
            key={k}
            onClick={() => setCategory(k)}
            className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all duration-150 cursor-pointer"
            style={{
              border: `1px solid ${category === k ? 'var(--text)' : 'var(--border)'}`,
              background: category === k ? 'var(--text)' : 'transparent',
              color: category === k ? 'var(--bg)' : 'var(--text-dim)',
            }}
          >
            {k}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-8">
        {filtered.map(t => {
          const col = COLOR_VARS[t.kolor]
          return (
            <TemplateCard key={t.id} t={t} col={col} onSelect={onSelect} />
          )
        })}
      </div>

      {/* Recent docs */}
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
                gridTemplateColumns: '36px 1fr auto auto auto',
                gap: '14px',
                borderBottom: i < RECENT_DOCS.length - 1 ? '1px solid var(--border)' : 'none',
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
                style={{ background: ss.bg, color: ss.color, letterSpacing: '0.05em' }}
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

  return (
    <div
      onClick={() => onSelect(t)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="bg-surface rounded-card p-[18px] cursor-pointer relative overflow-hidden transition-all duration-150"
      style={{ border: `1px solid ${hovered ? col : 'var(--border)'}` }}
    >
      <div className="flex items-start justify-between mb-3.5">
        <div
          className="w-10 h-10 rounded-[10px] flex items-center justify-center"
          style={{ background: col + '20', color: col }}
        >
          <FileText size={20} />
        </div>
        {t.popularnosc && (
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-pill tracking-wide"
            style={{ background: 'var(--success-soft)', color: 'var(--success)', letterSpacing: '0.05em' }}
          >
            {t.popularnosc.toUpperCase()}
          </span>
        )}
      </div>
      <div className="text-[10px] text-text-mute uppercase font-bold tracking-loosest mb-1">{t.kategoria}</div>
      <h3 className="font-display text-[18px] font-medium text-text tracking-semi-tight leading-snug mb-1.5">{t.nazwa}</h3>
      <p className="text-[12px] text-text-dim leading-relaxed mb-3.5">{t.opis}</p>
      <div className="flex items-center justify-between text-[11px] text-text-mute">
        <span className="font-mono">{t.pola.length} pól</span>
        <span className="font-semibold flex items-center gap-1" style={{ color: col }}>
          Generuj <ArrowRight size={12} />
        </span>
      </div>
    </div>
  )
}

// ─── configure view ───────────────────────────────────────────────────────────

interface ConfigureProps {
  template: DocTemplate
  clients: Client[]
  loadingClients: boolean
  onBack: () => void
  onNext: (client: Client) => void
}

function ConfigureView({ template, clients, loadingClients, onBack, onNext }: ConfigureProps) {
  const [client, setClient] = useState<Client | null>(null)
  const [clientSearch, setClientSearch] = useState('')
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

  const autoFilled: Record<string, string> = client ? {
    'Imię': client.Name?.split(' ')[0] || '',
    'Nazwisko': client.Name?.split(' ').slice(1).join(' ') || '',
    'PESEL / numer paszportu': client.NumerSprawy || '',
    'Numer paszportu': client.NumerSprawy || '',
    'Miejsce zameldowania w Polsce': client.Adres || '',
    'Cel pobytu': client.CelPobytu || '',
    'Ulica i numer': client.Adres?.split(',')[0] || '',
  } : {}

  return (
    <div className="p-6 max-w-5xl mx-auto w-full overflow-auto">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 px-3 h-8 rounded-btn border border-border bg-transparent text-text text-[12.5px] font-medium hover:bg-surface-hover transition-colors mb-5 cursor-pointer"
      >
        <ChevronLeft size={13} /> Wróć do szablonów
      </button>

      {/* Header */}
      <div className="flex items-start gap-4 mb-7">
        <div
          className="w-14 h-14 rounded-[12px] flex items-center justify-center shrink-0"
          style={{ background: col + '20', color: col }}
        >
          <FileText size={26} />
        </div>
        <div>
          <div className="text-[11px] text-text-mute uppercase font-bold tracking-loosest mb-1">{template.kategoria}</div>
          <h1 className="font-display text-[28px] font-medium text-text tracking-tightest leading-tight">{template.nazwa}</h1>
          <p className="text-[13px] text-text-dim mt-1.5">{template.opis}</p>
        </div>
      </div>

      <Link
        href={`/documents/${template.id}/edit`}
        className="inline-flex items-center gap-1.5 px-3 h-8 rounded-btn border border-border bg-transparent text-text text-[12px] font-medium hover:bg-surface-hover transition-colors mb-4"
      >
        Edytuj mapping (admin)
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        {/* Left: form */}
        <div className="flex flex-col gap-3.5">
          {/* Client selector */}
          <div className="bg-surface border border-border rounded-card p-[18px]">
            <div className="text-[11px] text-text-mute uppercase font-bold tracking-loosest mb-2.5">Klient</div>
            {!client ? (
              <div>
                <p className="text-[13px] text-text-dim mb-2.5">Wybierz klienta — jego dane zostaną automatycznie uzupełnione w formularzu.</p>
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
                    <div className="p-6 text-center text-[13px] text-text-mute">Ładowanie klientów…</div>
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
                        <div
                          className="w-7 h-7 rounded-chip flex items-center justify-center text-[10.5px] font-semibold shrink-0"
                          style={{ background: sprawaColor + '20', color: sprawaColor }}
                        >
                          {getInitials(c.Name || 'KL')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium text-text truncate">{c.Name || 'Brak nazwy'}</div>
                          <div className="text-[11px] text-text-dim font-mono">{c.NumerSprawy || c.id}</div>
                        </div>
                        <button className="px-2.5 h-6 text-[11px] font-medium text-text border border-border rounded-btn bg-transparent hover:bg-surface-hover shrink-0 cursor-pointer">
                          Wybierz
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-2.5 bg-bg rounded-btn border border-border">
                <div
                  className="w-10 h-10 rounded-btn flex items-center justify-center text-[13px] font-semibold text-white shrink-0"
                  style={{ background: `linear-gradient(135deg, ${COLOR_VARS[getSprawaColor(client.CelPobytu)]}, ${COLOR_VARS[getSprawaColor(client.CelPobytu)]}80)` }}
                >
                  {getInitials(client.Name || 'KL')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-text">{client.Name || 'Brak nazwy'}</div>
                  <div className="text-[11px] text-text-dim font-mono">{client.NumerSprawy || client.id} · {client.CelPobytu || '—'}</div>
                </div>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-pill shrink-0"
                  style={{ background: 'var(--success-soft)', color: 'var(--success)', letterSpacing: '0.05em' }}
                >
                  DANE POBRANE
                </span>
                <button
                  onClick={() => setClient(null)}
                  className="px-2.5 h-6 text-[11px] font-medium text-text border border-border rounded-btn bg-transparent hover:bg-surface-hover shrink-0 cursor-pointer"
                >
                  Zmień
                </button>
              </div>
            )}
          </div>

          {/* Field sections */}
          {client && template.pola.map(p => {
            const def = FIELD_DEFS[p]
            if (!def) return null
            const hasAuto = def.fields.some(f => autoFilled[f])
            return (
              <div key={p} className="bg-surface border border-border rounded-card p-[18px]">
                <div className="flex items-center gap-2 mb-3.5">
                  <div className="font-display text-[17px] font-medium text-text tracking-semi-tight">{def.label}</div>
                  <div className="flex-1" />
                  {hasAuto && (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-pill"
                      style={{ background: 'var(--success-soft)', color: 'var(--success)', letterSpacing: '0.04em' }}
                    >
                      AUTO
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {def.fields.map(f => {
                    const isAuto = !!autoFilled[f]
                    return (
                      <div key={f} className={f.length > 28 ? 'sm:col-span-2' : ''}>
                        <label className="block text-[11px] text-text-dim font-medium mb-1.5">
                          {f}{isAuto && <span className="ml-1.5 text-[var(--success)]">●</span>}
                        </label>
                        <input
                          defaultValue={autoFilled[f] || ''}
                          placeholder={isAuto ? '' : `Wprowadź ${f.toLowerCase()}`}
                          className="w-full h-[34px] px-3 rounded-btn text-[13px] font-sans text-text outline-none transition-colors"
                          style={{
                            background: isAuto ? 'color-mix(in srgb, var(--success) 8%, transparent)' : 'var(--bg)',
                            border: `1px solid ${isAuto ? 'color-mix(in srgb, var(--success) 40%, transparent)' : 'var(--border)'}`,
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Right: sidebar */}
        <div className="flex flex-col gap-3.5">
          {/* Preview thumbnail */}
          <div className="bg-surface border border-border rounded-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border text-[11px] text-text-mute uppercase font-bold tracking-loosest">Podgląd</div>
            <div className="p-4 bg-bg">
              <div
                className="bg-white rounded-[4px] p-4 text-[#111]"
                style={{
                  fontFamily: 'var(--font-sans), serif',
                  fontSize: 8,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  aspectRatio: '1 / 1.414',
                }}
              >
                <div className="text-[11px] font-semibold text-center mb-2" style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}>
                  {template.nazwa}
                </div>
                <div className="border-b border-black mb-2" />
                <div style={{ fontSize: 6.5, lineHeight: 1.6 }}>
                  <div><strong>Imię i nazwisko:</strong> {client ? client.Name : '...'}</div>
                  <div><strong>Obywatelstwo:</strong> {client ? (client.KrajPoch || '—') : '...'}</div>
                  <div><strong>Dokument:</strong> {client ? (client.NumerSprawy || '—') : '...'}</div>
                  <div><strong>Adres:</strong> {client ? (client.Adres || '—') : '...'}</div>
                  <div style={{ marginTop: 6 }}><strong>Cel:</strong> {client ? (client.CelPobytu || '—') : '...'}</div>
                  <div style={{ marginTop: 10, fontSize: 6, color: '#666' }}>Dokument wygenerowany automatycznie przez system EasyMove CRM.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Format picker */}
          <div className="bg-surface border border-border rounded-card p-4">
            <div className="text-[11px] text-text-mute uppercase font-bold tracking-loosest mb-2.5">Format eksportu</div>
            <div className="flex flex-col gap-1.5">
              {[
                { f: 'PDF', d: 'Do wydruku i podpisu', sel: true },
                { f: 'DOCX', d: 'Edytowalny Word', sel: false },
                { f: 'ODT', d: 'OpenDocument', sel: false },
              ].map(o => (
                <label
                  key={o.f}
                  className="flex items-center gap-2.5 p-2 rounded-chip cursor-pointer transition-colors"
                  style={{
                    border: `1px solid ${o.sel ? 'var(--brand)' : 'var(--border)'}`,
                    background: o.sel ? 'var(--brand-soft)' : 'transparent',
                  }}
                >
                  <input type="radio" name="fmt" defaultChecked={o.sel} style={{ accentColor: 'var(--brand)' }} />
                  <div className="flex-1">
                    <div className="text-[12px] font-semibold text-text">{o.f}</div>
                    <div className="text-[10.5px] text-text-dim">{o.d}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={() => client && onNext(client)}
            disabled={!client}
            className="h-10 rounded-btn text-[13px] font-semibold text-white flex items-center justify-center gap-1.5 transition-opacity cursor-pointer"
            style={{
              background: 'var(--brand)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)',
              opacity: client ? 1 : 0.4,
              cursor: client ? 'pointer' : 'not-allowed',
            }}
          >
            Generuj dokument <ArrowRight size={14} />
          </button>
          {!client && (
            <div className="text-[11px] text-text-mute text-center -mt-1">Najpierw wybierz klienta</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── preview view ─────────────────────────────────────────────────────────────

interface PreviewProps {
  template: DocTemplate
  client: Client
  onBack: () => void
  onNew: () => void
}

function PreviewView({ template, client, onBack, onNew }: PreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function generate(): Promise<string | null> {
    setIsGenerating(true)
    setError(null)
    try {
      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: template.id, client }),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(`Błąd generowania: ${err.error}`)
        return null
      }
      const blob = await res.blob()
      return URL.createObjectURL(blob)
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    generate().then(url => { if (url) setPdfUrl(url) })
    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleDownload() {
    const url = pdfUrl ?? await generate()
    if (!url) return
    const a = document.createElement("a")
    a.href = url
    a.download = `${template.id}-${client.Name?.replace(/\s+/g, "_") ?? client.id}.pdf`
    a.click()
  }

  return (
    <div className="p-6 max-w-4xl mx-auto w-full overflow-auto">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 px-3 h-8 rounded-btn border border-border bg-transparent text-text text-[12.5px] font-medium hover:bg-surface-hover transition-colors mb-5 cursor-pointer"
      >
        <ChevronLeft size={13} /> Wróć do edycji
      </button>

      {/* Top bar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <div className="font-display text-[18px] font-medium text-text tracking-semi-tight">{template.nazwa}</div>
          <div className="text-[12px] text-text-dim mt-0.5">{client.Name}</div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleDownload}
            disabled={isGenerating || !pdfUrl}
            className="inline-flex items-center gap-1.5 px-3 h-8 rounded-btn text-[12.5px] font-semibold text-white cursor-pointer disabled:opacity-50"
            style={{ background: 'var(--brand)', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
          >
            <Download size={13} /> Pobierz PDF
          </button>
          <button
            onClick={onNew}
            className="inline-flex items-center gap-1.5 px-3 h-8 rounded-btn border border-border bg-transparent text-text text-[12.5px] font-medium hover:bg-surface-hover transition-colors cursor-pointer"
          >
            Nowy dokument
          </button>
        </div>
      </div>

      {/* PDF preview */}
      <div className="rounded-card overflow-hidden border border-border" style={{ height: '80vh' }}>
        {isGenerating && (
          <div className="flex items-center justify-center h-full text-[13px] text-text-mute gap-2">
            <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
            Generowanie podglądu…
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-full text-[13px] text-red-500 px-6 text-center">{error}</div>
        )}
        {pdfUrl && !isGenerating && (
          <iframe src={pdfUrl} className="w-full h-full" title="Podgląd dokumentu" />
        )}
      </div>
    </div>
  )
}

function DocSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h2
        className="text-[13px] font-semibold text-[#111] mb-3.5 uppercase pb-1.5"
        style={{ borderBottom: '1px solid #ccc', letterSpacing: '0.05em' }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

function DocGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-y-2.5 gap-x-5 text-[13px] leading-relaxed" style={{ gridTemplateColumns: '180px 1fr' }}>
      {children}
    </div>
  )
}

function DocRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <>
      <div className="text-[#666]">{label}</div>
      <div className="font-medium" style={mono ? { fontFamily: 'var(--font-mono, monospace)' } : {}}>{value}</div>
    </>
  )
}

// ─── root ─────────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const [step, setStep] = useState<'browse' | 'configure' | 'preview'>('browse')
  const [template, setTemplate] = useState<DocTemplate | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(true)

  useEffect(() => {
    getClients()
      .then(data => setClients(data))
      .catch(console.error)
      .finally(() => setLoadingClients(false))
  }, [])

  if (step === 'configure' && template) {
    return (
      <ConfigureView
        template={template}
        clients={clients}
        loadingClients={loadingClients}
        onBack={() => setStep('browse')}
        onNext={c => { setClient(c); setStep('preview') }}
      />
    )
  }

  if (step === 'preview' && template && client) {
    return (
      <PreviewView
        template={template}
        client={client}
        onBack={() => setStep('configure')}
        onNew={() => { setStep('browse'); setTemplate(null); setClient(null) }}
      />
    )
  }

  return (
    <BrowseView
      onSelect={t => { setTemplate(t); setStep('configure') }}
    />
  )
}
