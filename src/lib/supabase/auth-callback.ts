import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function safeAdminNext(next: string | null): string {
  if (!next) return '/admin'
  if (!next.startsWith('/admin')) return '/admin'
  if (next.startsWith('//') || next.includes('://') || next.includes('\\')) return '/admin'
  return next
}

/** Exchange a magic-link code for a session, then send the user to /admin. */
export async function handleAuthCallback(request: NextRequest): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anon) {
    return NextResponse.redirect(new URL('/admin/login?error=config', request.url))
  }

  const authError = request.nextUrl.searchParams.get('error')
  const errorCode = request.nextUrl.searchParams.get('error_code')
  if (authError || errorCode) {
    const expired =
      errorCode === 'otp_expired' ||
      (request.nextUrl.searchParams.get('error_description') ?? '').toLowerCase().includes('expired')
    return NextResponse.redirect(
      new URL(expired ? '/admin/login?error=expired' : '/admin/login?error=auth', request.url),
    )
  }

  const code = request.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(new URL('/admin/login?error=missing_code', request.url))
  }

  const next = safeAdminNext(request.nextUrl.searchParams.get('next'))
  const redirectTo = new URL(next, request.nextUrl.origin)
  const response = NextResponse.redirect(redirectTo)

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(new URL('/admin/login?error=auth', request.url))
  }

  return response
}
