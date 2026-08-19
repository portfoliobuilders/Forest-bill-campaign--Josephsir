'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

function readAuthError(): 'expired' | 'auth' | null {
  const search = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const error = search.get('error') || hash.get('error')
  const code = search.get('error_code') || hash.get('error_code')
  const description = `${search.get('error_description') || ''} ${hash.get('error_description') || ''}`.toLowerCase()
  if (!error && !code) return null
  if (code === 'otp_expired' || description.includes('expired') || description.includes('invalid')) {
    return 'expired'
  }
  return 'auth'
}

function needsCallbackHandoff(): boolean {
  const path = window.location.pathname
  if (path === '/auth/callback' || path.startsWith('/admin/auth/')) return false
  const search = new URLSearchParams(window.location.search)
  return search.has('code') || search.has('token_hash')
}

/** Sends expired/invalid Supabase magic links to admin login instead of a blank home crash. */
export function AuthErrorCatcher() {
  const router = useRouter()

  useEffect(() => {
    if (needsCallbackHandoff()) {
      router.replace(`/auth/callback${window.location.search}`)
      return
    }
    const kind = readAuthError()
    if (!kind) return
    router.replace(kind === 'expired' ? '/admin/login?error=expired' : '/admin/login?error=auth')
  }, [router])

  return null
}
