import type { Lang } from '@/lib/i18n'
import type { WizardMode } from '@/lib/wizard-mode'
import type { Campaign, ObjectionClause } from '@/types/database'

export const MAX_BODY_CHARS = 1500
export const URL_LENGTH_WARN = 1900
export const GMAIL_URL_WARN = 7000
export const MAILTO_URL_WARN = 1900

export type LetterMode = 'selected' | 'full'

export type ComposeDetails = {
  fullName: string
  addressLine: string
  panchayat: string
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
  subject: string
  body: string
}

export type ResolvedMailTargets = {
  to: string[]
  cc: string[]
  dryRun: boolean
  liveTo: string[]
  liveCc: string[]
}

export function charCount(text: string): number {
  return [...text].length
}

function pick(lang: Lang, ml: string, en: string): string {
  return lang === 'en' ? en : ml
}

export function uniqueEmails(emails: Array<string | null | undefined>): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of emails) {
    const email = raw?.trim() ?? ''
    if (!email) continue
    const key = email.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(email)
  }
  return out
}

export function campaignRecipientEmails(campaign: Campaign): string[] {
  const fromArray = Array.isArray(campaign.recipient_emails) ? campaign.recipient_emails : []
  if (fromArray.length > 0) return uniqueEmails(fromArray)
  return uniqueEmails([campaign.recipient_email])
}

export function campaignCcEmails(campaign: Campaign): string[] {
  return uniqueEmails(campaign.cc_emails ?? [])
}

export function liveMailTargets(campaign: Campaign): { to: string[]; cc: string[] } {
  const to = campaignRecipientEmails(campaign)
  const toKeys = new Set(to.map((email) => email.toLowerCase()))
  const cc = campaignCcEmails(campaign).filter((email) => !toKeys.has(email.toLowerCase()))
  return { to, cc }
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
    return { to: live.to, cc: live.cc, dryRun: false, liveTo: live.to, liveCc: live.cc }
  }
  return {
    to: uniqueEmails([testerEmail]),
    cc: [],
    dryRun: true,
    liveTo: live.to,
    liveCc: live.cc,
  }
}

export function clausesForLetter(
  clauses: ObjectionClause[],
  selectedIds: string[],
  letterMode: LetterMode,
): ObjectionClause[] {
  const sorted = [...clauses].sort((a, b) => a.sort_order - b.sort_order)
  if (letterMode === 'full') return sorted
  const selected = new Set(selectedIds)
  return sorted.filter((clause) => selected.has(clause.id))
}

function senderBlock(details: ComposeDetails, lang: Lang): string {
  if (lang === 'en') {
    return [
      'Regards,',
      '',
      `Name: ${details.fullName}`,
      `Address: ${details.addressLine}`,
      `Panchayat / Municipality: ${details.panchayat}`,
      `District: ${details.district}`,
      `PIN: ${details.pincode}`,
      `Phone: ${details.phone}`,
      `Email: ${details.email}`,
    ].join('\n')
  }
  return [
    'ആദരപൂർവ്വം,',
    '',
    `പേര്: ${details.fullName}`,
    `വിലാസം: ${details.addressLine}`,
    `പഞ്ചായത്ത് / മുനിസിപ്പാലിറ്റി: ${details.panchayat}`,
    `ജില്ല: ${details.district}`,
    `പിൻകോഡ്: ${details.pincode}`,
    `ഫോൺ: ${details.phone}`,
    `ഇമെയിൽ: ${details.email}`,
  ].join('\n')
}

function assembleBody(
  campaign: Campaign,
  clauses: ObjectionClause[],
  details: ComposeDetails,
  lang: Lang,
): string {
  const intro = pick(lang, campaign.intro_ml, campaign.intro_en)
  const closing = pick(lang, campaign.closing_ml, campaign.closing_en)
  const sorted = [...clauses].sort((a, b) => a.sort_order - b.sort_order)
  const clauseLines = sorted.map((clause, index) => `${index + 1}. ${pick(lang, clause.email_ml, clause.email_en)}`)
  const extras = (details.extraConcerns ?? []).map((item) => item.replace(/\s+/g, ' ').trim()).filter(Boolean)
  for (const extra of extras) {
    clauseLines.push(`${clauseLines.length + 1}. ${extra}`)
  }

  const parts: string[] = ['Sir,', '', intro]
  if (clauseLines.length > 0) parts.push('', clauseLines.join('\n'))
  const personal = (details.customText ?? '').trim()
  if (personal) parts.push('', personal)
  parts.push('', closing, '', senderBlock(details, lang))
  return parts.join('\n')
}

export function composeEmail({ campaign, clauses, details, lang }: ComposeEmailInput): ComposeEmailResult {
  const subject = pick(lang, campaign.subject_ml, campaign.subject_en)
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

export function gmailComposeUrl(params: MailComposeParams, options?: { includeBody?: boolean }): string {
  const to = toHeader(params.to)
  const cc = ccHeader(params.cc)
  const pairs: Array<[string, string]> = [
    ['view', 'cm'],
    ['fs', '1'],
    ['to', to],
  ]
  if (cc) pairs.push(['cc', cc])
  pairs.push(['su', params.subject])
  if (options?.includeBody !== false) pairs.push(['body', params.body])
  return `https://mail.google.com/mail/?${encodePairs(pairs)}`
}

export function mailtoUrl(params: MailComposeParams, options?: { includeBody?: boolean }): string {
  const to = toHeader(params.to)
  const cc = ccHeader(params.cc)
  const pairs: Array<[string, string]> = []
  if (cc) pairs.push(['cc', cc])
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

export function formatCompleteEmailCopy(params: MailComposeParams): string {
  const to = uniqueEmails(params.to)
  const cc = uniqueEmails(params.cc)
  const lines = ['To:', ...to, '']
  if (cc.length > 0) lines.push('CC:', ...cc, '')
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
