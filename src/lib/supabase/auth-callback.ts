import { createServerClient } from '@supabase/ssr'
import type { EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

const OTP_TYPES = new Set<EmailOtpType>([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
])

function safeAdminNext(next: string | null): string {
  if (!next) return '/admin'
  if (!next.startsWith('/admin')) return '/admin'
  if (next.startsWith('//') || next.includes('://') || next.includes('\\')) return '/admin'
  return next
}

function loginErrorUrl(request: NextRequest, code: string): URL {
  return new URL(`/admin/login?error=${code}`, request.url)
}

/** Exchange a magic-link code or token hash for a session, then send the user to /admin. */
export async function handleAuthCallback(request: NextRequest): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anon) {
    return NextResponse.redirect(loginErrorUrl(request, 'config'))
  }

  const authError = request.nextUrl.searchParams.get('error')
  const errorCode = request.nextUrl.searchParams.get('error_code')
  if (authError || errorCode) {
    const expired =
      errorCode === 'otp_expired' ||
      (request.nextUrl.searchParams.get('error_description') ?? '').toLowerCase().includes('expired')
    return NextResponse.redirect(loginErrorUrl(request, expired ? 'expired' : 'auth'))
  }

  const tokenHash = request.nextUrl.searchParams.get('token_hash')
  const rawType = request.nextUrl.searchParams.get('type')
  const code = request.nextUrl.searchParams.get('code')
  if (!tokenHash && !code) {
    return NextResponse.redirect(loginErrorUrl(request, 'missing_code'))
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

  if (tokenHash) {
    const type = OTP_TYPES.has(rawType as EmailOtpType) ? (rawType as EmailOtpType) : 'magiclink'
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (error) {
      const expired = error.message.toLowerCase().includes('expired') || error.message.toLowerCase().includes('invalid')
      return NextResponse.redirect(loginErrorUrl(request, expired ? 'expired' : 'auth'))
    }
    return response
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code!)
  if (error) {
    return NextResponse.redirect(loginErrorUrl(request, 'auth'))
  }

  return response
}
