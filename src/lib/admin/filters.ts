import type { SubmissionStatus } from '@/types/database'

export type TestsFilter = 'exclude' | 'include'
export type AdminSort = 'created_at' | 'status'
export type AdminSortDir = 'asc' | 'desc'

export type AdminFilters = {
  status?: SubmissionStatus | ''
  district?: string
  constituencyId?: string
  dateFrom?: string
  dateTo?: string
  hasCustomText?: 'yes' | 'no' | ''
  tests: TestsFilter
  sort: AdminSort
  dir: AdminSortDir
  page?: number
}

const STATUSES: readonly SubmissionStatus[] = [
  'draft',
  'verified',
  'handoff_opened',
  'confirmed_sent',
  'server_sent',
  'failed',
]

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

export function parseAdminFilters(
  searchParams: Record<string, string | string[] | undefined> | URLSearchParams,
): AdminFilters {
  const get = (key: string) =>
    searchParams instanceof URLSearchParams ? (searchParams.get(key) ?? '') : first(searchParams[key])

  const statusRaw = get('status')
  const status = STATUSES.includes(statusRaw as SubmissionStatus) ? (statusRaw as SubmissionStatus) : ''
  const tests: TestsFilter = get('tests') === 'include' ? 'include' : 'exclude'
  const sort: AdminSort = get('sort') === 'status' ? 'status' : 'created_at'
  const dir: AdminSortDir = get('dir') === 'asc' ? 'asc' : 'desc'
  const hasCustomTextRaw = get('hasCustomText')
  const hasCustomText = hasCustomTextRaw === 'yes' || hasCustomTextRaw === 'no' ? hasCustomTextRaw : ''
  const page = Math.max(1, Number.parseInt(get('page') || '1', 10) || 1)

  return {
    status,
    district: get('district'),
    constituencyId: get('constituency'),
    dateFrom: get('dateFrom'),
    dateTo: get('dateTo'),
    hasCustomText,
    tests,
    sort,
    dir,
    page,
  }
}
