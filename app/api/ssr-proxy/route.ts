import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const path = searchParams.get('path') || '/'
  
  // Przekierowanie na odpowiedniÄ… Ĺ›cieĹĽkÄ™ z flagÄ… wskazujÄ…cÄ…, ĹĽe jest to SSR
  return NextResponse.redirect(new URL(`${path}?ssr=true`, request.url))
} 