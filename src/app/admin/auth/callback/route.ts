import { NextResponse, type NextRequest } from 'next/server'

import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

  if (!url || !anon || !siteUrl) {
    return NextResponse.redirect(new URL('/admin/login?error=config', request.url))
  }

  const code = request.nextUrl.searchParams.get('code')
  const next = request.nextUrl.searchParams.get('next') ?? '/admin'

  const redirectTo = new URL(next.startsWith('/admin') ? next : '/admin', siteUrl)
  const response = NextResponse.redirect(redirectTo)

  if (!code) {
    return NextResponse.redirect(new URL('/admin/login?error=missing_code', request.url))
  }

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
