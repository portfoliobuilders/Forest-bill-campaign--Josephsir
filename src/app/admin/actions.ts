'use server'

import { revalidatePath } from 'next/cache'

import { requireAdminSession } from '@/lib/admin/auth'
import { createServiceClient } from '@/lib/supabase/server'

export async function moderateCustomText(
  submissionId: string,
  approved: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdminSession()
  } catch {
    return { ok: false, error: 'unauthorized' }
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('submissions')
    .update({ custom_text_public: approved })
    .eq('id', submissionId)
    .not('custom_text', 'is', null)
    .neq('custom_text', '')

  if (error) return { ok: false, error: 'update_failed' }
  revalidatePath('/admin')
  return { ok: true }
}

export async function markDeletionHandled(
  requestId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdminSession()
  } catch {
    return { ok: false, error: 'unauthorized' }
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('deletion_requests')
    .update({ handled_at: new Date().toISOString() })
    .eq('id', requestId)
    .is('handled_at', null)

  if (error) return { ok: false, error: 'update_failed' }
  revalidatePath('/admin')
  return { ok: true }
}

export async function sendAdminMagicLink(
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { isAdminEmail } = await import('@/lib/admin/auth')
    const { emailAdminMagicLink } = await import('@/lib/admin/magic-link')
    const { resolvePublicOrigin } = await import('@/lib/site-url')
    const { createServerSupabaseClient } = await import('@/lib/supabase/ssr')

    const normalized = email.trim().toLowerCase()
    if (!isAdminEmail(normalized)) {
      return { ok: false, error: 'not_allowed' }
    }

    const origin = await resolvePublicOrigin()
    if (!origin) {
      return { ok: false, error: 'config' }
    }

    const mailed = await emailAdminMagicLink(normalized, origin)
    if (mailed.ok) return mailed

    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${origin}/auth/callback`,
      },
    })

    if (!error) return { ok: true }

    const fallbackKind = error.message.toLowerCase()
    if (fallbackKind.includes('rate') || fallbackKind.includes('too many') || fallbackKind.includes('second')) {
      return { ok: false, error: 'rate_limit' }
    }

    if (fallbackKind.includes('redirect') || fallbackKind.includes('whitelist') || fallbackKind.includes('allow list')) {
      const retry = await supabase.auth.signInWithOtp({
        email: normalized,
        options: { shouldCreateUser: true },
      })
      if (!retry.error) return { ok: true }
      if (retry.error.message.toLowerCase().includes('rate') || retry.error.message.toLowerCase().includes('second')) {
        return { ok: false, error: 'rate_limit' }
      }
    }

    if (mailed.error === 'rate_limit') return mailed
    return { ok: false, error: 'send_failed' }
  } catch {
    return { ok: false, error: 'config' }
  }
}

export async function adminSignOut(): Promise<void> {
  const { createServerSupabaseClient } = await import('@/lib/supabase/ssr')
  const { redirect } = await import('next/navigation')
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
