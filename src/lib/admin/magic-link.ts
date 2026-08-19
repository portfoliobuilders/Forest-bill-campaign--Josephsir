import 'server-only'

import { Resend } from 'resend'

import { createServiceClient } from '@/lib/supabase/server'

function classifySendError(message: string): 'rate_limit' | 'redirect' | 'send_failed' {
  const text = message.toLowerCase()
  if (text.includes('rate') || text.includes('too many') || (text.includes('after') && text.includes('second'))) {
    return 'rate_limit'
  }
  if (text.includes('redirect') || text.includes('whitelist') || text.includes('allow list')) {
    return 'redirect'
  }
  return 'send_failed'
}

function loginEmail(link: string): { subject: string; text: string } {
  return {
    subject: 'ജനശബ്ദം admin sign-in',
    text: [
      'Use this link to sign in to the Janashabdam admin console.',
      'അഡ്മിൻ പ്രവേശന ലിങ്ക്:',
      '',
      link,
      '',
      'This link expires shortly and can be used once. Do not open localhost.',
      'ഈ ലിങ്ക് ഉടൻ കാലഹരണപ്പെടും. ഒരു തവണ മാത്രമേ ഉപയോഗിക്കാവൂ.',
    ].join('\n'),
  }
}

async function sendLinkEmail(to: string, link: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim()
  if (!apiKey || !fromEmail) return false

  const mail = loginEmail(link)
  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: fromEmail,
    to,
    subject: mail.subject,
    text: mail.text,
  })
  return !error
}

/**
 * Create a one-time admin login URL and email it through Resend.
 * Avoids Supabase's built-in mailer (rate limits / redirect allowlist).
 */
export async function emailAdminMagicLink(
  email: string,
  origin: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  let admin
  try {
    admin = createServiceClient()
  } catch {
    return { ok: false, error: 'config' }
  }

  const redirectTo = `${origin}/auth/callback`
  let { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo },
  })

  if (error && classifySendError(error.message) === 'redirect') {
    ;({ data, error } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    }))
  }

  if (error) {
    return { ok: false, error: classifySendError(error.message) }
  }

  const hashedToken = data.properties?.hashed_token
  const verificationType = data.properties?.verification_type || 'magiclink'
  if (!hashedToken) {
    return { ok: false, error: 'send_failed' }
  }

  const callback = new URL('/auth/callback', origin)
  callback.searchParams.set('token_hash', hashedToken)
  callback.searchParams.set('type', verificationType)
  callback.searchParams.set('next', '/admin')

  const sent = await sendLinkEmail(email, callback.toString())
  if (!sent) return { ok: false, error: 'mailer_missing' }
  return { ok: true }
}
