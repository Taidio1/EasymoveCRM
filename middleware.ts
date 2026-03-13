import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// MOCK: Because we don't have @supabase/ssr installed, this middleware
// shows the standard Next.js + Supabase implementation.
// We are checking a standard auth cookie 'sb-*-auth-token' or doing an API call.
// The task requires writing the code to add it.

export async function middleware(request: NextRequest) {
  // Try to get token from cookies
  // (In a real app using @supabase/ssr, you'd use createServerClient)
  const supabaseAuthCookie = request.cookies.getAll().find(c => c.name.includes('-auth-token'))

  const isAuthPage = request.nextUrl.pathname.startsWith('/login')
  const isPortal = request.nextUrl.pathname.startsWith('/portal')
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard') ||
                      request.nextUrl.pathname.startsWith('/clients')

  // If no auth cookie, redirect to login unless already on login
  if (!supabaseAuthCookie) {
    if (isPortal || isDashboard) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  try {
    // Decode the JWT from the cookie to get user metadata / role
    // Supabase stores the token as a JSON array where the first item is the access token string.
    // E.g. ["access_token", "refresh_token", ...]
    const cookieValue = JSON.parse(supabaseAuthCookie.value)
    const accessToken = Array.isArray(cookieValue) ? cookieValue[0] : cookieValue

    // Quick JWT decode (don't use this in production for critical validation, just for routing)
    const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString())

    // In Supabase, user_metadata holds custom fields like role
    const role = payload.user_metadata?.role || 'Client'

    const isClient = role === 'Client'
    const isStaff = role === 'Admin' || role === 'Boss' || role === 'Pracownik'

    // Redirect clients trying to access staff pages
    if (isClient && isDashboard) {
      return NextResponse.redirect(new URL('/portal', request.url))
    }

    // Redirect staff trying to access client portal
    if (isStaff && isPortal) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Redirect authenticated users away from login
    if (isAuthPage) {
      if (isStaff) return NextResponse.redirect(new URL('/dashboard', request.url))
      if (isClient) return NextResponse.redirect(new URL('/portal', request.url))
    }

  } catch (e) {
    // If decoding fails, continue or force login
    if (isPortal || isDashboard) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/login',
    '/portal/:path*',
    '/dashboard/:path*',
    '/clients/:path*',
  ],
}
