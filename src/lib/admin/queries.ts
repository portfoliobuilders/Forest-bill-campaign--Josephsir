import 'server-only'

import type { PostgrestFilterBuilder } from '@supabase/postgrest-js'

import type { AdminFilters } from '@/lib/admin/filters'
import { createServiceClient } from '@/lib/supabase/server'
import type { SubmissionStatus } from '@/types/database'

export type { AdminFilters }

export type AdminSubmissionRow = {
  id: string
  created_at: string
  full_name: string | null
  district: string
  constituency_name: string | null
  status: SubmissionStatus
  is_test: boolean
  clause_count: number
  custom_text: string | null
  custom_text_public: boolean
}

export type AdminSummary = {
  confirmed: number
  opened: number
  uniqueDistricts: number
  uniqueConstituencies: number
  last24h: number
  topClauses: { code: string; title_ml: string; title_en: string; cnt: number }[]
}

export type AdminStatusCounts = {
  draft: number
  verified: number
  handoffOpened: number
  confirmedSent: number
  serverSent: number
  failed: number
}

export type AdminFunnel = {
  draft: number
  verified: number
  handoffOpened: number
  confirmed: number
  serverSent: number
  counts: AdminStatusCounts
}

export type SubmissionDetail = {
  id: string
  generated_subject: string
  generated_body: string
  send_method: string | null
  custom_text: string | null
  custom_text_public: boolean
  clauses: { code: string; title_ml: string; title_en: string }[]
  reps: { name_ml: string; name_en: string; official_email: string | null; level: string }[]
}

export type DeletionRequestRow = {
  id: string
  email: string
  reason: string | null
  handled_at: string | null
  created_at: string
}

export type NotifySignupRow = {
  id: string
  email: string
  created_at: string
}

const PAGE_SIZE = 100

export { PAGE_SIZE as ADMIN_PAGE_SIZE }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FilterQuery = PostgrestFilterBuilder<any, any, any, any, any>

function applyFilters<Q extends FilterQuery>(query: Q, filters: AdminFilters): Q {
  let q = query
  if (filters.tests !== 'include') q = q.eq('is_test', false) as Q
  if (filters.status) q = q.eq('status', filters.status) as Q
  if (filters.district) q = q.eq('district', filters.district) as Q
  if (filters.constituencyId) q = q.eq('constituency_id', filters.constituencyId) as Q
  if (filters.dateFrom) q = q.gte('created_at', `${filters.dateFrom}T00:00:00.000Z`) as Q
  if (filters.dateTo) q = q.lte('created_at', `${filters.dateTo}T23:59:59.999Z`) as Q
  if (filters.hasCustomText === 'yes') q = q.not('custom_text', 'is', null).neq('custom_text', '') as Q
  if (filters.hasCustomText === 'no') q = q.or('custom_text.is.null,custom_text.eq.') as Q
  return q
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

export async function fetchAdminSubmissions(filters: AdminFilters): Promise<{
  rows: AdminSubmissionRow[]
  total: number
  page: number
  pageSize: number
}> {
  const supabase = createServiceClient()
  const page = Math.max(1, filters.page ?? 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  const ascending = filters.dir === 'asc'
  const sortColumn = filters.sort === 'status' ? 'status' : 'created_at'

  let countQuery = supabase.from('submissions').select('id', { count: 'exact', head: true })
  countQuery = applyFilters(countQuery, filters)
  const { count, error: countError } = await countQuery
  if (countError) throw countError

  // Production is missing custom_text_public; selecting it 500s the whole page.
  let dataQuery = supabase
    .from('submissions')
    .select(
      `
      id,
      created_at,
      full_name,
      district,
      status,
      is_test,
      custom_text,
      constituency:constituencies(name_ml, name_en),
      submission_clauses(count)
    `,
    )
    .order(sortColumn, { ascending })
    .range(from, to)

  if (sortColumn !== 'created_at') {
    dataQuery = dataQuery.order('created_at', { ascending: false })
  }

  dataQuery = applyFilters(dataQuery, filters)
  const { data, error } = await dataQuery
  if (error) throw error

  const rows: AdminSubmissionRow[] = (data ?? []).map((row) => {
    const constituencyRaw = row.constituency
    const constituency = (Array.isArray(constituencyRaw) ? constituencyRaw[0] : constituencyRaw) as
      | { name_ml: string; name_en: string }
      | null
    const clauseCountArr = row.submission_clauses as { count: number }[] | null
    return {
      id: row.id as string,
      created_at: row.created_at as string,
      full_name: (row.full_name as string | null) ?? null,
      district: row.district as string,
      constituency_name: constituency?.name_ml ?? null,
      status: row.status as SubmissionStatus,
      is_test: Boolean(row.is_test),
      clause_count: clauseCountArr?.[0]?.count ?? 0,
      custom_text: (row.custom_text as string | null) ?? null,
      custom_text_public: false,
    }
  })

  return { rows, total: count ?? 0, page, pageSize: PAGE_SIZE }
}

export async function fetchSubmissionDetail(id: string): Promise<SubmissionDetail | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('submissions')
    .select(
      `
      id,
      generated_subject,
      generated_body,
      send_method,
      custom_text,
      cc_representative_ids,
      submission_clauses(
        objection_clauses(code, title_ml, title_en)
      )
    `,
    )
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null

  const clauseRows = (data.submission_clauses ?? []) as {
    objection_clauses: { code: string; title_ml: string; title_en: string } | { code: string; title_ml: string; title_en: string }[] | null
  }[]
  const clauses = clauseRows
    .map((row) => {
      const oc = Array.isArray(row.objection_clauses) ? row.objection_clauses[0] : row.objection_clauses
      return oc ?? null
    })
    .filter((c): c is { code: string; title_ml: string; title_en: string } => Boolean(c))

  const ccIds = (data.cc_representative_ids as string[] | null) ?? []
  let reps: SubmissionDetail['reps'] = []
  if (ccIds.length > 0) {
    const { data: repRows } = await supabase
      .from('representatives')
      .select('name_ml, name_en, official_email, level')
      .in('id', ccIds)
    reps = (repRows ?? []) as SubmissionDetail['reps']
  }

  return {
    id: data.id as string,
    generated_subject: (data.generated_subject as string) ?? '',
    generated_body: (data.generated_body as string) ?? '',
    send_method: (data.send_method as string | null) ?? null,
    custom_text: (data.custom_text as string | null) ?? null,
    custom_text_public: false,
    clauses,
    reps,
  }
}

export async function fetchAdminSummary(includeTests: boolean): Promise<AdminSummary> {
  const supabase = createServiceClient()
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  let baseQuery = supabase.from('submissions').select('id, status, district, constituency_id, created_at')
  if (!includeTests) baseQuery = baseQuery.eq('is_test', false)
  const { data: subs, error } = await baseQuery
  if (error) throw error

  const rows = subs ?? []
  const confirmedRows = rows.filter((r) => r.status === 'confirmed_sent' || r.status === 'server_sent')
  const confirmed = confirmedRows.length
  const opened = rows.filter((r) => r.status === 'handoff_opened').length
  const uniqueDistricts = new Set(confirmedRows.map((r) => r.district)).size
  const uniqueConstituencies = new Set(confirmedRows.map((r) => r.constituency_id).filter(Boolean)).size
  const last24h = rows.filter((r) => r.created_at >= since).length

  let clauseQuery = supabase.from('submission_clauses').select(`
    clause_id,
    objection_clauses(code, title_ml, title_en),
    submissions!inner(status, is_test)
  `)
  if (!includeTests) clauseQuery = clauseQuery.eq('submissions.is_test', false)

  const { data: clauseRows } = await clauseQuery
  const clauseCounts = new Map<string, { code: string; title_ml: string; title_en: string; cnt: number }>()

  for (const row of clauseRows ?? []) {
    const subRaw = row.submissions
    const sub = (Array.isArray(subRaw) ? subRaw[0] : subRaw) as { status: string }
    if (sub.status !== 'confirmed_sent' && sub.status !== 'server_sent') continue
    const ocRaw = row.objection_clauses
    const oc = (Array.isArray(ocRaw) ? ocRaw[0] : ocRaw) as { code: string; title_ml: string; title_en: string }
    if (!oc?.code) continue
    const existing = clauseCounts.get(oc.code)
    if (existing) existing.cnt += 1
    else clauseCounts.set(oc.code, { code: oc.code, title_ml: oc.title_ml, title_en: oc.title_en, cnt: 1 })
  }

  const topClauses = [...clauseCounts.values()].sort((a, b) => b.cnt - a.cnt).slice(0, 5)
  return { confirmed, opened, uniqueDistricts, uniqueConstituencies, last24h, topClauses }
}

export async function fetchAdminFunnel(includeTests: boolean): Promise<AdminFunnel> {
  const supabase = createServiceClient()
  const statuses = ['draft', 'verified', 'handoff_opened', 'confirmed_sent', 'server_sent', 'failed'] as const

  const counts = await Promise.all(
    statuses.map(async (status) => {
      let q = supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('status', status)
      if (!includeTests) q = q.eq('is_test', false)
      const { count, error } = await q
      if (error) throw error
      return count ?? 0
    }),
  )

  const draftOnly = counts[0]
  const verifiedOnly = counts[1]
  const handoffOnly = counts[2]
  const confirmedSent = counts[3]
  const serverSent = counts[4]
  const failed = counts[5]

  const confirmed = confirmedSent + serverSent
  const handoffOpened = handoffOnly + confirmed
  const verified = verifiedOnly + handoffOnly + confirmed + failed
  const draft = draftOnly + verified

  return {
    draft,
    verified,
    handoffOpened,
    confirmed,
    serverSent,
    counts: {
      draft: draftOnly,
      verified: verifiedOnly,
      handoffOpened: handoffOnly,
      confirmedSent,
      serverSent,
      failed,
    },
  }
}

export async function fetchFilterOptions(): Promise<{
  districts: string[]
  constituencies: { id: string; name_ml: string; district: string }[]
}> {
  const supabase = createServiceClient()
  const [{ data: districts }, { data: constituencies }] = await Promise.all([
    supabase.from('submissions').select('district').order('district'),
    supabase.from('constituencies').select('id, name_ml, district').eq('is_active', true).order('district'),
  ])

  const districtSet = [...new Set((districts ?? []).map((d) => d.district as string))].sort()
  return {
    districts: districtSet,
    constituencies: (constituencies ?? []) as { id: string; name_ml: string; district: string }[],
  }
}

export async function fetchDeletionRequests(): Promise<DeletionRequestRow[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('deletion_requests')
    .select('id, email, reason, handled_at, created_at')
    .order('created_at', { ascending: false })
  if (error) return []
  return (data ?? []) as DeletionRequestRow[]
}

export async function fetchNotifySignups(): Promise<NotifySignupRow[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('notify_signups')
    .select('id, email, created_at')
    .order('created_at', { ascending: false })
  if (error) return []
  return (data ?? []) as NotifySignupRow[]
}

export async function* streamSubmissionsCsv(filters: AdminFilters): AsyncGenerator<string> {
  yield '\uFEFF'
  yield 'date,name,district,constituency,status,is_test,clause_count,custom_text_preview\n'

  const supabase = createServiceClient()
  const batchSize = 200
  let offset = 0

  while (true) {
    let query = supabase
      .from('submissions')
      .select(
        `
        created_at,
        full_name,
        district,
        status,
        is_test,
        custom_text,
        constituency:constituencies(name_ml),
        submission_clauses(count)
      `,
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + batchSize - 1)

    query = applyFilters(query, filters)
    const { data, error } = await query
    if (error) throw error
    if (!data || data.length === 0) break

    for (const row of data) {
      const constituencyRaw = row.constituency
      const constituency = (Array.isArray(constituencyRaw) ? constituencyRaw[0] : constituencyRaw) as
        | { name_ml: string }
        | null
      const clauseCountArr = row.submission_clauses as { count: number }[] | null
      const clauseCount = clauseCountArr?.[0]?.count ?? 0
      const preview = ((row.custom_text as string | null) ?? '').slice(0, 80)
      yield [
        csvCell(new Date(row.created_at as string).toISOString().slice(0, 10)),
        csvCell((row.full_name as string | null) ?? ''),
        csvCell((row.district as string) ?? ''),
        csvCell(constituency?.name_ml ?? ''),
        csvCell(row.status as string),
        csvCell(row.is_test ? 'true' : 'false'),
        csvCell(String(clauseCount)),
        csvCell(preview),
      ].join(',') + '\n'
    }

    if (data.length < batchSize) break
    offset += batchSize
  }
}

export async function* streamNotifySignupsCsv(): AsyncGenerator<string> {
  yield '\uFEFF'
  yield 'email,created_at\n'

  const supabase = createServiceClient()
  const batchSize = 200
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from('notify_signups')
      .select('email, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + batchSize - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    for (const row of data) {
      yield `${csvCell(row.email as string)},${csvCell(row.created_at as string)}\n`
    }
    if (data.length < batchSize) break
    offset += batchSize
  }
}
