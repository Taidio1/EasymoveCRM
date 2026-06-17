"use client"

import { type CSSProperties, type MouseEvent as ReactMouseEvent, type ReactNode, useRef } from "react"
import dynamic from "next/dynamic"
import { pointToPixel, pixelToPoint, layoutGrid, type PageDims } from "@/lib/pdf-coords"
import type { FieldMapping } from "@/lib/document-types"

const PdfCanvas = dynamic(() => import("@/components/pdf-canvas").then(m => m.PdfCanvas), {
  ssr: false,
})

function previewStyle(
  x: number,
  y: number,
  fontSizePt: number,
  d: PageDims,
  maxWidthPt?: number,
): CSSProperties {
  const scale = d.imageHeightPx / d.pageHeightPt
  const base: CSSProperties = {
    position: "absolute",
    left: x,
    top: y,
    lineHeight: 1,
    transform: "translateY(-0.8em)",
    fontSize: fontSizePt * scale,
    fontFamily: "NotoSansPreview, var(--font-sans), sans-serif",
    color: "#111",
    whiteSpace: "nowrap",
    pointerEvents: "none",
    zIndex: 2,
  }
  if (maxWidthPt != null) {
    return { ...base, display: "inline-block", maxWidth: maxWidthPt * scale, overflow: "hidden", textOverflow: "ellipsis" }
  }
  return base
}

export interface PdfFieldLayerProps {
  pdfUrl: string
  page: number
  fields: { f: FieldMapping; idx: number }[]
  valueOf: (idx: number) => string
  dims: PageDims | null
  onReady: (d: PageDims) => void
  selected: number
  onSelect: (idx: number) => void
  editable: boolean
  onMove?: (idx: number, x: number, y: number) => void
  children?: ReactNode
}

export function PdfFieldLayer(props: PdfFieldLayerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  function startDrag(e: ReactMouseEvent, idx: number) {
    if (!props.editable || !props.onMove) return
    e.preventDefault()
    props.onSelect(idx)
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const move = (ev: MouseEvent) => {
      if (!props.dims) return
      const rect = wrapper.getBoundingClientRect()
      const pt = pixelToPoint(ev.clientX - rect.left, ev.clientY - rect.top, props.dims)
      props.onMove!(idx, pt.x, pt.y)
    }
    const up = () => {
      window.removeEventListener("mousemove", move)
      window.removeEventListener("mouseup", up)
    }
    window.addEventListener("mousemove", move)
    window.addEventListener("mouseup", up)
  }

  return (
    <div ref={wrapperRef} style={{ position: "relative", display: "inline-block" }}>
      <PdfCanvas pdfUrl={props.pdfUrl} page={props.page} onReady={props.onReady} />
      {props.children}
      {props.dims &&
        props.fields.map(({ f, idx }) => {
          const px = pointToPixel(f.x, f.y, props.dims!)
          const value = props.valueOf(idx)
          return (
            <div key={idx}>
              <div
                onMouseDown={e => startDrag(e, idx)}
                onClick={() => props.onSelect(idx)}
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
                  cursor: props.editable ? "grab" : "pointer",
                  background: f.type === "grid" ? "var(--success)" : "var(--brand)",
                  boxShadow: idx === props.selected ? "0 0 0 3px white" : "none",
                  zIndex: 3,
                }}
              />
              {value &&
                (f.type === "grid"
                  ? layoutGrid(value, f).map((g, gi) => {
                      const gp = pointToPixel(g.x, g.y, props.dims!)
                      return (
                        <span key={gi} style={previewStyle(gp.x, gp.y, f.fontSize, props.dims!)}>
                          {g.char}
                        </span>
                      )
                    })
                  : (
                      <span style={previewStyle(px.x, px.y, f.fontSize, props.dims!, f.maxWidth)}>{value}</span>
                    ))}
            </div>
          )
        })}
    </div>
  )
}
