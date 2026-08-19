'use server'

import { headers } from 'next/headers'
import { Resend } from 'resend'
import { z } from 'zod'

import { composeEmail } from '@/lib/compose'
import { getCampaignState, readPreviewToken } from '@/lib/campaign'
import { getClientIp, hashIp, hashOtp, verifyTurnstile } from '@/lib/security'
import { createServiceClient } from '@/lib/supabase/server'
import { normalizeIndianPhone } from '@/lib/phone'
import type { ObjectionClause, SendMethod } from '@/types/database'

import { CONSENT_VERSION } from '@/lib/consent'
import type { ActionResult } from '@/lib/submission-types'

const uuidSchema = z.uuid()
const langSchema = z.enum(['ml', 'en'])
const sendMethodSchema = z.enum(['gmail_web', 'mailto', 'copy', 'server', 'print'])

const createDraftSchema = z.object({
  turnstileToken: z.string().min(1),
  campaignSlug: z.string().min(1),
  fullName: z.string().trim().min(1),
  email: z.email(),
  phone: z.string().trim().min(1),
  address: z.string().trim().min(1),
  panchayat: z.string().trim(),
  district: z.string().trim().min(1),
  pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/),
  language: langSchema,
  customText: z.string().max(300),
  clauseCodes: z.array(z.string().min(1)).min(1).max(6),
  constituencyId: z.uuid().nullable(),
  ccRepIds: z.array(z.uuid()),
})

const otpCodeSchema = z.string().regex(/^\d{6}$/)

function mapRpcError(message: string | undefined): string {
  if (message?.includes('campaign_not_active')) return 'campaign_not_active'
  return 'draft_failed'
}

function otpEmailText(code: string, lang: 'ml' | 'en'): { subject: string; body: string } {
  if (lang === 'en') {
    return {
      subject: 'Your Janashabdam verification code',
      body: `Your verification code is ${code}. It expires in 10 minutes. Do not share this code.`,
    }
  }
  return {
    subject: 'ജനശബ്ദം — സ്ഥിരീകരണ കോഡ്',
    body: `നിങ്ങളുടെ സ്ഥിരീകരണ കോഡ്: ${code}. 10 മിനിറ്റിൽ കാലാവധി തീരും. ഈ കോഡ് ആരുമായും പങ്കിടരുത്.`,
  }
}

export async function createDraft(input: z.infer<typeof createDraftSchema>): Promise<ActionResult<{ id: string }>> {
  const parsed = createDraftSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'invalid_input' }
  }

  const headerStore = await headers()
  const ip = getClientIp(headerStore)
  const turnstileOk = await verifyTurnstile(parsed.data.turnstileToken, ip)
  if (!turnstileOk) {
    return { ok: false, error: 'turnstile_failed' }
  }

  const ipHash = hashIp(ip)
  const supabase = createServiceClient()

  const { data: allowed, error: rateError } = await supabase.rpc('bump_rate_limit', {
    p_bucket: 'draft',
    p_identifier: ipHash,
    p_limit: 3,
  })
  if (rateError || allowed !== true) {
    return { ok: false, error: 'rate_limit' }
  }

  const campaignState = await getCampaignState(parsed.data.campaignSlug, await readPreviewToken())
  if (campaignState.state !== 'live') {
    return { ok: false, error: 'campaign_not_active' }
  }
  const campaign = campaignState.campaign

  const { data: clauses, error: clauseError } = await supabase
    .from('objection_clauses')
    .select('*')
    .eq('campaign_id', campaign.id)
    .in('code', parsed.data.clauseCodes)
    .eq('is_active', true)

  if (clauseError || !clauses || clauses.length !== parsed.data.clauseCodes.length) {
    return { ok: false, error: 'invalid_clauses' }
  }

  const phone = normalizeIndianPhone(parsed.data.phone)
  if (!phone) {
    return { ok: false, error: 'invalid_input' }
  }

  const composed = composeEmail({
    campaign,
    clauses: clauses as ObjectionClause[],
    details: {
      fullName: parsed.data.fullName,
      addressLine: parsed.data.address,
      panchayat: parsed.data.panchayat,
      district: parsed.data.district,
      pincode: parsed.data.pincode,
      phone,
      customText: parsed.data.customText,
    },
    lang: parsed.data.language,
  })

  if (composed.error === 'too_long') {
    return { ok: false, error: 'body_too_long' }
  }

  const userAgent = headerStore.get('user-agent') ?? ''

  const { data: submissionId, error: rpcError } = await supabase.rpc('create_submission', {
    p_campaign_slug: parsed.data.campaignSlug,
    p_full_name: parsed.data.fullName,
    p_email: parsed.data.email,
    p_phone: phone,
    p_address: parsed.data.address,
    p_panchayat: parsed.data.panchayat || null,
    p_district: parsed.data.district,
    p_pincode: parsed.data.pincode,
    p_language: parsed.data.language,
    p_custom_text: parsed.data.customText || null,
    p_clause_codes: parsed.data.clauseCodes,
    p_subject: composed.subject,
    p_body: composed.body,
    p_ip_hash: ipHash,
    p_user_agent: userAgent,
    p_consent_version: CONSENT_VERSION,
    p_constituency_id: parsed.data.constituencyId,
    p_cc_rep_ids: parsed.data.ccRepIds,
  })

  if (rpcError || !submissionId) {
    return { ok: false, error: mapRpcError(rpcError?.message) }
  }

  return { ok: true, data: { id: submissionId as string } }
}

export async function sendOtp(submissionId: string): Promise<ActionResult<{ sent: true }>> {
  const idParsed = uuidSchema.safeParse(submissionId)
  if (!idParsed.success) {
    return { ok: false, error: 'invalid_input' }
  }

  const supabase = createServiceClient()
  const { data: submission, error: fetchError } = await supabase
    .from('submissions')
    .select('id, email, email_normalized, language, status')
    .eq('id', submissionId)
    .maybeSingle()

  if (fetchError || !submission) {
    return { ok: false, error: 'not_found' }
  }

  if (submission.status !== 'draft') {
    return { ok: false, error: 'not_found' }
  }

  const { data: allowed, error: rateError } = await supabase.rpc('bump_rate_limit', {
    p_bucket: 'otp',
    p_identifier: submission.email_normalized,
    p_limit: 5,
  })
  if (rateError || allowed !== true) {
    return { ok: false, error: 'otp_rate_limit' }
  }

  const code = String(Math.floor(100_000 + Math.random() * 900_000))
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  const { error: insertError } = await supabase.from('otp_codes').insert({
    submission_id: submissionId,
    code_hash: hashOtp(code),
    expires_at: expiresAt,
  })

  if (insertError) {
    return { ok: false, error: 'otp_send_failed' }
  }

  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL
  if (!apiKey || !fromEmail) {
    return { ok: false, error: 'otp_send_failed' }
  }

  const lang = submission.language === 'en' ? 'en' : 'ml'
  const mail = otpEmailText(code, lang)
  const resend = new Resend(apiKey)

  const { error: sendError } = await resend.emails.send({
    from: fromEmail,
    to: submission.email,
    subject: mail.subject,
    text: mail.body,
  })

  if (sendError) {
    return { ok: false, error: 'otp_send_failed' }
  }

  return { ok: true, data: { sent: true } }
}

export async function verifyOtp(submissionId: string, code: string): Promise<ActionResult<{ verified: true }>> {
  const idParsed = uuidSchema.safeParse(submissionId)
  const codeParsed = otpCodeSchema.safeParse(code)
  if (!idParsed.success || !codeParsed.success) {
    return { ok: false, error: 'invalid_input' }
  }

  const supabase = createServiceClient()

  const { data: otpRow, error: otpError } = await supabase
    .from('otp_codes')
    .select('id, code_hash, attempts, expires_at, consumed_at')
    .eq('submission_id', submissionId)
    .is('consumed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (otpError || !otpRow) {
    return { ok: false, error: 'expired_code' }
  }

  if (otpRow.consumed_at) {
    return { ok: false, error: 'expired_code' }
  }

  if (new Date(otpRow.expires_at).getTime() < Date.now()) {
    return { ok: false, error: 'expired_code' }
  }

  if (otpRow.attempts >= 5) {
    return { ok: false, error: 'too_many_attempts' }
  }

  const incomingHash = hashOtp(codeParsed.data)
  if (incomingHash !== otpRow.code_hash) {
    const nextAttempts = otpRow.attempts + 1
    await supabase
      .from('otp_codes')
      .update({
        attempts: nextAttempts,
        ...(nextAttempts >= 5 ? { consumed_at: new Date().toISOString() } : {}),
      })
      .eq('id', otpRow.id)

    if (nextAttempts >= 5) {
      return { ok: false, error: 'too_many_attempts' }
    }
    return { ok: false, error: 'wrong_code' }
  }

  await supabase.from('otp_codes').update({ consumed_at: new Date().toISOString() }).eq('id', otpRow.id)

  const { error: updateError } = await supabase
    .from('submissions')
    .update({
      status: 'verified',
      verified_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
    .eq('status', 'draft')

  if (updateError) {
    if (updateError.code === '23505') {
      return { ok: false, error: 'already_submitted' }
    }
    return { ok: false, error: 'verify_failed' }
  }

  return { ok: true, data: { verified: true } }
}

export async function markHandoff(submissionId: string, method: SendMethod): Promise<ActionResult<{ ok: true }>> {
  const idParsed = uuidSchema.safeParse(submissionId)
  const methodParsed = sendMethodSchema.safeParse(method)
  if (!idParsed.success || !methodParsed.success) {
    return { ok: false, error: 'invalid_input' }
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('submissions')
    .update({
      status: 'handoff_opened',
      handoff_at: new Date().toISOString(),
      send_method: methodParsed.data,
    })
    .eq('id', submissionId)
    .eq('status', 'verified')
    .select('id')
    .maybeSingle()

  if (error || !data) {
    return { ok: false, error: 'handoff_failed' }
  }

  return { ok: true, data: { ok: true } }
}

export async function confirmSent(submissionId: string): Promise<ActionResult<{ ok: true }>> {
  const idParsed = uuidSchema.safeParse(submissionId)
  if (!idParsed.success) {
    return { ok: false, error: 'invalid_input' }
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('submissions')
    .update({
      status: 'confirmed_sent',
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
    .eq('status', 'handoff_opened')
    .select('id')
    .maybeSingle()

  if (error || !data) {
    return { ok: false, error: 'confirm_failed' }
  }

  return { ok: true, data: { ok: true } }
}
