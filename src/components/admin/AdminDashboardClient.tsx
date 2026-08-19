'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, useTransition } from 'react'

import { moderateCustomText } from '@/app/admin/actions'
import { fetchSubmissionDetailAction } from '@/app/admin/fetch-body'
import { AdminSignOut } from '@/components/admin/AdminSignOut'
import type {
  AdminFunnel,
  AdminSubmissionRow,
  AdminSummary,
  DeletionRequestRow,
  NotifySignupRow,
  SubmissionDetail,
} from '@/lib/admin/queries'
import type { SubmissionStatus } from '@/types/database'

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800'

const STATUSES: SubmissionStatus[] = [
  'draft',
  'verified',
  'handoff_opened',
  'confirmed_sent',
  'server_sent',
  'failed',
]

export function AdminDashboardClient({
  rows,
  total,
  page,
  pageSize,
  summary,
  funnel,
  filterOptions,
  deletionRequests,
  notifySignups,
  adminEmail,
}: {
  rows: AdminSubmissionRow[]
  total: number
  page: number
  pageSize: number
  summary: AdminSummary
  funnel: AdminFunnel
  filterOptions: { districts: string[]; constituencies: { id: string; name_ml: string; district: string }[] }
  deletionRequests: DeletionRequestRow[]
  notifySignups: NotifySignupRow[]
  adminEmail: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [detail, setDetail] = useState<SubmissionDetail | null>(null)
  const [loadingBody, setLoadingBody] = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [, startTransition] = useTransition()

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const sort = searchParams.get('sort') === 'status' ? 'status' : 'created_at'
  const dir = searchParams.get('dir') === 'asc' ? 'asc' : 'desc'

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      params.delete('page')
      router.push(`/admin?${params.toString()}`)
    },
    [router, searchParams],
  )

  function toggleSort(column: 'created_at' | 'status') {
    const params = new URLSearchParams(searchParams.toString())
    const current = searchParams.get('sort') === 'status' ? 'status' : 'created_at'
    const currentDir = searchParams.get('dir') === 'asc' ? 'asc' : 'desc'
    const nextDir = current === column ? (currentDir === 'desc' ? 'asc' : 'desc') : column === 'status' ? 'asc' : 'desc'
    if (column === 'created_at') params.delete('sort')
    else params.set('sort', column)
    if (column === 'created_at' && nextDir === 'desc') params.delete('dir')
    else params.set('dir', nextDir)
    params.delete('page')
    router.push(`/admin?${params.toString()}`)
  }

  async function openDrawer(id: string) {
    setDrawerId(id)
    setLoadingBody(true)
    setDetail(null)
    setCopyState('idle')
    const next = await fetchSubmissionDetailAction(id)
    setDetail(next)
    setLoadingBody(false)
  }

  function closeDrawer() {
    setDrawerId(null)
    setDetail(null)
    setCopyState('idle')
  }

  function exportCsv() {
    const qs = searchParams.toString()
    window.location.href = `/api/admin/export${qs ? `?${qs}` : ''}`
  }

  async function handleModeration(id: string, approved: boolean) {
    startTransition(async () => {
      await moderateCustomText(id, approved)
      router.refresh()
      const next = await fetchSubmissionDetailAction(id)
      setDetail(next)
    })
  }

  async function copyBody() {
    if (!detail?.generated_body) return
    try {
      await navigator.clipboard.writeText(detail.generated_body)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  const selectedRow = rows.find((r) => r.id === drawerId)

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] font-medium tracking-[0.16em] text-stone-500">Janashabdam Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-stone-900 [font-family:var(--font-gayathri),serif]">ജനശബ്ദം Admin</h1>
          <p className="mt-1 text-sm text-stone-600">{adminEmail}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className={`inline-flex min-h-[44px] items-center rounded-md border border-stone-400 bg-white px-3 text-sm font-semibold text-stone-900 hover:bg-stone-100 ${focusRing}`}
          >
            Public site
          </Link>
          <AdminSignOut />
        </div>
      </div>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard label="Draft" value={funnel.counts.draft} />
        <SummaryCard label="Verified" value={funnel.counts.verified} />
        <SummaryCard label="Handoff Opened" value={funnel.counts.handoffOpened} />
        <SummaryCard label="Confirmed Sent" value={funnel.counts.confirmedSent} />
        <SummaryCard label="Server Sent" value={funnel.counts.serverSent} />
      </section>

      <section className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard label="Confirmed" value={summary.confirmed} />
        <SummaryCard label="Handoff opened" value={summary.opened} />
        <SummaryCard label="Unique districts" value={summary.uniqueDistricts} />
        <SummaryCard label="Unique constituencies" value={summary.uniqueConstituencies} />
        <SummaryCard label="Last 24 hours" value={summary.last24h} />
        <div className="rounded-md border border-stone-300 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-600">Top 5 clauses</p>
          {summary.topClauses.length === 0 ? (
            <p className="mt-2 text-sm text-stone-500">No confirmed clauses yet.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {summary.topClauses.map((c) => (
                <li key={c.code} className="flex justify-between gap-2">
                  <span>
                    {c.code} — {c.title_ml}
                  </span>
                  <span className="tabular-nums font-medium">{c.cnt}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <FunnelView funnel={funnel} />

      <section className="mt-6 rounded-md border border-stone-300 bg-white p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold">Filters</h2>
          <button
            type="button"
            onClick={exportCsv}
            className={`min-h-[44px] rounded-md border border-emerald-800 px-4 text-sm font-semibold text-emerald-900 hover:bg-emerald-50 ${focusRing}`}
          >
            Export CSV
          </button>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FilterSelect
            label="Status"
            value={searchParams.get('status') ?? ''}
            onChange={(v) => updateFilter('status', v)}
            options={[{ value: '', label: 'All' }, ...STATUSES.map((s) => ({ value: s, label: s }))]}
          />
          <FilterSelect
            label="District"
            value={searchParams.get('district') ?? ''}
            onChange={(v) => updateFilter('district', v)}
            options={[{ value: '', label: 'All' }, ...filterOptions.districts.map((d) => ({ value: d, label: d }))]}
          />
          <FilterSelect
            label="Constituency"
            value={searchParams.get('constituency') ?? ''}
            onChange={(v) => updateFilter('constituency', v)}
            options={[
              { value: '', label: 'All' },
              ...filterOptions.constituencies.map((c) => ({ value: c.id, label: `${c.name_ml} (${c.district})` })),
            ]}
          />
          <label className="block text-sm">
            <span className="font-medium text-stone-700">From</span>
            <input
              type="date"
              value={searchParams.get('dateFrom') ?? ''}
              onChange={(e) => updateFilter('dateFrom', e.target.value)}
              className={`mt-1 w-full min-h-[44px] rounded-md border border-stone-400 px-2 ${focusRing}`}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-stone-700">To</span>
            <input
              type="date"
              value={searchParams.get('dateTo') ?? ''}
              onChange={(e) => updateFilter('dateTo', e.target.value)}
              className={`mt-1 w-full min-h-[44px] rounded-md border border-stone-400 px-2 ${focusRing}`}
            />
          </label>
          <FilterSelect
            label="Custom text"
            value={searchParams.get('hasCustomText') ?? ''}
            onChange={(v) => updateFilter('hasCustomText', v)}
            options={[
              { value: '', label: 'All' },
              { value: 'yes', label: 'Has custom text' },
              { value: 'no', label: 'No custom text' },
            ]}
          />
          <FilterSelect
            label="Test rows"
            value={searchParams.get('tests') === 'include' ? 'include' : 'exclude'}
            onChange={(v) => updateFilter('tests', v === 'include' ? 'include' : '')}
            options={[
              { value: 'exclude', label: 'Exclude test (default)' },
              { value: 'include', label: 'Include test rows' },
            ]}
          />
        </div>
      </section>

      <div className="mt-4 overflow-x-auto rounded-md border border-stone-300 bg-white">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-stone-300 bg-stone-50 text-xs uppercase tracking-wide text-stone-600">
            <tr>
              <th className="px-3 py-2">
                <SortButton label="Date / Time" active={sort === 'created_at'} dir={dir} onClick={() => toggleSort('created_at')} />
              </th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">District</th>
              <th className="px-3 py-2">Constituency</th>
              <th className="px-3 py-2">
                <SortButton label="Status" active={sort === 'status'} dir={dir} onClick={() => toggleSort('status')} />
              </th>
              <th className="px-3 py-2">Test / Live</th>
              <th className="px-3 py-2">Clause Count</th>
              <th className="px-3 py-2">Custom text</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-stone-600">
                  No submissions match these filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer border-b border-stone-200 hover:bg-stone-50"
                  onClick={() => void openDrawer(row.id)}
                >
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(row.created_at).toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2">{row.full_name ?? '—'}</td>
                  <td className="px-3 py-2">{row.district}</td>
                  <td className="px-3 py-2">{row.constituency_name ?? '—'}</td>
                  <td className="px-3 py-2">{row.status}</td>
                  <td className="px-3 py-2">{row.is_test ? 'Test' : 'Live'}</td>
                  <td className="px-3 py-2 tabular-nums">{row.clause_count}</td>
                  <td className="max-w-[200px] truncate px-3 py-2 text-stone-600">
                    {row.custom_text ? (
                      <>
                        {row.custom_text.slice(0, 60)}
                        {row.custom_text_public ? ' ✓' : ''}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <p>
          {total} total · page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          {page > 1 ? <PaginationLink page={page - 1} searchParams={searchParams.toString()} label="Previous" /> : null}
          {page < totalPages ? (
            <PaginationLink page={page + 1} searchParams={searchParams.toString()} label="Next" />
          ) : null}
        </div>
      </div>

      {drawerId ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={closeDrawer}>
          <div
            className="h-full w-full max-w-lg overflow-y-auto bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-bold">Submission detail</h2>
              <button type="button" onClick={closeDrawer} className={`min-h-[44px] px-3 ${focusRing}`}>
                Close
              </button>
            </div>

            <p className="mt-2 text-sm text-stone-600">
              {selectedRow?.full_name ?? '—'} · {selectedRow?.district} · {selectedRow?.status}
              {selectedRow?.is_test ? ' · test' : ''}
            </p>

            <p className="mt-3 text-sm">
              <span className="font-medium">send_method: </span>
              {detail?.send_method ?? '—'}
            </p>

            {detail?.clauses.length ? (
              <div className="mt-3">
                <h3 className="text-sm font-semibold">Clauses selected</h3>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                  {detail.clauses.map((c) => (
                    <li key={c.code}>
                      {c.code} — {c.title_ml}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-3 text-sm text-stone-600">No clauses stored.</p>
            )}

            <div className="mt-3">
              <h3 className="text-sm font-semibold">Representatives CC’d</h3>
              {detail?.reps.length ? (
                <ul className="mt-1 space-y-1 text-sm">
                  {detail.reps.map((r) => (
                    <li key={`${r.name_en}-${r.official_email ?? ''}`}>
                      {r.name_ml} ({r.level}
                      {r.official_email ? ` · ${r.official_email}` : ''})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-stone-600">None.</p>
              )}
            </div>

            {selectedRow?.custom_text || detail?.custom_text ? (
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleModeration(drawerId, true)}
                  className={`min-h-[44px] flex-1 rounded-md bg-emerald-800 px-3 text-sm font-semibold text-white ${focusRing}`}
                >
                  Approve custom text
                </button>
                <button
                  type="button"
                  onClick={() => void handleModeration(drawerId, false)}
                  className={`min-h-[44px] flex-1 rounded-md border border-red-700 px-3 text-sm font-semibold text-red-800 ${focusRing}`}
                >
                  Reject
                </button>
              </div>
            ) : null}

            <div className="mt-4 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Stored generated_body</h3>
              <button
                type="button"
                onClick={() => void copyBody()}
                disabled={!detail?.generated_body}
                className={`min-h-[44px] rounded-md border border-stone-400 px-3 text-sm ${focusRing}`}
              >
                {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : 'Copy'}
              </button>
            </div>
            {detail?.generated_subject ? (
              <p className="mt-2 text-sm">
                <span className="font-medium">Subject: </span>
                {detail.generated_subject}
              </p>
            ) : null}
            {loadingBody ? (
              <p className="mt-4 text-stone-600">Loading…</p>
            ) : (
              <pre className="mt-2 whitespace-pre-wrap break-words rounded-md border border-stone-300 bg-stone-50 p-3 text-sm leading-relaxed">
                {detail?.generated_body ?? 'Not found'}
              </pre>
            )}
          </div>
        </div>
      ) : null}

      <DeletionRequestsSection initial={deletionRequests} />
      <NotifySignupsSection rows={notifySignups} />
    </div>
  )
}

function dropOff(from: number, to: number): string {
  if (from <= 0) return '—'
  const pct = Math.round((1 - to / from) * 100)
  return `${pct}% drop-off`
}

function FunnelView({ funnel }: { funnel: AdminFunnel }) {
  const steps = [
    { key: 'draft', label: 'draft', value: funnel.draft },
    { key: 'verified', label: 'verified', value: funnel.verified, from: funnel.draft },
    { key: 'handoff', label: 'handoff_opened', value: funnel.handoffOpened, from: funnel.verified },
    { key: 'confirmed', label: 'confirmed_sent', value: funnel.confirmed, from: funnel.handoffOpened },
  ]
  const max = Math.max(1, funnel.draft)

  return (
    <section className="mt-6 rounded-md border border-stone-300 bg-white p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-600">Funnel</h2>
      <p className="mt-1 text-sm text-stone-600">Where the wizard loses people. Counts are cumulative.</p>
      <ol className="mt-4 space-y-3">
        {steps.map((step) => {
          const width = Math.max(4, (step.value / max) * 100)
          return (
            <li key={step.key}>
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <span className="font-medium">{step.label}</span>
                <span className="tabular-nums">
                  {step.value.toLocaleString('en-IN')}
                  {'from' in step && step.from !== undefined ? ` · ${dropOff(step.from, step.value)}` : ''}
                </span>
              </div>
              <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-stone-200">
                <div className="h-full rounded-full bg-emerald-800" style={{ width: `${width}%` }} />
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-stone-300 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-600">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-900">{value.toLocaleString('en-IN')}</p>
    </div>
  )
}

function SortButton({
  label,
  active,
  dir,
  onClick,
}: {
  label: string
  active: boolean
  dir: 'asc' | 'desc'
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} className={`uppercase tracking-wide ${focusRing}`}>
      {label}
      {active ? (dir === 'asc' ? ' ↑' : ' ↓') : ''}
    </button>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-stone-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1 w-full min-h-[44px] rounded-md border border-stone-400 px-2 ${focusRing}`}
      >
        {options.map((o) => (
          <option key={o.value || 'all'} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function PaginationLink({ page, searchParams, label }: { page: number; searchParams: string; label: string }) {
  const params = new URLSearchParams(searchParams)
  params.set('page', String(page))
  return (
    <a
      href={`/admin?${params.toString()}`}
      className={`inline-flex min-h-[44px] items-center rounded-md border border-stone-400 px-3 hover:bg-stone-100 ${focusRing}`}
    >
      {label}
    </a>
  )
}

function DeletionRequestsSection({ initial }: { initial: DeletionRequestRow[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function handleMark(id: string) {
    const { markDeletionHandled } = await import('@/app/admin/actions')
    startTransition(async () => {
      await markDeletionHandled(id)
      router.refresh()
    })
  }

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold">Deletion requests</h2>
      {initial.length === 0 ? (
        <p className="mt-2 text-sm text-stone-600">None pending.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {initial.map((req) => (
            <li
              key={req.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-stone-300 bg-white p-3 text-sm"
            >
              <div>
                <p className="font-medium">{req.email}</p>
                {req.reason ? <p className="text-stone-600">{req.reason}</p> : null}
                <p className="text-xs text-stone-500">{req.created_at.slice(0, 10)}</p>
              </div>
              {req.handled_at ? (
                <span className="text-emerald-800">Handled {req.handled_at.slice(0, 10)}</span>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleMark(req.id)}
                  className={`min-h-[44px] rounded-md bg-stone-800 px-3 text-white ${focusRing}`}
                >
                  Mark handled
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function NotifySignupsSection({ rows }: { rows: NotifySignupRow[] }) {
  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Notify signups</h2>
        <a
          href="/api/admin/notify-export"
          className={`inline-flex min-h-[44px] items-center rounded-md border border-emerald-800 px-4 text-sm font-semibold text-emerald-900 hover:bg-emerald-50 ${focusRing}`}
        >
          Export CSV
        </a>
      </div>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-stone-600">None yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-stone-200 rounded-md border border-stone-300 bg-white">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
              <span>{row.email}</span>
              <span className="text-stone-500">{row.created_at.slice(0, 10)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
