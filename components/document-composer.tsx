"use client"

import { useState } from "react"
import { ChevronLeft, Download } from "lucide-react"
import { PdfFieldLayer } from "@/components/pdf-field-layer"
import { seedValues, buildOverrides } from "@/lib/document-overrides"
import type { PageDims } from "@/lib/pdf-coords"
import type { Client } from "@/lib/superbase"
import type { DocumentMapping } from "@/lib/document-types"

type Pos = Record<number, { x?: number; y?: number; fontSize?: number }>

interface Props {
  templateId: string
  mapping: DocumentMapping
  client: Client | null
  onBack: () => void
  onNew: () => void
}

export function DocumentComposer({ templateId, mapping, client, onBack, onNew }: Props) {
  const [values, setValues] = useState<string[]>(() => seedValues(client, mapping.fields))
  const [pos, setPos] = useState<Pos>({})
  const [page, setPage] = useState(1)
  const [dims, setDims] = useState<PageDims | null>(null)
  const [selected, setSelected] = useState(-1)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const effectiveFields = mapping.fields.map((f, i) => ({
    ...f,
    x: pos[i]?.x ?? f.x,
    y: pos[i]?.y ?? f.y,
    fontSize: pos[i]?.fontSize ?? f.fontSize,
  }))
  const pageFields = effectiveFields.map((f, idx) => ({ f, idx })).filter(({ f }) => f.page === page)

  function setValue(idx: number, v: string) {
    setValues(vs => vs.map((x, i) => (i === idx ? v : x)))
  }

  function setPosField(idx: number, patch: { x?: number; y?: number; fontSize?: number }) {
    setPos(p => ({ ...p, [idx]: { ...p[idx], ...patch } }))
  }

  async function generate(): Promise<string | null> {
    setIsGenerating(true)
    setError(null)
    try {
      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, overrides: buildOverrides(values, pos) }),
      })
      if (!res.ok) {
        const e = await res.json()
        setError(`Błąd generowania: ${e.error}`)
        return null
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
      return url
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleDownload() {
    const url = pdfUrl ?? (await generate())
    if (!url) return
    const a = document.createElement("a")
    a.href = url
    a.download = `${templateId}-${client?.Name?.replace(/\s+/g, "_") ?? "reczne"}.pdf`
    a.click()
  }

  const sel = selected >= 0 ? mapping.fields[selected] : null

  return (
    <div className="flex h-screen">
      {/* ta sama czcionka co w generowanym PDF (osadzona NotoSans) */}
      <style>{`@font-face{font-family:'NotoSansPreview';src:url('/fonts/NotoSans-Regular.ttf') format('truetype');font-display:swap;}`}</style>

      <div className="flex-1 overflow-auto p-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 h-8 rounded-btn border border-border bg-transparent text-text text-[12.5px] font-medium hover:bg-surface-hover transition-colors mb-4 cursor-pointer"
        >
          <ChevronLeft size={13} /> Wróć do wyboru
        </button>
        <PdfFieldLayer
          pdfUrl={mapping.pdfPath}
          page={page}
          fields={pageFields}
          valueOf={idx => values[idx] ?? ""}
          dims={dims}
          onReady={setDims}
          selected={selected}
          onSelect={setSelected}
          editable
          onMove={(idx, x, y) => setPosField(idx, { x, y })}
        />
      </div>

      <aside className="w-80 border-l border-border overflow-auto p-4">
        <div className="mb-3 flex items-center gap-2">
          <label className="text-[11px] text-text-mute">Strona</label>
          <input
            type="number"
            min={1}
            value={page}
            onChange={e => setPage(parseInt(e.target.value) || 1)}
            className="w-16 bg-surface border border-border rounded px-2 py-1 text-[12px]"
          />
          <span className="text-[11px] text-text-mute">
            {client ? client.Name : "Dane ręczne"}
          </span>
        </div>

        <div className="flex flex-col gap-2 mb-4">
          {pageFields.map(({ f, idx }) => (
            <div
              key={idx}
              className="border rounded p-2"
              style={{ borderColor: idx === selected ? "var(--brand)" : "var(--border)" }}
            >
              <label className="block text-[10.5px] text-text-mute mb-1 font-mono truncate" title={f.dataKey}>
                {f.dataKey || "(pole ręczne)"}
              </label>
              <input
                value={values[idx] ?? ""}
                onFocusCapture={() => setSelected(idx)}
                onChange={e => setValue(idx, e.target.value)}
                className="w-full bg-surface border border-border rounded px-2 py-1 text-[12px]"
              />
            </div>
          ))}
          {pageFields.length === 0 && (
            <div className="text-[11px] text-text-mute">Brak pól na tej stronie.</div>
          )}
        </div>

        {sel && (
          <div className="border border-border rounded p-3 mb-4">
            <div className="text-[11px] font-bold text-text-mute uppercase mb-2">
              Wyrównanie pola #{selected}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-[11px] text-text-mute">
                x
                <input
                  type="number"
                  value={pos[selected]?.x ?? sel.x}
                  onChange={e => setPosField(selected, { x: parseFloat(e.target.value) })}
                  className="w-full bg-surface border border-border rounded px-2 py-1 text-[12px]"
                />
              </label>
              <label className="text-[11px] text-text-mute">
                y
                <input
                  type="number"
                  value={pos[selected]?.y ?? sel.y}
                  onChange={e => setPosField(selected, { y: parseFloat(e.target.value) })}
                  className="w-full bg-surface border border-border rounded px-2 py-1 text-[12px]"
                />
              </label>
              <label className="text-[11px] text-text-mute">
                fontSize
                <input
                  type="number"
                  value={pos[selected]?.fontSize ?? sel.fontSize}
                  onChange={e => setPosField(selected, { fontSize: parseFloat(e.target.value) })}
                  className="w-full bg-surface border border-border rounded px-2 py-1 text-[12px]"
                />
              </label>
            </div>
            <div className="text-[10.5px] text-text-mute mt-2">
              Zmiany pozycji dotyczą tylko tego dokumentu - nie zapisują się do mappingu.
            </div>
          </div>
        )}

        <button
          onClick={() => generate()}
          disabled={isGenerating}
          className="w-full h-9 rounded bg-[var(--brand)] text-white text-[13px] font-semibold mb-2 disabled:opacity-50"
        >
          {isGenerating ? "Generowanie..." : "Generuj"}
        </button>
        <button
          onClick={handleDownload}
          disabled={isGenerating}
          className="w-full h-9 rounded border border-border text-[13px] font-medium mb-2 inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <Download size={13} /> Pobierz PDF
        </button>
        <button
          onClick={onNew}
          className="w-full h-9 rounded border border-border text-[13px] font-medium mb-3"
        >
          Nowy dokument
        </button>

        {error && <div className="text-[11px] text-red-500 mb-2">{error}</div>}
        {pdfUrl && <iframe src={pdfUrl} className="w-full h-64 border border-border rounded" title="PDF" />}
      </aside>
    </div>
  )
}
