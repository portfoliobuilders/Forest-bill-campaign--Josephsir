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

    if (mailed.error !== 'config' && mailed.error !== 'mailer_missing') {
      return mailed
    }

    const { cookies } = await import('next/headers')
    const { createServerSupabaseClient } = await import('@/lib/supabase/ssr')
    const cookieStore = await cookies()
    const lastTry = Number(cookieStore.get('admin_link_try')?.value || '0')
    if (Number.isFinite(lastTry) && Date.now() - lastTry < 15 * 60 * 1000) {
      return { ok: false, error: 'rate_limit' }
    }

    const supabase = await createServerSupabaseClient()
    cookieStore.set('admin_link_try', String(Date.now()), {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 60 * 60,
    })
    const { error } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${origin}/auth/callback`,
      },
    })
    if (!error) return { ok: true }
    const message = error.message.toLowerCase()
    if (message.includes('rate') || message.includes('too many') || message.includes('second')) {
      return { ok: false, error: 'rate_limit' }
    }
    return { ok: false, error: 'config' }
  } catch {
    return { ok: false, error: 'config' }
  }
}

export async function verifyAdminLoginCode(
  email: string,
  token: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { isAdminEmail } = await import('@/lib/admin/auth')
    const { createServerSupabaseClient } = await import('@/lib/supabase/ssr')

    const normalized = email.trim().toLowerCase()
    const code = token.replace(/\s/g, '')
    if (!isAdminEmail(normalized)) {
      return { ok: false, error: 'not_allowed' }
    }
    if (!/^\d{6,8}$/.test(code)) {
      return { ok: false, error: 'invalid_code' }
    }

    const supabase = await createServerSupabaseClient()
    for (const type of ['email', 'magiclink'] as const) {
      const { error } = await supabase.auth.verifyOtp({
        email: normalized,
        token: code,
        type,
      })
      if (!error) return { ok: true }
      const message = error.message.toLowerCase()
      if (message.includes('expired')) return { ok: false, error: 'expired' }
    }
    return { ok: false, error: 'invalid_code' }
  } catch {
    return { ok: false, error: 'config' }
  }
}

export async function adminPasswordSignIn(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { isAdminEmail } = await import('@/lib/admin/auth')
    const {
      canUsePasswordLogin,
      verifyAdminPassword,
      writePasswordSession,
    } = await import('@/lib/admin/password-auth')

    const normalized = email.trim().toLowerCase()
    if (!canUsePasswordLogin(normalized, isAdminEmail(normalized))) {
      return { ok: false, error: 'not_allowed' }
    }
    if (!verifyAdminPassword(password)) {
      return { ok: false, error: 'wrong_password' }
    }
    await writePasswordSession(normalized)
    return { ok: true }
  } catch {
    return { ok: false, error: 'config' }
  }
}

export async function adminSignOut(): Promise<void> {
  const { createServerSupabaseClient } = await import('@/lib/supabase/ssr')
  const { clearPasswordSession } = await import('@/lib/admin/password-auth')
  const { redirect } = await import('next/navigation')
  await clearPasswordSession()
  try {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.signOut()
  } catch {
    // Password-only sessions have no Supabase session.
  }
  redirect('/admin/login')
}
