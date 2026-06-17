"use client"

import { useEffect, useRef } from "react"
import * as pdfjsLib from "pdfjs-dist"
import type { PageDims } from "@/lib/pdf-coords"

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"

interface Props {
  pdfUrl: string
  page: number // 1-based
  renderScale?: number
  onReady?: (dims: PageDims) => void
}

export function PdfCanvas({ pdfUrl, page, renderScale = 2, onReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let cancelled = false
    const canvas = canvasRef.current
    if (!canvas) return

    ;(async () => {
      const doc = await pdfjsLib.getDocument(pdfUrl).promise
      if (cancelled) return
      const pdfPage = await doc.getPage(page)
      const viewport = pdfPage.getViewport({ scale: renderScale })
      const ctx = canvas.getContext("2d")!
      canvas.width = viewport.width
      canvas.height = viewport.height
      await pdfPage.render({ canvasContext: ctx, viewport }).promise
      if (cancelled) return
      const ptViewport = pdfPage.getViewport({ scale: 1 })
      onReady?.({
        pageWidthPt: ptViewport.width,
        pageHeightPt: ptViewport.height,
        imageWidthPx: viewport.width,
        imageHeightPx: viewport.height,
      })
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfUrl, page, renderScale])

  return <canvas ref={canvasRef} className="block max-w-none" />
}
