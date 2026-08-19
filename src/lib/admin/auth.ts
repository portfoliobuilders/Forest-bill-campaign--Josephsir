import 'server-only'

import { isAdminEmail } from '@/lib/admin/allowlist'
import { createServerSupabaseClient } from '@/lib/supabase/ssr'

export type AdminAccess =
  | { status: 'unauthenticated' }
  | { status: 'forbidden'; email: string }
  | { status: 'authorized'; email: string }

export { getAdminEmails, isAdminEmail } from '@/lib/admin/allowlist'

export async function getAdminAccess(): Promise<AdminAccess> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return { status: 'unauthenticated' }
  }

  const email = user.email.trim().toLowerCase()
  if (!isAdminEmail(email)) {
    return { status: 'forbidden', email: user.email }
  }

  return { status: 'authorized', email: user.email }
}

export async function getAdminSession(): Promise<{ email: string } | null> {
  const access = await getAdminAccess()
  if (access.status !== 'authorized') return null
  return { email: access.email }
}

export async function requireAdminSession(): Promise<{ email: string }> {
  const session = await getAdminSession()
  if (!session) {
    throw new Error('unauthorized')
  }
  return session
}

export type AdminRole = 'super_admin' | 'editor' | 'analyst'

/** v1: everyone on ADMIN_EMAILS is treated as super_admin. */
export function getAdminRole(email: string): AdminRole {
  void email
  return 'super_admin'
}
