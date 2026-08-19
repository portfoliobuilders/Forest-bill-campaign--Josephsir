export const PUBLISH_STATUSES = ['draft', 'preview', 'live', 'closed', 'archived'] as const

export type PublishStatus = (typeof PUBLISH_STATUSES)[number]

export const PUBLISH_STATUS_LABEL: Record<PublishStatus, string> = {
  draft: 'Draft',
  preview: 'Preview',
  live: 'Live',
  closed: 'Closed',
  archived: 'Archived',
}

export const PUBLISH_STATUS_HELP: Record<PublishStatus, string> = {
  draft: 'Only administrators can see this campaign. The public site stays dormant.',
  preview: 'Testers with the preview link can walk through the flow. Real government addresses are not used.',
  live: 'The public site uses this campaign and real recipient addresses.',
  closed: 'The consultation is over. The campaign is no longer offered as live.',
  archived: 'Kept for history. Not offered to the public.',
}

export function isPublishStatus(value: string | null | undefined): value is PublishStatus {
  return !!value && (PUBLISH_STATUSES as readonly string[]).includes(value)
}

export function publishStatusFromRow(row: { is_active?: boolean | null; publish_status?: string | null }): PublishStatus {
  if (isPublishStatus(row.publish_status)) return row.publish_status
  return row.is_active ? 'live' : 'draft'
}

export function flagsForPublishStatus(status: PublishStatus): { is_active: boolean; publish_status: PublishStatus } {
  return {
    publish_status: status,
    is_active: status === 'live',
  }
}

export function requiresLiveConfirmation(from: PublishStatus, to: PublishStatus): boolean {
  return from !== 'live' && to === 'live'
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
