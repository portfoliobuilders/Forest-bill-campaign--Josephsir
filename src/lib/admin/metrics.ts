import {
  funnelFromStatusCounts,
  type FunnelCounts,
} from '@/lib/admin/stages'
import type { SubmissionStatus } from '@/types/database'

export const METRIC_DEFINITIONS = {
  totalParticipants: {
    id: 'total_participants',
    label: 'Total Participants',
    definition: 'Unique real submission records for the selected campaign. Test rows excluded by default.',
    statuses: 'all',
  },
  prepared: {
    id: 'prepared',
    label: 'Objections Prepared',
    definition: 'Reached the email-preview stage (verified, email opened, or confirmed sent). Drafts are not counted.',
    statuses: 'verified, handoff_opened, confirmed_sent, server_sent',
  },
  emailOpened: {
    id: 'email_opened',
    label: 'Email Opened',
    definition: 'Citizen opened Gmail or another mail handoff. This is not proof of delivery.',
    statuses: 'handoff_opened, confirmed_sent, server_sent',
  },
  confirmedSent: {
    id: 'confirmed_sent',
    label: 'Confirmed Sent',
    definition: 'Citizen pressed “I sent it”, plus legitimate server_sent rows.',
    statuses: 'confirmed_sent, server_sent',
  },
  districtsReached: {
    id: 'districts_reached',
    label: 'Districts Reached',
    definition: 'Distinct district values among real participating submissions.',
    statuses: 'all real submissions',
  },
  today: {
    id: 'today',
    label: 'Today',
    definition: 'Real submissions created in the last 24 hours.',
    statuses: 'all',
  },
} as const

export function weekChangePct(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? 100 : null
  return Math.round(((current - previous) / previous) * 1000) / 10
}

export function countFromStatusMap(
  counts: Partial<Record<SubmissionStatus, number>>,
  statuses: readonly SubmissionStatus[] | 'all',
): number {
  if (statuses === 'all') {
    return Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0)
  }
  return statuses.reduce((sum, status) => sum + (counts[status] ?? 0), 0)
}

export function dashboardFunnel(counts: Partial<Record<SubmissionStatus, number>>): FunnelCounts {
  return funnelFromStatusCounts(counts)
}
