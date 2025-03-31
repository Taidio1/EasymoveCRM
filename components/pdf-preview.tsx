"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, ChevronRight, Download, Printer, X } from "lucide-react"

interface PdfPreviewProps {
  pdfData: string | null
  onClose: () => void
}

declare global {
  interface Window {
    PDFViewerApplication: any; // lub dokładniejszy typ, jeśli go znasz
  }
}

export function PdfPreview({ pdfData, onClose }: PdfPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (pdfData) {
      setIsLoading(true)

      // Gdy iframe się załaduje, spróbuj uzyskać liczbę stron
      const handleIframeLoad = () => {
        try {
          if (iframeRef.current?.contentWindow?.PDFViewerApplication) {
            const pdfViewer = iframeRef.current.contentWindow.PDFViewerApplication
            pdfViewer.initialize().then(() => {
              setTotalPages(pdfViewer.pagesCount)
              setIsLoading(false)
            })
          }
        } catch (error) {
          console.error("Error accessing PDF viewer:", error)
          setIsLoading(false)
        }
      }

      if (iframeRef.current) {
        iframeRef.current.onload = handleIframeLoad
      }
    }
  }, [pdfData])

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
    if (iframeRef.current?.contentWindow?.PDFViewerApplication) {
      const pdfViewer = iframeRef.current.contentWindow.PDFViewerApplication
      pdfViewer.page = currentPage - 1
    }
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
    if (iframeRef.current?.contentWindow?.PDFViewerApplication) {
      const pdfViewer = iframeRef.current.contentWindow.PDFViewerApplication
      pdfViewer.page = currentPage + 1
    }
  }

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print()
    }
  }

  const handleDownload = () => {
    if (pdfData) {
      const link = document.createElement("a")
      link.href = pdfData
      link.download = "dokument.pdf"
      link.click()
    }
  }

  if (!pdfData) return null

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevPage} disabled={currentPage <= 1 || isLoading}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm">{isLoading ? "Ładowanie..." : `Strona ${currentPage} z ${totalPages}`}</span>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrint} disabled={isLoading}>
              <Printer className="h-4 w-4" />
            </Button>

            <Button variant="outline" size="icon" onClick={handleDownload} disabled={isLoading}>
              <Download className="h-4 w-4" />
            </Button>

            <Button variant="outline" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <CardContent className="p-0 flex-1 overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
              <Skeleton className="h-[80vh] w-full" />
            </div>
          )}

          <iframe ref={iframeRef} src={pdfData} className="w-full h-full min-h-[70vh]" title="PDF Preview" />
        </CardContent>
      </Card>
    </div>
  )
}

