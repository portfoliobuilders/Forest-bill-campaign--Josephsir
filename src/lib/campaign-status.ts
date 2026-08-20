import type { Campaign, CampaignStatus, PublishStatus } from '@/types/database'

export type { CampaignStatus }

export const CAMPAIGN_STATUSES = ['draft', 'active', 'inactive', 'expired', 'archived'] as const

export const CAMPAIGN_STATUS_LABEL: Record<CampaignStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  inactive: 'Inactive',
  expired: 'Expired',
  archived: 'Archived',
}

export function isCampaignStatus(value: string | null | undefined): value is CampaignStatus {
  return !!value && (CAMPAIGN_STATUSES as readonly string[]).includes(value)
}

export function statusFromLegacy(row: {
  status?: string | null
  is_active?: boolean | null
  publish_status?: string | null
}): CampaignStatus {
  if (isCampaignStatus(row.status)) return row.status
  if (row.publish_status === 'archived') return 'archived'
  if (row.publish_status === 'closed') return 'expired'
  if (row.publish_status === 'live' || row.is_active) return 'active'
  return 'draft'
}

export function flagsForCampaignStatus(status: CampaignStatus): {
  status: CampaignStatus
  is_active: boolean
  publish_status: PublishStatus
} {
  if (status === 'active') return { status, is_active: true, publish_status: 'live' }
  if (status === 'archived') return { status, is_active: false, publish_status: 'archived' }
  if (status === 'draft') return { status, is_active: false, publish_status: 'draft' }
  return { status, is_active: false, publish_status: 'closed' }
}

/** Public-facing status. An ended deadline expires an otherwise active campaign. */
export function effectiveCampaignStatus(campaign: Pick<Campaign, 'status' | 'opens_at' | 'deadline_at'>, now = new Date()): CampaignStatus {
  const status = campaign.status
  if (status === 'active') {
    if (campaign.deadline_at && new Date(campaign.deadline_at).getTime() < now.getTime()) return 'expired'
    if (campaign.opens_at && new Date(campaign.opens_at).getTime() > now.getTime()) return 'inactive'
  }
  return status
}

export function isPubliclyActionable(campaign: Pick<Campaign, 'status' | 'opens_at' | 'deadline_at'>, now = new Date()): boolean {
  return effectiveCampaignStatus(campaign, now) === 'active'
}

export function slugFromTitle(title: string): string {
  const ascii = title
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
  return ascii || `campaign-${Date.now().toString(36)}`
}

export function requiresPublishConfirmation(from: CampaignStatus, to: CampaignStatus): boolean {
  return from !== 'active' && to === 'active'
}
