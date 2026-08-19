import type { SendMethod, SubmissionStatus } from '@/types/database'

export type DisplayStage = 'started' | 'prepared' | 'email_opened' | 'confirmed_sent' | 'failed'

export const DISPLAY_STAGES: readonly DisplayStage[] = [
  'started',
  'prepared',
  'email_opened',
  'confirmed_sent',
  'failed',
]

export const DISPLAY_STAGE_LABEL: Record<DisplayStage, string> = {
  started: 'Started',
  prepared: 'Prepared',
  email_opened: 'Email Opened',
  confirmed_sent: 'Confirmed Sent',
  failed: 'Failed',
}

/** Statuses that mean the citizen reached the email-preview stage. */
export const PREPARED_STATUSES: readonly SubmissionStatus[] = [
  'verified',
  'handoff_opened',
  'confirmed_sent',
  'server_sent',
]

/** Statuses that mean a mail client was opened (not delivery proof). */
export const EMAIL_OPENED_STATUSES: readonly SubmissionStatus[] = [
  'handoff_opened',
  'confirmed_sent',
  'server_sent',
]

/** Citizen confirmed sending, or a legitimate server send. */
export const CONFIRMED_STATUSES: readonly SubmissionStatus[] = ['confirmed_sent', 'server_sent']

export const SEND_METHOD_LABEL: Record<SendMethod, string> = {
  gmail_web: 'Gmail',
  mailto: 'Mail app',
  copy: 'Copy text',
  server: 'Server send',
  print: 'Print',
}

export function displayStage(status: SubmissionStatus): DisplayStage {
  if (status === 'failed') return 'failed'
  if (status === 'confirmed_sent' || status === 'server_sent') return 'confirmed_sent'
  if (status === 'handoff_opened') return 'email_opened'
  if (status === 'verified') return 'prepared'
  return 'started'
}

export function statusesForDisplayStage(stage: DisplayStage | '' | undefined): SubmissionStatus[] | null {
  if (!stage) return null
  switch (stage) {
    case 'started':
      return ['draft']
    case 'prepared':
      return ['verified']
    case 'email_opened':
      return ['handoff_opened']
    case 'confirmed_sent':
      return ['confirmed_sent', 'server_sent']
    case 'failed':
      return ['failed']
  }
}

export function isPreparedStatus(status: SubmissionStatus): boolean {
  return (PREPARED_STATUSES as readonly string[]).includes(status)
}

export function isEmailOpenedStatus(status: SubmissionStatus): boolean {
  return (EMAIL_OPENED_STATUSES as readonly string[]).includes(status)
}

export function isConfirmedStatus(status: SubmissionStatus): boolean {
  return (CONFIRMED_STATUSES as readonly string[]).includes(status)
}

export type FunnelCounts = {
  started: number
  prepared: number
  emailOpened: number
  confirmedSent: number
}

export function funnelFromStatusCounts(counts: Partial<Record<SubmissionStatus, number>>): FunnelCounts {
  const n = (status: SubmissionStatus) => counts[status] ?? 0
  const started = n('draft') + n('verified') + n('handoff_opened') + n('confirmed_sent') + n('server_sent') + n('failed')
  const prepared = n('verified') + n('handoff_opened') + n('confirmed_sent') + n('server_sent')
  const emailOpened = n('handoff_opened') + n('confirmed_sent') + n('server_sent')
  const confirmedSent = n('confirmed_sent') + n('server_sent')
  return { started, prepared, emailOpened, confirmedSent }
}

export function conversionPct(from: number, to: number): number | null {
  if (from <= 0) return null
  return Math.round((to / from) * 1000) / 10
}

export function dropOffPct(from: number, to: number): number | null {
  if (from <= 0) return null
  return Math.round((1 - to / from) * 1000) / 10
}

export function sendMethodLabel(method: string | null | undefined): string {
  if (!method) return '—'
  return SEND_METHOD_LABEL[method as SendMethod] ?? method
}
