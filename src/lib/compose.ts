import { t, type Lang } from '@/lib/i18n'
import type { Campaign, ObjectionClause } from '@/types/database'

export const MAX_BODY_CHARS = 1500
export const URL_LENGTH_WARN = 1900

export type ComposeDetails = {
  fullName: string
  addressLine: string
  panchayat: string
  district: string
  pincode: string
  phone: string
  customText?: string
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
  to: string
  cc: string[]
  subject: string
  body: string
}

export function charCount(text: string): number {
  return [...text].length
}

function pick(lang: Lang, ml: string, en: string): string {
  return lang === 'en' ? en : ml
}

function localityLine(details: ComposeDetails): string {
  return [details.panchayat.trim(), details.district.trim()].filter(Boolean).join(', ')
}

function customBlock(lang: Lang, customText: string): string | null {
  const trimmed = customText.trim()
  if (!trimmed) return null
  return `${t(lang, 'customText')}\n${trimmed}`
}

function assembleBody(
  campaign: Campaign,
  clauses: ObjectionClause[],
  details: ComposeDetails,
  lang: Lang,
  customText: string,
): string {
  const intro = pick(lang, campaign.intro_ml, campaign.intro_en)
  const closing = pick(lang, campaign.closing_ml, campaign.closing_en)
  const sorted = [...clauses].sort((a, b) => a.sort_order - b.sort_order)
  const clauseLines = sorted.map((clause, index) => {
    const text = pick(lang, clause.email_ml, clause.email_en)
    return `${index + 1}. ${text}`
  })

  const parts: string[] = [intro, '', clauseLines.join('\n'), '']

  const custom = customBlock(lang, customText)
  if (custom) {
    parts.push(custom, '')
  }

  parts.push(closing, '', details.fullName, details.addressLine, localityLine(details), details.pincode, details.phone)

  return parts.join('\n')
}

function sliceChars(text: string, maxChars: number): string {
  return [...text].slice(0, maxChars).join('')
}

export function composeEmail({
  campaign,
  clauses,
  details,
  lang,
}: ComposeEmailInput): ComposeEmailResult {
  const subject = pick(lang, campaign.subject_ml, campaign.subject_en)
  const customOriginal = details.customText ?? ''

  const fullBody = assembleBody(campaign, clauses, details, lang, customOriginal)
  if (charCount(fullBody) <= MAX_BODY_CHARS) {
    return { subject, body: fullBody, charCount: charCount(fullBody), error: null }
  }

  const withoutCustom = assembleBody(campaign, clauses, details, lang, '')
  if (charCount(withoutCustom) > MAX_BODY_CHARS) {
    return {
      subject,
      body: withoutCustom,
      charCount: charCount(withoutCustom),
      error: 'too_long',
    }
  }

  let lo = 0
  let hi = charCount(customOriginal)
  let fitted = withoutCustom

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    const trialCustom = sliceChars(customOriginal, mid)
    const trialBody = assembleBody(campaign, clauses, details, lang, trialCustom)
    if (charCount(trialBody) <= MAX_BODY_CHARS) {
      fitted = trialBody
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }

  return { subject, body: fitted, charCount: charCount(fitted), error: null }
}

function encodePairs(pairs: Array<[string, string]>): string {
  return pairs.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')
}

export function gmailComposeUrl({ to, cc, subject, body }: MailComposeParams): string {
  const pairs: Array<[string, string]> = [
    ['view', 'cm'],
    ['fs', '1'],
    ['to', to],
  ]
  if (cc.length > 0) {
    pairs.push(['cc', cc.join(',')])
  }
  pairs.push(['su', subject], ['body', body])
  return `https://mail.google.com/mail/?${encodePairs(pairs)}`
}

export function mailtoUrl({ to, cc, subject, body }: MailComposeParams): string {
  const pairs: Array<[string, string]> = []
  if (cc.length > 0) {
    pairs.push(['cc', cc.join(',')])
  }
  pairs.push(['subject', subject], ['body', body])
  return `mailto:${encodeURIComponent(to)}?${encodePairs(pairs)}`
}

export function estimateUrlLength(params: MailComposeParams): number {
  return Math.max(gmailComposeUrl(params).length, mailtoUrl(params).length)
}

/** Adds an official representative email to CC only when the citizen opted in. Does not touch body or subject. */
export function withRepresentativeCc(
  params: MailComposeParams,
  officialEmail: string | null | undefined,
  optedIn: boolean,
): MailComposeParams {
  const email = officialEmail?.trim()
  if (!optedIn || !email) {
    return params
  }
  if (params.cc.some((existing) => existing.toLowerCase() === email.toLowerCase())) {
    return params
  }
  return { ...params, cc: [...params.cc, email] }
}
