"use client"

import { useEffect, useRef } from "react"
import * as pdfjsLib from "pdfjs-dist"
import type { PageDims } from "@/lib/pdf-coords"
import { clampPdfPage } from "@/lib/pdf-page-navigation"

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"

interface Props {
  pdfUrl: string
  page: number // 1-based
  renderScale?: number
  onReady?: (dims: PageDims) => void
  onPageCount?: (pageCount: number) => void
}

export function PdfCanvas({ pdfUrl, page, renderScale = 2, onReady, onPageCount }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let cancelled = false
    const canvas = canvasRef.current
    if (!canvas) return

    ;(async () => {
      const doc = await pdfjsLib.getDocument(pdfUrl).promise
      if (cancelled) return
      onPageCount?.(doc.numPages)
      const pdfPage = await doc.getPage(clampPdfPage(page, doc.numPages))
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
  }, [pdfUrl, page, renderScale, onReady, onPageCount])

  return <canvas ref={canvasRef} className="block max-w-none" />
}
