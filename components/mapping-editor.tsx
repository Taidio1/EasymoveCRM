"use client"

import { type CSSProperties, type MouseEvent as ReactMouseEvent, useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { resolveField } from "@/lib/document-resolver"
import { pointToPixel, pixelToPoint, layoutGrid, type PageDims } from "@/lib/pdf-coords"
import { getClients, supabase, type Client } from "@/lib/superbase"
import type { DocumentMapping, FieldMapping } from "@/lib/document-types"

// pdfjs-dist dotyka globali przeglądarki — ładuj wyłącznie po stronie klienta.
const PdfCanvas = dynamic(() => import("@/components/pdf-canvas").then(m => m.PdfCanvas), {
  ssr: false,
})

function previewStyle(x: number, y: number, fontSizePt: number, d: PageDims): CSSProperties {
  const scale = d.imageHeightPx / d.pageHeightPt
  return {
    position: "absolute",
    left: x,
    top: y,
    transform: "translateY(-100%)",
    fontSize: fontSizePt * scale,
    fontFamily: "var(--font-sans), sans-serif",
    color: "#111",
    whiteSpace: "nowrap",
    pointerEvents: "none",
    zIndex: 2,
  }
}

export function MappingEditor({ templateId }: { templateId: string }) {
  const [mapping, setMapping] = useState<DocumentMapping | null>(null)
  const [page, setPage] = useState(1)
  const [dims, setDims] = useState<PageDims | null>(null)
  const [selected, setSelected] = useState<number>(-1)
  const [clients, setClients] = useState<Client[]>([])
  const [sample, setSample] = useState<Client | null>(null)
  const [status, setStatus] = useState("")
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/documents/mappings/${templateId}`)
      .then(r => r.json())
      .then((m: DocumentMapping) => setMapping(m))
      .catch(() => setStatus("Nie udało się wczytać mappingu"))
    getClients().then(setClients).catch(() => {})
  }, [templateId])

  function updateField(idx: number, patch: Partial<FieldMapping>) {
    setMapping(m => (m ? { ...m, fields: m.fields.map((f, i) => (i === idx ? { ...f, ...patch } : f)) } : m))
  }

  function startDrag(e: ReactMouseEvent, idx: number) {
    e.preventDefault()
    setSelected(idx)
    const wrapper = (e.currentTarget as HTMLElement).parentElement!.parentElement!
    const move = (ev: MouseEvent) => {
      if (!dims) return
      const rect = wrapper.getBoundingClientRect()
      const pt = pixelToPoint(ev.clientX - rect.left, ev.clientY - rect.top, dims)
      updateField(idx, { x: pt.x, y: pt.y })
    }
    const up = () => {
      window.removeEventListener("mousemove", move)
      window.removeEventListener("mouseup", up)
    }
    window.addEventListener("mousemove", move)
    window.addEventListener("mouseup", up)
  }

  async function handleSave() {
    if (!mapping) return
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) {
      setStatus("Brak sesji — zaloguj się")
      return
    }
    const res = await fetch(`/api/documents/mappings/${templateId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(mapping),
    })
    const body = await res.json()
    setStatus(
      res.ok
        ? "✓ Zapisano"
        : `Błąd: ${body.error}${body.details ? " — " + body.details.join("; ") : ""}`,
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

  if (!mapping) return <div className="p-6 text-text-mute">Ładowanie…</div>

  const pageFields = mapping.fields
    .map((f, idx) => ({ f, idx }))
    .filter(({ f }) => f.page === page)

  return (
    <div className="flex h-screen">
      <div className="flex-1 overflow-auto p-4" style={{ position: "relative" }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <PdfCanvas pdfUrl={mapping.pdfPath} page={page} onReady={setDims} />
          {dims &&
            pageFields.map(({ f, idx }) => {
              const px = pointToPixel(f.x, f.y, dims)
              const value = sample ? resolveField(sample, f.dataKey) : f.dataKey
              return (
                <div key={idx}>
                  <div
                    onMouseDown={e => startDrag(e, idx)}
                    onClick={() => setSelected(idx)}
                    title={f.dataKey}
                    style={{
                      position: "absolute",
                      left: px.x,
                      top: px.y,
                      width: 12,
                      height: 12,
                      marginLeft: -6,
                      marginTop: -6,
                      borderRadius: "50%",
                      cursor: "grab",
                      background: f.type === "grid" ? "var(--success)" : "var(--brand)",
                      boxShadow: idx === selected ? "0 0 0 3px white" : "none",
                      zIndex: 3,
                    }}
                  />
                  {sample &&
                    (f.type === "grid"
                      ? layoutGrid(value, f).map((g, gi) => {
                          const gp = pointToPixel(g.x, g.y, dims)
                          return (
                            <span key={gi} style={previewStyle(gp.x, gp.y, f.fontSize, dims)}>
                              {g.char}
                            </span>
                          )
                        })
                      : (
                          <span style={previewStyle(px.x, px.y, f.fontSize, dims)}>{value}</span>
                        ))}
                </div>
              )
            })}
        </div>
      </div>

      <aside className="w-80 border-l border-border overflow-auto p-4">
        <div className="mb-4">
          <label className="block text-[11px] text-text-mute mb-1">Klient-próbka</label>
          <select
            className="w-full bg-surface border border-border rounded px-2 py-1 text-[12px]"
            onChange={e => setSample(clients.find(c => String(c.id) === e.target.value) ?? null)}
          >
            <option value="">— podgląd kluczy —</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.Name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <label className="text-[11px] text-text-mute">Strona</label>
          <input
            type="number"
            min={1}
            value={page}
            onChange={e => setPage(parseInt(e.target.value) || 1)}
            className="w-16 bg-surface border border-border rounded px-2 py-1 text-[12px]"
          />
        </div>

        {selected >= 0 && mapping.fields[selected] && (() => {
          const f = mapping.fields[selected]
          return (
            <div className="border border-border rounded p-3 mb-4 flex flex-col gap-2">
              <div className="text-[11px] font-bold text-text-mute uppercase">Pole #{selected}</div>
              <label className="text-[11px] text-text-mute">
                dataKey
                <input
                  value={f.dataKey}
                  onChange={e => updateField(selected, { dataKey: e.target.value })}
                  className="w-full bg-surface border border-border rounded px-2 py-1 text-[12px]"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px] text-text-mute">
                  x
                  <input
                    type="number"
                    value={f.x}
                    onChange={e => updateField(selected, { x: parseFloat(e.target.value) })}
                    className="w-full bg-surface border border-border rounded px-2 py-1 text-[12px]"
                  />
                </label>
                <label className="text-[11px] text-text-mute">
                  y
                  <input
                    type="number"
                    value={f.y}
                    onChange={e => updateField(selected, { y: parseFloat(e.target.value) })}
                    className="w-full bg-surface border border-border rounded px-2 py-1 text-[12px]"
                  />
                </label>
                <label className="text-[11px] text-text-mute">
                  fontSize
                  <input
                    type="number"
                    value={f.fontSize}
                    onChange={e => updateField(selected, { fontSize: parseFloat(e.target.value) })}
                    className="w-full bg-surface border border-border rounded px-2 py-1 text-[12px]"
                  />
                </label>
                {f.type === "grid" && (
                  <label className="text-[11px] text-text-mute">
                    boxWidth
                    <input
                      type="number"
                      step="0.1"
                      value={f.boxWidth ?? 0}
                      onChange={e => updateField(selected, { boxWidth: parseFloat(e.target.value) })}
                      className="w-full bg-surface border border-border rounded px-2 py-1 text-[12px]"
                    />
                  </label>
                )}
              </div>
            </div>
          )
        })()}

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
