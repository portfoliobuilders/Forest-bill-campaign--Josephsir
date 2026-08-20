import { uniqueEmails } from '@/lib/compose-emails'
import type { Campaign, CampaignRecipient, RecipientType } from '@/types/database'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim())
}

export function parseEmailList(raw: string | string[]): string[] {
  const parts = Array.isArray(raw) ? raw : raw.split(/[\n,;]+/)
  return uniqueEmails(parts.map((item) => item.trim()).filter(Boolean))
}

export function invalidEmails(emails: string[]): string[] {
  return emails.filter((email) => !isValidEmail(email))
}

export function recipientsOfType(
  rows: CampaignRecipient[] | null | undefined,
  type: RecipientType,
): string[] {
  return uniqueEmails(
    (rows ?? [])
      .filter((row) => row.is_active && row.recipient_type === type)
      .sort((a, b) => a.display_order - b.display_order)
      .map((row) => row.email),
  )
}

export function applyRecipientsToCampaign(campaign: Campaign, rows: CampaignRecipient[] | null | undefined): Campaign {
  if (!rows || rows.length === 0) {
    return {
      ...campaign,
      recipient_emails: uniqueEmails(campaign.recipient_emails?.length ? campaign.recipient_emails : [campaign.recipient_email]),
      cc_emails: uniqueEmails(campaign.cc_emails ?? []),
      bcc_emails: uniqueEmails(campaign.bcc_emails ?? []),
    }
  }
  const to = recipientsOfType(rows, 'to')
  const cc = recipientsOfType(rows, 'cc')
  const bcc = recipientsOfType(rows, 'bcc')
  return {
    ...campaign,
    recipient_emails: to,
    recipient_email: to[0] ?? campaign.recipient_email,
    cc_emails: cc,
    bcc_emails: bcc,
  }
}

export function rowsFromLists(
  campaignId: string,
  to: string[],
  cc: string[],
  bcc: string[],
): Array<Omit<CampaignRecipient, 'id'>> {
  const out: Array<Omit<CampaignRecipient, 'id'>> = []
  uniqueEmails(to).forEach((email, index) => {
    out.push({ campaign_id: campaignId, recipient_type: 'to', email, display_order: index + 1, is_active: true })
  })
  uniqueEmails(cc).forEach((email, index) => {
    out.push({ campaign_id: campaignId, recipient_type: 'cc', email, display_order: index + 1, is_active: true })
  })
  uniqueEmails(bcc).forEach((email, index) => {
    out.push({ campaign_id: campaignId, recipient_type: 'bcc', email, display_order: index + 1, is_active: true })
  })
  return out
}
