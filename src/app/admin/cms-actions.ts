'use server'

import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { writeAdminAudit } from '@/lib/admin/audit'
import { requireAdminSession } from '@/lib/admin/auth'
import { ADMIN_CAMPAIGN_COOKIE } from '@/lib/admin/context'
import {
  DEFAULT_BODY_TEMPLATE_EN,
  DEFAULT_BODY_TEMPLATE_ML,
} from '@/lib/email-template'
import { flagsForPublishStatus, isPublishStatus, requiresLiveConfirmation, slugFromTitle, type PublishStatus } from '@/lib/admin/publish'
import { revalidateAfterCmsSave, revalidateAdmin } from '@/lib/admin/revalidate'
import { uniqueEmails } from '@/lib/compose'
import { createServiceClient } from '@/lib/supabase/server'

export type ActionOk = { ok: true; id?: string }
export type ActionErr = { ok: false; error: string }
export type ActionResult = ActionOk | ActionErr

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CLAUSE_EMAIL_MAX = 220

function parseEmails(values: string[]): string[] {
  return uniqueEmails(values.map((v) => v.trim()).filter(Boolean))
}

function invalidEmails(emails: string[]): string[] {
  return emails.filter((email) => !EMAIL_RE.test(email))
}

export async function selectAdminCampaign(campaignId: string): Promise<void> {
  await requireAdminSession()
  const store = await cookies()
  store.set(ADMIN_CAMPAIGN_COOKIE, campaignId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
  revalidateAdmin()
  redirect('/admin')
}

export type CampaignSaveInput = {
  id: string
  title_ml: string
  title_en: string
  summary_ml: string
  summary_en: string
  homepage_intro_ml: string
  homepage_intro_en: string
  explainer_ml: string[]
  explainer_en: string[]
  source_url: string
  reference_url: string
  opens_at: string
  deadline_at: string
}

export async function saveCampaign(input: CampaignSaveInput): Promise<ActionResult> {
  const session = await requireAdminSession()
  if (!input.title_ml.trim() || !input.title_en.trim()) return { ok: false, error: 'Campaign titles are required.' }
  if (!input.source_url.trim()) return { ok: false, error: 'Official source URL is required.' }

  const supabase = createServiceClient()
  const { data: before } = await supabase.from('campaigns').select('*').eq('id', input.id).maybeSingle()
  if (!before) return { ok: false, error: 'Campaign not found.' }

  const patch = {
    title_ml: input.title_ml.trim(),
    title_en: input.title_en.trim(),
    summary_ml: input.summary_ml.trim(),
    summary_en: input.summary_en.trim(),
    homepage_intro_ml: input.homepage_intro_ml.trim(),
    homepage_intro_en: input.homepage_intro_en.trim(),
    explainer_ml: input.explainer_ml.map((s) => s.trim()).filter(Boolean),
    explainer_en: input.explainer_en.map((s) => s.trim()).filter(Boolean),
    source_url: input.source_url.trim(),
    reference_url: input.reference_url.trim() || null,
    opens_at: new Date(input.opens_at).toISOString(),
    deadline_at: new Date(input.deadline_at).toISOString(),
    updated_by: session.email,
  }

  const { error } = await supabase.from('campaigns').update(patch).eq('id', input.id)
  if (error) return { ok: false, error: 'Could not save campaign.' }

  await writeAdminAudit({
    adminEmail: session.email,
    action: 'campaign_updated',
    entityType: 'campaign',
    entityId: input.id,
    before,
    after: patch,
  })
  revalidateAfterCmsSave()
  return { ok: true, id: input.id }
}

export type EmailTemplateSaveInput = {
  id: string
  recipient_emails: string[]
  cc_emails: string[]
  subject_ml: string
  subject_en: string
  intro_ml: string
  intro_en: string
  closing_ml: string
  closing_en: string
  body_template_ml: string
  body_template_en: string
}

export async function saveEmailTemplate(input: EmailTemplateSaveInput): Promise<ActionResult> {
  const session = await requireAdminSession()
  const to = parseEmails(input.recipient_emails)
  const cc = parseEmails(input.cc_emails)
  const bad = invalidEmails([...to, ...cc])
  if (bad.length > 0) return { ok: false, error: `Invalid email: ${bad[0]}` }
  if (!input.subject_ml.trim() || !input.subject_en.trim()) return { ok: false, error: 'Subject is required.' }

  const supabase = createServiceClient()
  const { data: before } = await supabase.from('campaigns').select('*').eq('id', input.id).maybeSingle()
  if (!before) return { ok: false, error: 'Campaign not found.' }

  const patch = {
    recipient_emails: to,
    recipient_email: to[0] ?? (before.recipient_email as string),
    cc_emails: cc,
    subject_ml: input.subject_ml.trim(),
    subject_en: input.subject_en.trim(),
    intro_ml: input.intro_ml.trim(),
    intro_en: input.intro_en.trim(),
    closing_ml: input.closing_ml.trim(),
    closing_en: input.closing_en.trim(),
    body_template_ml: input.body_template_ml.trim() || DEFAULT_BODY_TEMPLATE_ML,
    body_template_en: input.body_template_en.trim() || DEFAULT_BODY_TEMPLATE_EN,
    updated_by: session.email,
  }
  const { error } = await supabase.from('campaigns').update(patch).eq('id', input.id)
  if (error) return { ok: false, error: 'Could not save email template.' }

  await writeAdminAudit({
    adminEmail: session.email,
    action: 'email_template_changed',
    entityType: 'campaign',
    entityId: input.id,
    before: {
      recipient_emails: before.recipient_emails,
      cc_emails: before.cc_emails,
      subject_ml: before.subject_ml,
    },
    after: patch,
  })
  revalidateAfterCmsSave()
  return { ok: true, id: input.id }
}

export async function changeCampaignStatus(
  campaignId: string,
  nextStatus: string,
  confirmedLive?: boolean,
): Promise<ActionResult> {
  const session = await requireAdminSession()
  if (!isPublishStatus(nextStatus)) return { ok: false, error: 'Unknown status.' }

  const supabase = createServiceClient()
  const { data: before } = await supabase.from('campaigns').select('*').eq('id', campaignId).maybeSingle()
  if (!before) return { ok: false, error: 'Campaign not found.' }

  const current = (before.publish_status as PublishStatus | undefined) ?? (before.is_active ? 'live' : 'draft')
  if (requiresLiveConfirmation(current, nextStatus) && !confirmedLive) {
    return { ok: false, error: 'live_confirmation_required' }
  }

  const flags = flagsForPublishStatus(nextStatus)
  let previewToken = (before.preview_token as string | null) ?? null
  if (nextStatus === 'preview' && !previewToken) {
    previewToken = randomBytes(24).toString('hex')
  }

  const { error } = await supabase
    .from('campaigns')
    .update({
      ...flags,
      preview_token: previewToken,
      updated_by: session.email,
    })
    .eq('id', campaignId)
  if (error) return { ok: false, error: 'Could not change status.' }

  await writeAdminAudit({
    adminEmail: session.email,
    action: 'campaign_status_changed',
    entityType: 'campaign',
    entityId: campaignId,
    before: { publish_status: current, is_active: before.is_active },
    after: flags,
  })
  revalidateAfterCmsSave()
  return { ok: true, id: campaignId }
}

export type NewCampaignInput = {
  title_ml: string
  title_en: string
  summary_ml: string
  summary_en: string
  source_url: string
  reference_url?: string
  opens_at: string
  deadline_at: string
  recipient_emails: string[]
  cc_emails: string[]
  subject_ml: string
  subject_en: string
  intro_ml: string
  intro_en: string
  closing_ml: string
  closing_en: string
}

export async function createCampaignDraft(input: NewCampaignInput): Promise<ActionResult> {
  const session = await requireAdminSession()
  if (!input.title_ml.trim() || !input.title_en.trim()) return { ok: false, error: 'Titles are required.' }
  const to = parseEmails(input.recipient_emails)
  const cc = parseEmails(input.cc_emails)
  const bad = invalidEmails([...to, ...cc])
  if (bad.length > 0) return { ok: false, error: `Invalid email: ${bad[0]}` }

  const supabase = createServiceClient()
  let slug = slugFromTitle(input.title_en || input.title_ml)
  const { data: clash } = await supabase.from('campaigns').select('id').eq('slug', slug).maybeSingle()
  if (clash) slug = `${slug}-${Date.now().toString(36)}`

  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      slug,
      title_ml: input.title_ml.trim(),
      title_en: input.title_en.trim(),
      summary_ml: input.summary_ml.trim() || input.title_ml.trim(),
      summary_en: input.summary_en.trim() || input.title_en.trim(),
      homepage_intro_ml: input.summary_ml.trim(),
      homepage_intro_en: input.summary_en.trim(),
      source_url: input.source_url.trim() || 'https://example.invalid',
      reference_url: input.reference_url?.trim() || null,
      opens_at: new Date(input.opens_at).toISOString(),
      deadline_at: new Date(input.deadline_at).toISOString(),
      recipient_email: to[0] ?? 'unset@example.invalid',
      recipient_emails: to,
      cc_emails: cc,
      subject_ml: input.subject_ml.trim() || input.title_ml.trim(),
      subject_en: input.subject_en.trim() || input.title_en.trim(),
      intro_ml: input.intro_ml.trim(),
      intro_en: input.intro_en.trim(),
      closing_ml: input.closing_ml.trim(),
      closing_en: input.closing_en.trim(),
      body_template_ml: DEFAULT_BODY_TEMPLATE_ML,
      body_template_en: DEFAULT_BODY_TEMPLATE_EN,
      explainer_ml: [],
      explainer_en: [],
      is_active: false,
      publish_status: 'draft',
      preview_token: randomBytes(24).toString('hex'),
      updated_by: session.email,
    })
    .select('id')
    .maybeSingle()

  if (error || !data) return { ok: false, error: 'Could not create campaign.' }

  await writeAdminAudit({
    adminEmail: session.email,
    action: 'campaign_created',
    entityType: 'campaign',
    entityId: data.id as string,
    after: { slug, publish_status: 'draft' },
  })

  const store = await cookies()
  store.set(ADMIN_CAMPAIGN_COOKIE, data.id as string, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
  revalidateAfterCmsSave()
  return { ok: true, id: data.id as string }
}

export async function duplicateCampaign(campaignId: string): Promise<ActionResult> {
  const session = await requireAdminSession()
  const supabase = createServiceClient()
  const { data: source } = await supabase.from('campaigns').select('*').eq('id', campaignId).maybeSingle()
  if (!source) return { ok: false, error: 'Campaign not found.' }

  const baseSlug = `${source.slug as string}-copy`
  let slug = baseSlug
  const { data: clash } = await supabase.from('campaigns').select('id').eq('slug', slug).maybeSingle()
  if (clash) slug = `${baseSlug}-${Date.now().toString(36)}`

  const { data: created, error } = await supabase
    .from('campaigns')
    .insert({
      slug,
      title_ml: `${source.title_ml as string} (copy)`,
      title_en: `${source.title_en as string} (copy)`,
      summary_ml: source.summary_ml,
      summary_en: source.summary_en,
      homepage_intro_ml: source.homepage_intro_ml ?? source.summary_ml,
      homepage_intro_en: source.homepage_intro_en ?? source.summary_en,
      source_url: source.source_url,
      reference_url: source.reference_url ?? null,
      opens_at: new Date().toISOString(),
      deadline_at: new Date(Date.now() + 30 * 86_400_000).toISOString(),
      recipient_email: source.recipient_email,
      recipient_emails: source.recipient_emails ?? [],
      cc_emails: source.cc_emails ?? [],
      subject_ml: source.subject_ml,
      subject_en: source.subject_en,
      intro_ml: source.intro_ml,
      intro_en: source.intro_en,
      closing_ml: source.closing_ml,
      closing_en: source.closing_en,
      body_template_ml: source.body_template_ml ?? DEFAULT_BODY_TEMPLATE_ML,
      body_template_en: source.body_template_en ?? DEFAULT_BODY_TEMPLATE_EN,
      explainer_ml: source.explainer_ml ?? [],
      explainer_en: source.explainer_en ?? [],
      is_active: false,
      publish_status: 'draft',
      preview_token: randomBytes(24).toString('hex'),
      updated_by: session.email,
    })
    .select('id')
    .maybeSingle()

  if (error || !created) return { ok: false, error: 'Could not duplicate campaign.' }

  const { data: clauses } = await supabase.from('objection_clauses').select('*').eq('campaign_id', campaignId)
  if (clauses && clauses.length > 0) {
    const copies = clauses.map((clause) => ({
      campaign_id: created.id,
      code: clause.code,
      section_ref: clause.section_ref,
      title_ml: clause.title_ml,
      title_en: clause.title_en,
      explain_ml: clause.explain_ml,
      explain_en: clause.explain_en,
      email_ml: clause.email_ml,
      email_en: clause.email_en,
      full_text_ml: clause.full_text_ml ?? '',
      full_text_en: clause.full_text_en ?? '',
      full_url: clause.full_url,
      sort_order: clause.sort_order,
      is_active: clause.is_active,
    }))
    await supabase.from('objection_clauses').insert(copies)
  }

  await writeAdminAudit({
    adminEmail: session.email,
    action: 'campaign_duplicated',
    entityType: 'campaign',
    entityId: created.id as string,
    before: { source_id: campaignId },
    after: { slug, publish_status: 'draft' },
  })

  const store = await cookies()
  store.set(ADMIN_CAMPAIGN_COOKIE, created.id as string, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
  revalidateAfterCmsSave()
  return { ok: true, id: created.id as string }
}

export type ConcernSaveInput = {
  id?: string
  campaign_id: string
  code: string
  section_ref: string
  title_ml: string
  title_en: string
  explain_ml: string
  explain_en: string
  email_ml: string
  email_en: string
  full_text_ml: string
  full_text_en: string
  full_url: string
  sort_order: number
  is_active: boolean
}

function clauseTooLong(text: string): boolean {
  return [...text].length > CLAUSE_EMAIL_MAX
}

export async function saveConcern(input: ConcernSaveInput): Promise<ActionResult> {
  const session = await requireAdminSession()
  if (!input.code.trim() || !input.title_ml.trim() || !input.title_en.trim()) {
    return { ok: false, error: 'Code and titles are required.' }
  }
  if (clauseTooLong(input.email_ml) || clauseTooLong(input.email_en)) {
    return { ok: false, error: `Email copy must be ${CLAUSE_EMAIL_MAX} characters or fewer.` }
  }

  const supabase = createServiceClient()
  const row = {
    campaign_id: input.campaign_id,
    code: input.code.trim().toUpperCase().replace(/\s+/g, '_'),
    section_ref: input.section_ref.trim() || null,
    title_ml: input.title_ml.trim(),
    title_en: input.title_en.trim(),
    explain_ml: input.explain_ml.trim(),
    explain_en: input.explain_en.trim(),
    email_ml: input.email_ml.trim(),
    email_en: input.email_en.trim(),
    full_text_ml: input.full_text_ml.trim(),
    full_text_en: input.full_text_en.trim(),
    full_url: input.full_url.trim() || null,
    sort_order: Number.isFinite(input.sort_order) ? input.sort_order : 0,
    is_active: input.is_active,
  }

  if (input.id) {
    const { data: before } = await supabase.from('objection_clauses').select('*').eq('id', input.id).maybeSingle()
    const { error } = await supabase.from('objection_clauses').update(row).eq('id', input.id)
    if (error) return { ok: false, error: error.message.includes('email_') ? 'Email copy is too long.' : 'Could not save concern.' }
    await writeAdminAudit({
      adminEmail: session.email,
      action: 'concern_edited',
      entityType: 'concern',
      entityId: input.id,
      before,
      after: row,
    })
    revalidateAfterCmsSave()
    return { ok: true, id: input.id }
  }

  const { data, error } = await supabase.from('objection_clauses').insert(row).select('id').maybeSingle()
  if (error || !data) {
    return { ok: false, error: error?.message.includes('unique') ? 'That code already exists.' : 'Could not create concern.' }
  }
  await writeAdminAudit({
    adminEmail: session.email,
    action: 'concern_created',
    entityType: 'concern',
    entityId: data.id as string,
    after: row,
  })
  revalidateAfterCmsSave()
  return { ok: true, id: data.id as string }
}

export async function setConcernActive(id: string, isActive: boolean): Promise<ActionResult> {
  const session = await requireAdminSession()
  const supabase = createServiceClient()
  const { error } = await supabase.from('objection_clauses').update({ is_active: isActive }).eq('id', id)
  if (error) return { ok: false, error: 'Could not update concern.' }
  await writeAdminAudit({
    adminEmail: session.email,
    action: isActive ? 'concern_enabled' : 'concern_disabled',
    entityType: 'concern',
    entityId: id,
    after: { is_active: isActive },
  })
  revalidateAfterCmsSave()
  return { ok: true, id }
}

export async function duplicateConcern(id: string): Promise<ActionResult> {
  const session = await requireAdminSession()
  const supabase = createServiceClient()
  const { data: source } = await supabase.from('objection_clauses').select('*').eq('id', id).maybeSingle()
  if (!source) return { ok: false, error: 'Concern not found.' }

  const { data: maxRow } = await supabase
    .from('objection_clauses')
    .select('sort_order')
    .eq('campaign_id', source.campaign_id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data, error } = await supabase
    .from('objection_clauses')
    .insert({
      campaign_id: source.campaign_id,
      code: `${source.code as string}_COPY`,
      section_ref: source.section_ref,
      title_ml: `${source.title_ml as string} (copy)`,
      title_en: `${source.title_en as string} (copy)`,
      explain_ml: source.explain_ml,
      explain_en: source.explain_en,
      email_ml: source.email_ml,
      email_en: source.email_en,
      full_text_ml: source.full_text_ml ?? '',
      full_text_en: source.full_text_en ?? '',
      full_url: source.full_url,
      sort_order: ((maxRow?.sort_order as number | undefined) ?? 0) + 1,
      is_active: false,
    })
    .select('id')
    .maybeSingle()

  if (error || !data) {
    return { ok: false, error: error?.message.includes('unique') ? 'A copy of this code already exists.' : 'Could not duplicate.' }
  }
  await writeAdminAudit({
    adminEmail: session.email,
    action: 'concern_duplicated',
    entityType: 'concern',
    entityId: data.id as string,
    before: { source_id: id },
  })
  revalidateAfterCmsSave()
  return { ok: true, id: data.id as string }
}

export async function reorderConcerns(campaignId: string, orderedIds: string[]): Promise<ActionResult> {
  const session = await requireAdminSession()
  const supabase = createServiceClient()
  for (let index = 0; index < orderedIds.length; index += 1) {
    const { error } = await supabase
      .from('objection_clauses')
      .update({ sort_order: index + 1 })
      .eq('id', orderedIds[index])
      .eq('campaign_id', campaignId)
    if (error) return { ok: false, error: 'Could not reorder concerns.' }
  }
  await writeAdminAudit({
    adminEmail: session.email,
    action: 'concerns_reordered',
    entityType: 'campaign',
    entityId: campaignId,
    after: { orderedIds },
  })
  revalidateAfterCmsSave()
  return { ok: true }
}

export async function saveSiteSettings(input: {
  default_language: string
  site_title_ml: string
  site_title_en: string
  support_email: string
  public_disclaimer_ml: string
  public_disclaimer_en: string
  public_footer_ml: string
  public_footer_en: string
}): Promise<ActionResult> {
  const session = await requireAdminSession()
  const lang = input.default_language === 'en' ? 'en' : 'ml'
  const supabase = createServiceClient()
  const { error } = await supabase.from('site_settings').upsert({
    id: 1,
    default_language: lang,
    site_title_ml: input.site_title_ml.trim() || 'ജനശബ്ദം',
    site_title_en: input.site_title_en.trim() || 'Janashabdam',
    support_email: input.support_email.trim() || null,
    public_disclaimer_ml: input.public_disclaimer_ml,
    public_disclaimer_en: input.public_disclaimer_en,
    public_footer_ml: input.public_footer_ml,
    public_footer_en: input.public_footer_en,
    updated_by: session.email,
    updated_at: new Date().toISOString(),
  })
  if (error) return { ok: false, error: 'Could not save settings.' }
  await writeAdminAudit({
    adminEmail: session.email,
    action: 'settings_updated',
    entityType: 'site_settings',
    entityId: '1',
    after: { default_language: lang, support_email: input.support_email.trim() || null },
  })
  revalidateAfterCmsSave()
  return { ok: true }
}
