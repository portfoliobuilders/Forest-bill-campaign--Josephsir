import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/ssr'

export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? ''
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false
  const allowlist = getAdminEmails()
  if (allowlist.length === 0) return false
  return allowlist.includes(email.trim().toLowerCase())
}

export async function getAdminSession(): Promise<{ email: string } | null> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email || !isAdminEmail(user.email)) {
    return null
  }

  return { email: user.email }
}

export async function requireAdminSession(): Promise<{ email: string }> {
  const session = await getAdminSession()
  if (!session) {
    throw new Error('unauthorized')
  }
  return session
}
