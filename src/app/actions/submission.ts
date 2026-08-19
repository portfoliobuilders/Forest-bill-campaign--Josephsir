'use server'

import { randomInt } from 'crypto'
import { headers } from 'next/headers'
import { Resend } from 'resend'
import { z } from 'zod'

import { composeEmail, clausesForLetter } from '@/lib/compose'
import { getCampaignState, publicCampaign, readPreviewToken } from '@/lib/campaign'
import { withForestClauses } from '@/lib/campaigns'
import { demoCampaign, demoClauses } from '@/lib/demo-data'
import {
  getClientIp,
  hashIp,
  hashOtp,
  hashesMatch,
  isTurnstileConfigured,
  verifyTurnstile,
} from '@/lib/security'
import { createServiceClient } from '@/lib/supabase/server'
import { normalizeIndianPhone } from '@/lib/phone'
import type { Campaign, ObjectionClause, SendMethod } from '@/types/database'

import { CONSENT_VERSION } from '@/lib/consent'
import { runtimeEnv } from '@/lib/runtime-env'
import type { ActionResult } from '@/lib/submission-types'

const uuidSchema = z.uuid()
const langSchema = z.enum(['ml', 'en'])
const sendMethodSchema = z.enum(['gmail_web', 'mailto', 'copy', 'server', 'print'])

const letterModeSchema = z.enum(['selected', 'full'])

const letterInputSchema = z.object({
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
  extraConcerns: z.array(z.string().max(300)).max(6).default([]),
  clauseCodes: z.array(z.string().min(1)).max(12).default([]),
  letterMode: letterModeSchema.default('selected'),
  constituencyId: z.uuid().nullable(),
  ccRepIds: z.array(z.uuid()),
})

const createDraftSchema = letterInputSchema.extend({
  turnstileToken: z.string(),
})

const otpCodeSchema = z.string().regex(/^\d{6}$/)

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

type LetterFields = z.infer<typeof letterInputSchema>

type CanonicalCompose = {
  campaign: Campaign
  persistSlug: string | null
  composed: { subject: string; body: string }
  clauseCodes: string[]
  isTest: boolean
}

async function composeCanonicalLetter(input: LetterFields): Promise<ActionResult<CanonicalCompose>> {
  const extraConcerns = input.extraConcerns.map((item) => item.replace(/\s+/g, ' ').trim()).filter(Boolean)
  if (input.letterMode === 'selected' && input.clauseCodes.length + extraConcerns.length < 1) {
    return { ok: false, error: 'invalid_clauses' }
  }

  const phone = normalizeIndianPhone(input.phone)
  if (!phone) {
    return { ok: false, error: 'invalid_input' }
  }

  const campaignState = await getCampaignState(input.campaignSlug, await readPreviewToken())
  let campaign: Campaign
  let sourceClauses: ObjectionClause[]
  let persistSlug: string | null = null
  let isTest = campaignState.state === 'preview'

  if (campaignState.state === 'dormant') {
    campaign = demoCampaign
    sourceClauses = demoClauses
    persistSlug = input.campaignSlug
  } else {
    campaign = publicCampaign(campaignState.campaign)
    persistSlug = campaign.slug
    try {
      const supabase = createServiceClient()
      let query = supabase
        .from('objection_clauses')
        .select('*')
        .eq('campaign_id', campaign.id)
        .eq('is_active', true)
      if (input.letterMode === 'selected') {
        query = query.in('code', input.clauseCodes)
      }
      const { data } = await query
      sourceClauses = withForestClauses(campaign, (data ?? []) as ObjectionClause[])
    } catch {
      sourceClauses = withForestClauses(campaign, [])
    }
  }

  const selectedIds =
    input.letterMode === 'full'
      ? sourceClauses.map((clause) => clause.id)
      : sourceClauses.filter((clause) => input.clauseCodes.includes(clause.code)).map((clause) => clause.id)
  const clauses = clausesForLetter(sourceClauses, selectedIds, input.letterMode)
  if (input.letterMode === 'selected' && clauses.length === 0 && extraConcerns.length === 0) {
    return { ok: false, error: 'invalid_clauses' }
  }

  const composed = composeEmail({
    campaign,
    clauses,
    details: {
      fullName: input.fullName,
      addressLine: input.address,
      panchayat: input.panchayat,
      district: input.district,
      pincode: input.pincode,
      phone,
      email: input.email,
      customText: input.customText,
      extraConcerns,
    },
    lang: input.language,
  })

  return {
    ok: true,
    data: {
      campaign,
      persistSlug,
      composed: { subject: composed.subject, body: composed.body },
      clauseCodes: clauses.map((clause) => clause.code),
      isTest,
    },
  }
}

async function storeCanonicalLetter(
  input: LetterFields,
  canonical: CanonicalCompose,
  ipHash: string,
  userAgent: string,
): Promise<string | null> {
  if (!canonical.persistSlug) return null
  const phone = normalizeIndianPhone(input.phone)
  if (!phone) return null

  try {
    const supabase = createServiceClient()
    const preferred = canonical.persistSlug
    const bySlug = await supabase.from('campaigns').select('slug').eq('slug', preferred).maybeSingle()
    const fallback = bySlug.data?.slug
      ? null
      : await supabase.from('campaigns').select('slug').order('created_at', { ascending: false }).limit(1).maybeSingle()
    const slug = (bySlug.data?.slug as string | undefined) ?? (fallback?.data?.slug as string | undefined)
    if (!slug) return null

    const { data: submissionId, error } = await supabase.rpc('create_submission', {
      p_campaign_slug: slug,
      p_full_name: input.fullName,
      p_email: input.email,
      p_phone: phone,
      p_address: input.address,
      p_panchayat: input.panchayat || null,
      p_district: input.district,
      p_pincode: input.pincode,
      p_language: input.language,
      p_custom_text: input.customText || null,
      p_clause_codes: canonical.clauseCodes,
      p_subject: canonical.composed.subject,
      p_body: canonical.composed.body,
      p_ip_hash: ipHash,
      p_user_agent: userAgent,
      p_consent_version: CONSENT_VERSION,
      p_constituency_id: input.constituencyId,
      p_cc_rep_ids: input.ccRepIds,
      p_is_test: canonical.isTest,
    })
    if (error || !submissionId) return null
    return submissionId as string
  } catch {
    return null
  }
}

export async function createDraft(
  input: z.infer<typeof createDraftSchema>,
): Promise<ActionResult<{ id: string; subject: string; body: string }>> {
  try {
    const parsed = createDraftSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: 'invalid_input' }
    }

    const headerStore = await headers()
    const ip = getClientIp(headerStore)
    if (isTurnstileConfigured()) {
      const turnstileOk = await verifyTurnstile(parsed.data.turnstileToken, ip)
      if (!turnstileOk) {
        return { ok: false, error: 'turnstile_failed' }
      }
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
    if (campaignState.state === 'dormant') {
      return { ok: false, error: 'campaign_not_active' }
    }

    const canonical = await composeCanonicalLetter(parsed.data)
    if (!canonical.ok) return canonical

    const submissionId = await storeCanonicalLetter(
      parsed.data,
      canonical.data,
      ipHash,
      headerStore.get('user-agent') ?? '',
    )
    if (!submissionId) {
      return { ok: false, error: 'draft_failed' }
    }

    return {
      ok: true,
      data: {
        id: submissionId,
        subject: canonical.data.composed.subject,
        body: canonical.data.composed.body,
      },
    }
  } catch {
    return { ok: false, error: 'draft_failed' }
  }
}

export async function prepareDemoLetter(
  input: z.infer<typeof letterInputSchema>,
): Promise<ActionResult<{ id: string | null; subject: string; body: string }>> {
  const parsed = letterInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'invalid_input' }
  }

  const canonical = await composeCanonicalLetter(parsed.data)
  if (!canonical.ok) return canonical

  const headerStore = await headers()
  const ipHash = hashIp(getClientIp(headerStore))
  let submissionId: string | null = null
  try {
    const supabase = createServiceClient()
    const { data: allowed, error: rateError } = await supabase.rpc('bump_rate_limit', {
      p_bucket: 'draft',
      p_identifier: ipHash,
      p_limit: 3,
    })
    if (rateError || allowed !== false) {
      submissionId = await storeCanonicalLetter(
        parsed.data,
        canonical.data,
        ipHash,
        headerStore.get('user-agent') ?? '',
      )
    }
  } catch {
    // Letter still works if the database is unreachable.
  }

  return {
    ok: true,
    data: {
      id: submissionId,
      subject: canonical.data.composed.subject,
      body: canonical.data.composed.body,
    },
  }
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

  const code = String(randomInt(100_000, 1_000_000))
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  const { error: insertError } = await supabase.from('otp_codes').insert({
    submission_id: submissionId,
    code_hash: hashOtp(code),
    expires_at: expiresAt,
  })

  if (insertError) {
    return { ok: false, error: 'otp_send_failed' }
  }

  const apiKey = runtimeEnv('RESEND_API_KEY')
  const fromEmail = runtimeEnv('RESEND_FROM_EMAIL')
  if (!apiKey || !fromEmail) {
    return { ok: false, error: 'otp_send_failed' }
  }

  const lang = submission.language === 'en' ? 'en' : 'ml'
  const mail = otpEmailText(code, lang)

  try {
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
  } catch {
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

  if (new Date(otpRow.expires_at).getTime() < Date.now()) {
    return { ok: false, error: 'expired_code' }
  }

  if (otpRow.attempts >= 5) {
    return { ok: false, error: 'too_many_attempts' }
  }

  if (!hashesMatch(hashOtp(codeParsed.data), otpRow.code_hash)) {
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

  const { data, error: updateError } = await supabase
    .from('submissions')
    .update({
      status: 'verified',
      verified_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
    .eq('status', 'draft')
    .select('id')
    .maybeSingle()

  if (updateError) {
    if (updateError.code === '23505') {
      return { ok: false, error: 'already_submitted' }
    }
    return { ok: false, error: 'verify_failed' }
  }

  if (!data) {
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
    .in('status', ['draft', 'verified', 'handoff_opened'])
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
