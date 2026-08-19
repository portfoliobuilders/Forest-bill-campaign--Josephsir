import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

import { PREVIEW_COOKIE } from '@/lib/preview-cookie'

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? ''
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

function isAdminPublicPath(pathname: string): boolean {
  return pathname === '/admin/login' || pathname.startsWith('/admin/auth/')
}

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

export async function middleware(request: NextRequest) {
  // Next.js 15.5.23 (>= 15.2.3) patches CVE-2025-29927. Admin routes still
  // verify the session and ADMIN_EMAILS allowlist in the server layout.
  const previewToken = request.nextUrl.searchParams.get('preview')?.trim()
  if (previewToken) {
    request.cookies.set(PREVIEW_COOKIE, previewToken)
  }

  let response = NextResponse.next({ request })
  persistPreviewCookie(request, response)

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!isAdminPath(request.nextUrl.pathname) || isAdminPublicPath(request.nextUrl.pathname)) {
    return response
  }

  if (url && anon) {
    const supabase = createServerClient(url, anon, {
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

    const allowlist = getAdminEmails()
    const email = user?.email?.trim().toLowerCase()
    const authorized = Boolean(email && allowlist.length > 0 && allowlist.includes(email))

    if (!authorized) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/admin/login'
      if (request.nextUrl.pathname !== '/admin/login') {
        loginUrl.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search)
      }
      response = NextResponse.redirect(loginUrl)
      persistPreviewCookie(request, response)
    }
  } else {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/admin/login'
    response = NextResponse.redirect(loginUrl)
    persistPreviewCookie(request, response)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
