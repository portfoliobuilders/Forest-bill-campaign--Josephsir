import type { DisplayStage } from '@/lib/admin/stages'
import { DISPLAY_STAGES } from '@/lib/admin/stages'
import type { SendMethod } from '@/types/database'

export type TestsFilter = 'exclude' | 'include'
export type AdminSort = 'created_at' | 'stage'
export type AdminSortDir = 'asc' | 'desc'
export type TrendRange = '7d' | '30d' | 'all'

export type AdminFilters = {
  campaignId?: string
  stage?: DisplayStage | ''
  district?: string
  panchayat?: string
  constituencyId?: string
  concernId?: string
  dateFrom?: string
  dateTo?: string
  sendMethod?: SendMethod | ''
  hasCustomText?: 'yes' | 'no' | ''
  tests: TestsFilter
  q?: string
  sort: AdminSort
  dir: AdminSortDir
  page?: number
}

const SEND_METHODS: readonly SendMethod[] = ['gmail_web', 'mailto', 'copy', 'server', 'print']

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

export function parseAdminFilters(
  searchParams: Record<string, string | string[] | undefined> | URLSearchParams,
): AdminFilters {
  const get = (key: string) =>
    searchParams instanceof URLSearchParams ? (searchParams.get(key) ?? '') : first(searchParams[key])

  const stageRaw = get('stage')
  const stage = DISPLAY_STAGES.includes(stageRaw as DisplayStage) ? (stageRaw as DisplayStage) : ''
  const tests: TestsFilter = get('tests') === 'include' ? 'include' : 'exclude'
  const sort: AdminSort = get('sort') === 'stage' ? 'stage' : 'created_at'
  const dir: AdminSortDir = get('dir') === 'asc' ? 'asc' : 'desc'
  const hasCustomTextRaw = get('hasCustomText')
  const hasCustomText = hasCustomTextRaw === 'yes' || hasCustomTextRaw === 'no' ? hasCustomTextRaw : ''
  const sendRaw = get('sendMethod')
  const sendMethod = SEND_METHODS.includes(sendRaw as SendMethod) ? (sendRaw as SendMethod) : ''
  const page = Math.max(1, Number.parseInt(get('page') || '1', 10) || 1)

  return {
    campaignId: get('campaign') || undefined,
    stage,
    district: get('district'),
    panchayat: get('panchayat'),
    constituencyId: get('constituency'),
    concernId: get('concern'),
    dateFrom: get('dateFrom'),
    dateTo: get('dateTo'),
    sendMethod,
    hasCustomText,
    tests,
    q: get('q').trim(),
    sort,
    dir,
    page,
  }
}

export function parseTrendRange(value: string | null | undefined): TrendRange {
  if (value === '30d' || value === 'all') return value
  return '7d'
}
