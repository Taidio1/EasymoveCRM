"use client"

import { type MouseEvent as ReactMouseEvent, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, Search, Trash2 } from "lucide-react"
import { filterClientsForDocumentPreview } from "@/lib/client-search"
import { resolveField } from "@/lib/document-resolver"
import {
  documentFieldDefinitionOptionLabel,
  documentFieldDefinitionPresetKey,
  filterDocumentFieldDefinitionsForMappingDropdown,
  resolveDocumentFieldDefinitionSource,
} from "@/lib/document-field-definition-presets"
import { pixelToPoint, type PageDims } from "@/lib/pdf-coords"
import { clampPdfPage, nextPdfPage, previousPdfPage } from "@/lib/pdf-page-navigation"
import {
  DEFAULT_GRID_BOX_WIDTH,
  DEFAULT_GRID_MAX_CHARS,
  DEFAULT_GRID_ROW_HEIGHT,
  normalizeMappingFieldToGrid,
  normalizeMappingFieldsToGrid,
} from "@/lib/mapping-field-controls"
import { getClients, supabase, type Client } from "@/lib/superbase"
import type { DocumentFieldDefinition, DocumentMapping, FieldMapping } from "@/lib/document-types"
import { PdfFieldLayer } from "@/components/pdf-field-layer"

const DEFAULT_FONT_SIZE = 11
const DEFAULT_BOX_WIDTH = DEFAULT_GRID_BOX_WIDTH
const DEFAULT_MAX_CHARS = DEFAULT_GRID_MAX_CHARS
const DEFAULT_ROW_HEIGHT = DEFAULT_GRID_ROW_HEIGHT

type Mode = "select" | "grid"

export function MappingEditor({ templateId }: { templateId: string }) {
  const [mapping, setMapping] = useState<DocumentMapping | null>(null)
  const [page, setPage] = useState(1)
  const [pageCount, setPageCount] = useState(1)
  const [dims, setDims] = useState<PageDims | null>(null)
  const [selected, setSelected] = useState<number>(-1)
  const [clients, setClients] = useState<Client[]>([])
  const [sample, setSample] = useState<Client | null>(null)
  const [status, setStatus] = useState("")
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>("select")
  const [fieldDefinitions, setFieldDefinitions] = useState<DocumentFieldDefinition[]>([])
  const [fieldFilter, setFieldFilter] = useState("")
  const [clientFilter, setClientFilter] = useState("")

  useEffect(() => {
    fetch(`/api/documents/mappings/${templateId}`)
      .then(r => r.json())
      .then((m: DocumentMapping) => setMapping({ ...m, fields: normalizeMappingFieldsToGrid(m.fields) }))
      .catch(() => setStatus("Nie udało się wczytać mappingu"))
    fetch("/api/documents/field-definitions")
      .then(r => (r.ok ? r.json() : []))
      .then((defs: DocumentFieldDefinition[]) => setFieldDefinitions(defs))
      .catch(() => {})
    getClients().then(setClients).catch(() => {})
  }, [templateId])

  function updateField(idx: number, patch: Partial<FieldMapping>) {
    setMapping(m => (m ? {
      ...m,
      fields: m.fields.map((f, i) => (i === idx ? normalizeMappingFieldToGrid({ ...f, ...patch }) : f)),
    } : m))
  }

  function selectField(idx: number, nextPage?: number) {
    setSelected(idx)
    if (nextPage) setPage(nextPage)
  }

  const handlePageCount = useCallback((count: number) => {
    setPageCount(count)
    setPage(current => clampPdfPage(current, count))
  }, [])

  function addField(field: FieldMapping) {
    setMapping(m => (m ? { ...m, fields: [...m.fields, normalizeMappingFieldToGrid(field)] } : m))
    setSelected(mapping ? mapping.fields.length : 0)
    setMode("select")
  }

  function deleteField(idx: number) {
    setMapping(m => (m ? { ...m, fields: m.fields.filter((_, i) => i !== idx) } : m))
    setSelected(-1)
  }

  function switchMode(next: Mode) {
    setMode(next)
    setStatus(next === "grid" ? "Tryb Grid: kliknij pozycję nowego pola" : "")
  }

  function placePoint(e: ReactMouseEvent) {
    if (!dims || mode !== "grid") return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const pt = pixelToPoint(e.clientX - rect.left, e.clientY - rect.top, dims)

    addField({
      page,
      x: pt.x,
      y: pt.y,
      dataKey: "",
      fontSize: DEFAULT_FONT_SIZE,
      type: "grid",
      boxWidth: DEFAULT_BOX_WIDTH,
      maxCharsPerRow: DEFAULT_MAX_CHARS,
      rowHeight: DEFAULT_ROW_HEIGHT,
    })
  }

  async function handleSave() {
    if (!mapping) return
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) {
      setStatus("Brak sesji - zaloguj się")
      return
    }
    const res = await fetch(`/api/documents/mappings/${templateId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...mapping, fields: normalizeMappingFieldsToGrid(mapping.fields) }),
    })
    const body = await res.json()
    setStatus(
      res.ok
        ? "Zapisano"
        : `Błąd: ${body.error}${body.details ? " - " + body.details.join("; ") : ""}`,
    )
  }

  async function handleGenerate() {
    if (!sample) {
      setStatus("Wybierz klienta-próbkę")
      return
    }
    const res = await fetch("/api/documents/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId, client: sample }),
    })
    if (!res.ok) {
      setStatus("Błąd generowania")
      return
    }
    const blob = await res.blob()
    setPdfUrl(URL.createObjectURL(blob))
  }

  if (!mapping) return <div className="p-6 text-text-mute">Ładowanie...</div>

  const pageFields = mapping.fields
    .map((f, idx) => ({ f, idx }))
    .filter(({ f }) => f.page === page)
  const fieldDefinitionSource = filterDocumentFieldDefinitionsForMappingDropdown(
    resolveDocumentFieldDefinitionSource(fieldDefinitions),
  )
  const usingPresetFieldDefinitions = fieldDefinitions.length === 0
  const fieldDefinitionOptions = fieldDefinitionSource.map(def => ({
    id: "id" in def && typeof def.id === "string" ? def.id : `preset-${documentFieldDefinitionPresetKey(def)}`,
    dataKey: documentFieldDefinitionPresetKey(def),
    label: documentFieldDefinitionOptionLabel(def),
    category: def.category,
  }))
  const definitionByDataKey = new Map(fieldDefinitionOptions.map(option => [option.dataKey, option]))
  const normalizedFilter = fieldFilter.trim().toLowerCase()
  const filteredFields = mapping.fields
    .map((f, idx) => ({ f, idx, label: definitionByDataKey.get(f.dataKey)?.label ?? f.dataKey }))
    .filter(({ f, idx, label }) => {
      if (!normalizedFilter) return true
      const haystack = `${idx + 1} ${label} ${f.dataKey} ${f.page} ${f.type ?? "text"}`.toLowerCase()
      return haystack.includes(normalizedFilter)
    })
  const filteredClients = filterClientsForDocumentPreview(clients, clientFilter)

  const modeBtn = (m: Mode, label: string) => (
    <button
      onClick={() => switchMode(m)}
      className="flex-1 h-8 rounded text-[12px] font-semibold border transition-colors"
      style={{
        borderColor: mode === m ? "var(--brand)" : "var(--border)",
        background: mode === m ? "var(--brand)" : "transparent",
        color: mode === m ? "#fff" : "var(--text-dim)",
      }}
    >
      {label}
    </button>
  )

  return (
    <div className="flex h-screen">
      <style>{`@font-face{font-family:'NotoSansPreview';src:url('/fonts/NotoSans-Regular.ttf') format('truetype');font-display:swap;}`}</style>
      <div className="flex-1 overflow-auto p-4" style={{ position: "relative" }}>
        <PdfFieldLayer
          pdfUrl={mapping.pdfPath}
          page={page}
          fields={pageFields}
          valueOf={idx => (sample ? resolveField(sample, mapping.fields[idx].dataKey) : "")}
          dims={dims}
          onReady={setDims}
          onPageCount={handlePageCount}
          selected={selected}
          onSelect={idx => selectField(idx)}
          editable
          onMove={(idx, x, y) => updateField(idx, { x, y })}
        >
          <div
            onClick={placePoint}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              cursor: mode === "select" ? "default" : "crosshair",
              pointerEvents: mode === "select" ? "none" : "auto",
            }}
          />
        </PdfFieldLayer>
      </div>

      <aside className="w-80 border-l border-border overflow-auto p-4">
        <Link
          href="/documents/admin"
          className="mb-3 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-btn border border-border bg-surface px-2.5 text-[12px] font-medium text-text hover:bg-surface-hover"
        >
          <ArrowLeft size={13} /> Wróć do admina
        </Link>
        <div className="flex gap-1.5 mb-2">
          {modeBtn("select", "Zaznacz")}
          {modeBtn("grid", "+ Grid")}
        </div>
        {mode === "grid" && (
          <div className="text-[11px] text-text-mute mb-4">
            Kliknij pozycję nowego pola
          </div>
        )}

        <div className="mb-4">
          <label className="block text-[11px] text-text-mute mb-1">Klient-próbka</label>
          <label className="relative mb-2 block">
            <Search size={13} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-text-mute" />
            <input
              value={clientFilter}
              onChange={e => setClientFilter(e.target.value)}
              className="w-full rounded-btn border border-border bg-surface py-1.5 pl-7 pr-2 text-[12px] text-text"
              placeholder="Szukaj klienta, email, telefon, sprawa"
            />
          </label>
          <select
            className="w-full bg-surface border border-border rounded px-2 py-1 text-[12px]"
            onChange={e => setSample(clients.find(c => String(c.id) === e.target.value) ?? null)}
          >
            <option value="">- podgląd kluczy -</option>
            {filteredClients.map(c => (
              <option key={c.id} value={c.id}>
                {c.NumerSprawy ? `${c.Name} - ${c.NumerSprawy}` : c.Name}
              </option>
            ))}
          </select>
          {clientFilter && filteredClients.length === 0 && (
            <div className="mt-1 text-[11px] text-text-mute">Brak klientów pasujących do wyszukiwania.</div>
          )}
        </div>

        <div className="mb-4 flex items-center gap-2">
          <label className="text-[11px] text-text-mute">Strona</label>
          <button
            type="button"
            onClick={() => setPage(current => previousPdfPage(current, pageCount))}
            disabled={page <= 1}
            className="inline-flex h-7 w-7 items-center justify-center rounded border border-border text-text-dim hover:bg-surface-hover disabled:opacity-40"
            title="Poprzednia strona"
          >
            <ChevronLeft size={13} />
          </button>
          <input
            type="number"
            min={1}
            max={pageCount}
            value={page}
            onChange={e => setPage(clampPdfPage(parseInt(e.target.value) || 1, pageCount))}
            className="w-16 bg-surface border border-border rounded px-2 py-1 text-[12px]"
          />
          <span className="text-[11px] text-text-mute">/ {pageCount}</span>
          <button
            type="button"
            onClick={() => setPage(current => nextPdfPage(current, pageCount))}
            disabled={page >= pageCount}
            className="inline-flex h-7 w-7 items-center justify-center rounded border border-border text-text-dim hover:bg-surface-hover disabled:opacity-40"
            title="Następna strona"
          >
            <ChevronRight size={13} />
          </button>
        </div>

        <div className="mb-4 border-t border-border pt-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-bold uppercase text-text-mute">Pola mappingu</div>
              <div className="text-[11px] text-text-mute">{mapping.fields.length} pól w szablonie</div>
            </div>
          </div>
          <label className="relative mb-3 block">
            <Search size={13} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-text-mute" />
            <input
              value={fieldFilter}
              onChange={e => setFieldFilter(e.target.value)}
              className="w-full rounded-btn border border-border bg-surface py-1.5 pl-7 pr-2 text-[12px] text-text"
              placeholder="Filtruj po dataKey, labelu lub stronie"
            />
          </label>

          <div className="flex max-h-[48vh] flex-col gap-2 overflow-auto pr-1">
            {filteredFields.map(({ f, idx, label }) => {
              const isOpen = selected === idx
              const selectValue = definitionByDataKey.has(f.dataKey) ? f.dataKey : ""
              return (
                <div key={idx} className="rounded-btn border border-border bg-surface text-[12px]">
                  <button
                    type="button"
                    onClick={() => selectField(idx, f.page)}
                    className="flex w-full items-center gap-2 px-2.5 py-2 text-left hover:bg-surface-hover"
                  >
                    {isOpen ? (
                      <ChevronDown size={14} className="shrink-0 text-text-mute" />
                    ) : (
                      <ChevronRight size={14} className="shrink-0 text-text-mute" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-text">
                        #{idx + 1} {label || "Brak dataKey"}
                      </div>
                      <div className="truncate font-mono text-[10px] text-text-mute">
                        str. {f.page} · {f.type ?? "text"} · {f.dataKey || "custom"}
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="flex flex-col gap-2 border-t border-border p-2.5">
                      <label className="text-[11px] text-text-mute">
                        Słownik pól
                        <select
                          value={selectValue}
                          onChange={e => e.target.value && updateField(idx, { dataKey: e.target.value })}
                          className="mt-1 w-full rounded-btn border border-border bg-bg px-2 py-1 text-[12px] text-text"
                        >
                          <option value="">
                            {fieldDefinitionOptions.length ? "Custom dataKey" : "Słownik pól nie został wczytany"}
                          </option>
                          {fieldDefinitionOptions.map(opt => (
                            <option key={opt.id} value={opt.dataKey}>
                              {opt.category ? `${opt.category} - ${opt.label}` : opt.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      {usingPresetFieldDefinitions && (
                        <div className="rounded-btn border border-border bg-bg px-2 py-1.5 text-[11px] text-text-mute">
                          Używam pól z modelu klienta. Aby zapisać je w bazie słownika, użyj /documents/admin.
                        </div>
                      )}
                      {fieldDefinitionOptions.length === 0 && (
                        <div className="rounded-btn border border-border bg-bg px-2 py-1.5 text-[11px] text-text-mute">
                          Dodaj pola w /documents/admin, potem odśwież edytor.
                        </div>
                      )}
                      <label className="text-[11px] text-text-mute">
                        dataKey ręcznie
                        <input
                          value={f.dataKey}
                          onChange={e => updateField(idx, { dataKey: e.target.value })}
                          list={`document-field-definition-options-${idx}`}
                          className="mt-1 w-full rounded-btn border border-border bg-bg px-2 py-1 text-[12px] text-text"
                        />
                        <datalist id={`document-field-definition-options-${idx}`}>
                          {fieldDefinitionOptions.map(opt => (
                            <option key={opt.id} value={opt.dataKey}>{opt.label}</option>
                          ))}
                        </datalist>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="text-[11px] text-text-mute">
                          x
                          <input
                            type="number"
                            value={f.x}
                            onChange={e => updateField(idx, { x: parseFloat(e.target.value) })}
                            className="mt-1 w-full rounded-btn border border-border bg-bg px-2 py-1 text-[12px] text-text"
                          />
                        </label>
                        <label className="text-[11px] text-text-mute">
                          y
                          <input
                            type="number"
                            value={f.y}
                            onChange={e => updateField(idx, { y: parseFloat(e.target.value) })}
                            className="mt-1 w-full rounded-btn border border-border bg-bg px-2 py-1 text-[12px] text-text"
                          />
                        </label>
                        <label className="text-[11px] text-text-mute">
                          fontSize
                          <input
                            type="number"
                            value={f.fontSize ?? DEFAULT_FONT_SIZE}
                            onChange={e => updateField(idx, { fontSize: parseFloat(e.target.value) })}
                            className="mt-1 w-full rounded-btn border border-border bg-bg px-2 py-1 text-[12px] text-text"
                          />
                        </label>
                        <label className="text-[11px] text-text-mute">
                          boxWidth
                          <input
                            type="number"
                            step="0.1"
                            value={f.boxWidth ?? DEFAULT_BOX_WIDTH}
                            onChange={e => updateField(idx, { boxWidth: parseFloat(e.target.value) })}
                            className="mt-1 w-full rounded-btn border border-border bg-bg px-2 py-1 text-[12px] text-text"
                          />
                        </label>
                        <label className="text-[11px] text-text-mute">
                          maxCharsPerRow
                          <input
                            type="number"
                            value={f.maxCharsPerRow ?? DEFAULT_MAX_CHARS}
                            onChange={e => updateField(idx, { maxCharsPerRow: parseInt(e.target.value) })}
                            className="mt-1 w-full rounded-btn border border-border bg-bg px-2 py-1 text-[12px] text-text"
                          />
                        </label>
                        <label className="text-[11px] text-text-mute">
                          rowHeight
                          <input
                            type="number"
                            value={f.rowHeight ?? DEFAULT_ROW_HEIGHT}
                            onChange={e => updateField(idx, { rowHeight: parseFloat(e.target.value) })}
                            className="mt-1 w-full rounded-btn border border-border bg-bg px-2 py-1 text-[12px] text-text"
                          />
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteField(idx)}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-btn border border-border text-[12px] font-medium text-[var(--danger)] hover:bg-surface-hover"
                      >
                        <Trash2 size={13} /> Usuń pole
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
            {filteredFields.length === 0 && (
              <div className="rounded-btn border border-border bg-surface px-3 py-4 text-center text-[12px] text-text-mute">
                Brak pól pasujących do filtra.
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full h-9 rounded bg-[var(--brand)] text-white text-[13px] font-semibold mb-2"
        >
          Zapisz
        </button>
        <button
          onClick={handleGenerate}
          className="w-full h-9 rounded border border-border text-[13px] font-medium mb-3"
        >
          Generuj prawdziwy PDF
        </button>
        {pdfUrl && <iframe src={pdfUrl} className="w-full h-64 border border-border rounded" title="PDF" />}
        <div className="text-[11px] text-text-mute mt-3">{status}</div>
      </aside>
    </div>
  )
}
