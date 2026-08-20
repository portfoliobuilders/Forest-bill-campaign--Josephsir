import { uniqueEmails } from '@/lib/compose-emails'
import { defaultBodyTemplate, renderSafeTemplate, type EmailTemplateValues } from '@/lib/email-template'
import type { Lang } from '@/lib/i18n'
import type { WizardMode } from '@/lib/wizard-mode'
import type { Campaign, ObjectionClause } from '@/types/database'

export { uniqueEmails } from '@/lib/compose-emails'

export const MAX_BODY_CHARS = 1500
export const URL_LENGTH_WARN = 1900
export const GMAIL_URL_WARN = 7000
export const MAILTO_URL_WARN = 1900

export type ComposeDetails = {
  fullName: string
  addressLine: string
  panchayat: string
  village?: string
  district: string
  pincode: string
  phone: string
  email: string
  customText?: string
  extraConcerns?: string[]
}

export type ComposeEmailInput = {
  campaign: Campaign
  clauses: ObjectionClause[]
  details: ComposeDetails
  lang: Lang
}

export type ComposeEmailResult = {
  subject: string
  body: string
  charCount: number
  error: 'too_long' | null
}

export type MailComposeParams = {
  to: string[]
  cc: string[]
  bcc?: string[]
  subject: string
  body: string
}

export type ResolvedMailTargets = {
  to: string[]
  cc: string[]
  bcc: string[]
  dryRun: boolean
  liveTo: string[]
  liveCc: string[]
  liveBcc: string[]
}

export function charCount(text: string): number {
  return [...text].length
}

function pick(lang: Lang, ml: string, en: string): string {
  return lang === 'en' ? en : ml
}

export function campaignRecipientEmails(campaign: Campaign): string[] {
  const fromArray = Array.isArray(campaign.recipient_emails) ? campaign.recipient_emails : []
  if (fromArray.length > 0) return uniqueEmails(fromArray)
  return uniqueEmails([campaign.recipient_email])
}

export function campaignCcEmails(campaign: Campaign): string[] {
  return uniqueEmails(campaign.cc_emails ?? [])
}

export function campaignBccEmails(campaign: Campaign): string[] {
  return uniqueEmails(campaign.bcc_emails ?? [])
}

export function liveMailTargets(campaign: Campaign): { to: string[]; cc: string[]; bcc: string[] } {
  let to = campaignRecipientEmails(campaign)
  const bcc = campaignBccEmails(campaign)
  const toKeys = new Set(to.map((email) => email.toLowerCase()))
  let cc = campaignCcEmails(campaign).filter((email) => !toKeys.has(email.toLowerCase()))
  if (to.length === 0 && cc.length > 0) {
    to = cc
    cc = []
  }
  const seen = new Set([...to, ...cc].map((email) => email.toLowerCase()))
  return {
    to,
    cc,
    bcc: bcc.filter((email) => !seen.has(email.toLowerCase())),
  }
}

export function resolveMailTargets({
  campaign,
  mode,
  testerEmail,
}: {
  campaign: Campaign
  mode: WizardMode
  testerEmail: string
}): ResolvedMailTargets {
  const live = liveMailTargets(campaign)
  if (mode === 'live') {
    return {
      to: live.to,
      cc: live.cc,
      bcc: live.bcc,
      dryRun: false,
      liveTo: live.to,
      liveCc: live.cc,
      liveBcc: live.bcc,
    }
  }
  return {
    to: uniqueEmails([testerEmail]),
    cc: [],
    bcc: [],
    dryRun: true,
    liveTo: live.to,
    liveCc: live.cc,
    liveBcc: live.bcc,
  }
}

export function clausesForLetter(clauses: ObjectionClause[], selectedIds: string[]): ObjectionClause[] {
  return selectedClausesForLetter(clauses, selectedIds)
}

export function concernTitle(clause: ObjectionClause, lang: Lang): string {
  return pick(lang, clause.title_ml, clause.title_en).trim()
}

export function concernBody(clause: ObjectionClause, lang: Lang): string {
  return (
    pick(lang, clause.email_body_ml ?? '', clause.email_body_en ?? '').trim() ||
    pick(lang, clause.full_text_ml ?? '', clause.full_text_en ?? '').trim() ||
    pick(lang, clause.email_ml, clause.email_en).trim() ||
    pick(lang, clause.explain_ml, clause.explain_en).trim()
  )
}

export function concernShort(clause: ObjectionClause, lang: Lang): string {
  return pick(lang, clause.explain_ml, clause.explain_en).trim() || concernBody(clause, lang)
}

function senderValues(
  details: ComposeDetails,
): Pick<
  EmailTemplateValues,
  'full_name' | 'email' | 'phone' | 'address' | 'panchayat' | 'village' | 'district' | 'pincode' | 'constituency' | 'custom_text'
> {
  return {
    full_name: details.fullName,
    email: details.email,
    phone: details.phone,
    address: details.addressLine,
    panchayat: details.panchayat,
    village: details.village ?? '',
    district: details.district,
    pincode: details.pincode,
    constituency: '',
    custom_text: (details.customText ?? '').trim(),
  }
}

function formattedConcerns(clauses: ObjectionClause[], extraConcerns: string[], lang: Lang): string {
  const sorted = [...clauses].sort((a, b) => a.sort_order - b.sort_order)
  const blocks: string[] = []
  sorted.forEach((clause, index) => {
    const title = concernTitle(clause, lang)
    const body = concernBody(clause, lang)
    const n = index + 1
    if (sorted.length === 1) {
      blocks.push(body.startsWith(title) || !title ? body : `${title}\n\n${body}`)
      return
    }
    const text = body && title && !body.startsWith(title) ? `${title}\n\n${body}` : body || title
    blocks.push(`${n}. ${text}`)
  })
  for (const extra of extraConcerns) {
    const text = extra.replace(/\s+/g, ' ').trim()
    if (!text) continue
    blocks.push(`${blocks.length + 1}. ${text}`)
  }
  return blocks.join('\n\n')
}

export function composeSubject(campaign: Campaign, clauses: ObjectionClause[], lang: Lang): string {
  if (clauses.length === 1) {
    const custom = pick(lang, clauses[0].email_subject_ml ?? '', clauses[0].email_subject_en ?? '').trim()
    if (custom) return custom
    const title = concernTitle(clauses[0], lang)
    if (title) return title
  }
  return pick(lang, campaign.subject_ml, campaign.subject_en)
}

function assembleBody(
  campaign: Campaign,
  clauses: ObjectionClause[],
  details: ComposeDetails,
  lang: Lang,
): string {
  const intro = pick(lang, campaign.intro_ml, campaign.intro_en)
  const closing = pick(lang, campaign.closing_ml, campaign.closing_en)
  const extras = details.extraConcerns ?? []
  const stored = pick(lang, campaign.body_template_ml ?? '', campaign.body_template_en ?? '').trim()
  const template = stored || defaultBodyTemplate(lang)
  const config = campaignConcernConfig(campaign)
  const values: EmailTemplateValues = {
    intro,
    closing,
    concerns: formattedConcerns(clauses, extras, lang),
    ...senderValues(details),
  }
  return renderSafeTemplate(template, values)
}

export function composeEmail({ campaign, clauses, details, lang }: ComposeEmailInput): ComposeEmailResult {
  const subject = composeSubject(campaign, clauses, lang)
  const body = assembleBody(campaign, clauses, details, lang)
  return { subject, body, charCount: charCount(body), error: null }
}

function encodePairs(pairs: Array<[string, string]>): string {
  return pairs.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')
}

function toHeader(to: string[]): string {
  return uniqueEmails(to).join(',')
}

function ccHeader(cc: string[]): string {
  return uniqueEmails(cc).join(',')
}

function bccHeader(bcc: string[] | undefined): string {
  return uniqueEmails(bcc ?? []).join(',')
}

export function gmailComposeUrl(params: MailComposeParams, options?: { includeBody?: boolean }): string {
  const to = toHeader(params.to)
  const cc = ccHeader(params.cc)
  const bcc = bccHeader(params.bcc)
  const pairs: Array<[string, string]> = [
    ['view', 'cm'],
    ['fs', '1'],
    ['to', to],
  ]
  if (cc) pairs.push(['cc', cc])
  if (bcc) pairs.push(['bcc', bcc])
  pairs.push(['su', params.subject])
  if (options?.includeBody !== false) pairs.push(['body', params.body])
  return `https://mail.google.com/mail/?${encodePairs(pairs)}`
}

export function mailtoUrl(params: MailComposeParams, options?: { includeBody?: boolean }): string {
  const to = toHeader(params.to)
  const cc = ccHeader(params.cc)
  const bcc = bccHeader(params.bcc)
  const pairs: Array<[string, string]> = []
  if (cc) pairs.push(['cc', cc])
  if (bcc) pairs.push(['bcc', bcc])
  pairs.push(['subject', params.subject])
  if (options?.includeBody !== false) pairs.push(['body', params.body])
  return `mailto:${encodeURIComponent(to)}?${encodePairs(pairs)}`
}

export function estimateUrlLength(params: MailComposeParams): number {
  return Math.max(gmailComposeUrl(params).length, mailtoUrl(params).length)
}

export function gmailUrlTooLong(params: MailComposeParams): boolean {
  return gmailComposeUrl(params).length > GMAIL_URL_WARN
}

export function mailtoUrlTooLong(params: MailComposeParams): boolean {
  return mailtoUrl(params).length > MAILTO_URL_WARN
}

const GMAIL_ANDROID_PACKAGE = 'com.google.android.gm'

function utf8Base64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function encodeRfc2047(text: string): string {
  if (/^[\x20-\x7E]*$/.test(text)) return text
  return `=?UTF-8?B?${utf8Base64(text)}?=`
}

function crlf(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n')
}

/** Unsent RFC 822 draft. Opens in Outlook/Apple Mail/Thunderbird with the full body — no URL length cap. */
export function formatUnsentEml(params: MailComposeParams): string {
  const headers = ['X-Unsent: 1', `To: ${uniqueEmails(params.to).join(', ')}`]
  const cc = uniqueEmails(params.cc)
  if (cc.length > 0) headers.push(`Cc: ${cc.join(', ')}`)
  const bcc = uniqueEmails(params.bcc ?? [])
  if (bcc.length > 0) headers.push(`Bcc: ${bcc.join(', ')}`)
  headers.push(
    `Subject: ${encodeRfc2047(params.subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
  )
  return crlf(`${headers.join('\n')}\n${params.body}\n`)
}

/** Chrome Android intent that puts the full Unicode body in EXTRA_TEXT instead of a mailto URL. */
export function androidSendIntent(
  params: MailComposeParams,
  options?: { gmailOnly?: boolean; fallbackUrl?: string },
): string {
  const extras = ['action=android.intent.action.SEND', 'type=message/rfc822']
  if (options?.gmailOnly) extras.push(`package=${GMAIL_ANDROID_PACKAGE}`)
  extras.push(`S.android.intent.extra.EMAIL=${encodeURIComponent(toHeader(params.to))}`)
  const cc = ccHeader(params.cc)
  if (cc) extras.push(`S.android.intent.extra.CC=${encodeURIComponent(cc)}`)
  const bcc = bccHeader(params.bcc)
  if (bcc) extras.push(`S.android.intent.extra.BCC=${encodeURIComponent(bcc)}`)
  extras.push(`S.android.intent.extra.SUBJECT=${encodeURIComponent(params.subject)}`)
  extras.push(`S.android.intent.extra.TEXT=${encodeURIComponent(params.body)}`)
  if (options?.fallbackUrl) extras.push(`S.browser_fallback_url=${encodeURIComponent(options.fallbackUrl)}`)
  extras.push('end')
  return `intent://send/#Intent;${extras.join(';')}`
}

export function formatCompleteEmailCopy(params: MailComposeParams): string {
  const to = uniqueEmails(params.to)
  const cc = uniqueEmails(params.cc)
  const bcc = uniqueEmails(params.bcc ?? [])
  const lines = ['To:', ...to, '']
  if (cc.length > 0) lines.push('CC:', ...cc, '')
  if (bcc.length > 0) lines.push('BCC:', ...bcc, '')
  lines.push(`Subject: ${params.subject}`, '', params.body)
  return lines.join('\n')
}

export function withRepresentativeCc(
  params: MailComposeParams,
  officialEmail: string | null | undefined,
  optedIn: boolean,
): MailComposeParams {
  const email = officialEmail?.trim()
  if (!optedIn || !email) return params
  if (params.cc.some((existing) => existing.toLowerCase() === email.toLowerCase())) return params
  if (params.to.some((existing) => existing.toLowerCase() === email.toLowerCase())) return params
  return { ...params, cc: [...params.cc, email] }
}
