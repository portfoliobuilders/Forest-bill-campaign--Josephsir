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
  const { createServerSupabaseClient } = await import('@/lib/supabase/ssr')
  const { isAdminEmail } = await import('@/lib/admin/auth')

  if (!isAdminEmail(email)) {
    return { ok: false, error: 'not_allowed' }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) {
    return { ok: false, error: 'config' }
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      emailRedirectTo: `${siteUrl}/admin/auth/callback`,
    },
  })

  if (error) return { ok: false, error: 'send_failed' }
  return { ok: true }
}

export async function adminSignOut(): Promise<void> {
  const { createServerSupabaseClient } = await import('@/lib/supabase/ssr')
  const { redirect } = await import('next/navigation')
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
