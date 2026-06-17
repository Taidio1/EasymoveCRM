export function clampPdfPage(page: number, pageCount: number): number {
  const safePageCount = Math.max(1, Math.floor(pageCount) || 1)
  const safePage = Math.floor(page) || 1
  return Math.min(Math.max(safePage, 1), safePageCount)
}

export function previousPdfPage(page: number, pageCount: number): number {
  return clampPdfPage(page - 1, pageCount)
}

export function nextPdfPage(page: number, pageCount: number): number {
  return clampPdfPage(page + 1, pageCount)
}
