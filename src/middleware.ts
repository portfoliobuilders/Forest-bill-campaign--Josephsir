import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

import {
  canonicalizeAdminPathname,
  isAdminPath,
  isAdminPublicPath,
} from '@/lib/admin/paths'
import { PREVIEW_COOKIE } from '@/lib/preview-cookie'

function persistPreviewCookie(request: NextRequest, response: NextResponse): void {
  const token = request.nextUrl.searchParams.get('preview')?.trim()
  if (!token) return
  response.cookies.set(PREVIEW_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
}

function nextWithPathname(request: NextRequest): NextResponse {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)
  if (isAdminPublicPath(request.nextUrl.pathname)) {
    requestHeaders.set('x-admin-public', '1')
  }
  const response = NextResponse.next({ request: { headers: requestHeaders } })
  persistPreviewCookie(request, response)
  return response
}

export async function middleware(request: NextRequest) {
  // Next.js 15.5.23 (>= 15.2.3) patches CVE-2025-29927. Admin routes still
  // verify the session and ADMIN_EMAILS allowlist in the server layout.
  const canonical = canonicalizeAdminPathname(request.nextUrl.pathname)
  if (canonical) {
    const url = request.nextUrl.clone()
    url.pathname = canonical
    const redirected = NextResponse.redirect(url, 308)
    persistPreviewCookie(request, redirected)
    return redirected
  }

  const previewToken = request.nextUrl.searchParams.get('preview')?.trim()
  if (previewToken) {
    request.cookies.set(PREVIEW_COOKIE, previewToken)
  }

  const pathname = request.nextUrl.pathname

  if (!isAdminPath(pathname) || isAdminPublicPath(pathname)) {
    return nextWithPathname(request)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !anon) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/admin/login'
    const redirected = NextResponse.redirect(loginUrl)
    persistPreviewCookie(request, redirected)
    return redirected
  }

  let response = nextWithPathname(request)

  const supabase = createServerClient(supabaseUrl, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Convenience layer only: send anonymous visitors to login.
  // Allowlisted vs not-allowlisted is decided in src/app/admin/layout.tsx.
  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/admin/login'
    if (pathname !== '/admin/login') {
      loginUrl.searchParams.set('next', pathname + request.nextUrl.search)
    }
    response = NextResponse.redirect(loginUrl)
    persistPreviewCookie(request, response)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
