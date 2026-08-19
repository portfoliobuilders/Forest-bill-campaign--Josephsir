'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { AdminPageHeader, EmptyState } from '@/components/admin/AdminPrimitives'
import { adminBtnSecondary, adminFocus, adminInput } from '@/components/admin/admin-ui'
import { DISPLAY_STAGES, DISPLAY_STAGE_LABEL } from '@/lib/admin/stages'
import { formatAdminDateTime } from '@/lib/admin/format'
import type { AdminSubmissionRow } from '@/lib/admin/queries'

export function SubmissionsTable({
  rows,
  total,
  page,
  pageSize,
  filterOptions,
}: {
  rows: AdminSubmissionRow[]
  total: number
  page: number
  pageSize: number
  filterOptions: {
    districts: string[]
    panchayats: string[]
    constituencies: { id: string; name_ml: string; district: string }[]
    concerns: { id: string; code: string; title_en: string; title_ml: string }[]
  }
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    router.push(`/admin/submissions?${params.toString()}`)
  }

  function exportCsv() {
    window.location.href = `/api/admin/export?${searchParams.toString()}`
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Submissions"
        description="Citizen records for the selected campaign. Default view is real submissions only."
        actions={
          <button type="button" className={adminBtnSecondary} onClick={exportCsv}>
            Export CSV
          </button>
        }
      />

      <form
        className="grid gap-3 rounded-md border border-stone-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          setParam('q', String(form.get('q') ?? ''))
        }}
      >
        <label className="sm:col-span-2">
          <span className="text-xs font-medium text-stone-500">Search name, email, phone</span>
          <input name="q" defaultValue={searchParams.get('q') ?? ''} className={adminInput} />
        </label>
        <FilterSelect
          label="Stage"
          value={searchParams.get('stage') ?? ''}
          onChange={(v) => setParam('stage', v)}
          options={[{ value: '', label: 'All' }, ...DISPLAY_STAGES.map((s) => ({ value: s, label: DISPLAY_STAGE_LABEL[s] }))]}
        />
        <FilterSelect
          label="District"
          value={searchParams.get('district') ?? ''}
          onChange={(v) => setParam('district', v)}
          options={[{ value: '', label: 'All' }, ...filterOptions.districts.map((d) => ({ value: d, label: d }))]}
        />
        <FilterSelect
          label="Panchayat"
          value={searchParams.get('panchayat') ?? ''}
          onChange={(v) => setParam('panchayat', v)}
          options={[{ value: '', label: 'All' }, ...filterOptions.panchayats.map((d) => ({ value: d, label: d }))]}
        />
        <FilterSelect
          label="Constituency"
          value={searchParams.get('constituency') ?? ''}
          onChange={(v) => setParam('constituency', v)}
          options={[
            { value: '', label: 'All' },
            ...filterOptions.constituencies.map((c) => ({ value: c.id, label: `${c.name_ml} (${c.district})` })),
          ]}
        />
        <FilterSelect
          label="Concern"
          value={searchParams.get('concern') ?? ''}
          onChange={(v) => setParam('concern', v)}
          options={[
            { value: '', label: 'All' },
            ...filterOptions.concerns.map((c) => ({ value: c.id, label: c.title_en })),
          ]}
        />
        <label>
          <span className="text-xs font-medium text-stone-500">From</span>
          <input type="date" className={adminInput} value={searchParams.get('dateFrom') ?? ''} onChange={(e) => setParam('dateFrom', e.target.value)} />
        </label>
        <label>
          <span className="text-xs font-medium text-stone-500">To</span>
          <input type="date" className={adminInput} value={searchParams.get('dateTo') ?? ''} onChange={(e) => setParam('dateTo', e.target.value)} />
        </label>
        <FilterSelect
          label="Send method"
          value={searchParams.get('sendMethod') ?? ''}
          onChange={(v) => setParam('sendMethod', v)}
          options={[
            { value: '', label: 'All' },
            { value: 'gmail_web', label: 'Gmail' },
            { value: 'mailto', label: 'Mail app' },
            { value: 'copy', label: 'Copy text' },
            { value: 'print', label: 'Print' },
            { value: 'server', label: 'Server send' },
          ]}
        />
        <FilterSelect
          label="Personal comment"
          value={searchParams.get('hasCustomText') ?? ''}
          onChange={(v) => setParam('hasCustomText', v)}
          options={[
            { value: '', label: 'All' },
            { value: 'yes', label: 'Has comment' },
            { value: 'no', label: 'No comment' },
          ]}
        />
        <FilterSelect
          label="Live / Test"
          value={searchParams.get('tests') === 'include' ? 'include' : 'exclude'}
          onChange={(v) => setParam('tests', v === 'include' ? 'include' : '')}
          options={[
            { value: 'exclude', label: 'Real only (default)' },
            { value: 'include', label: 'Include test submissions' },
          ]}
        />
        <button type="submit" className={`${adminBtnSecondary} self-end`}>
          Search
        </button>
      </form>

      <div className="hidden overflow-hidden rounded-md border border-stone-200 bg-white lg:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">District</th>
              <th className="px-3 py-2">Panchayat</th>
              <th className="px-3 py-2">Constituency</th>
              <th className="px-3 py-2">Concerns</th>
              <th className="px-3 py-2">Stage</th>
              <th className="px-3 py-2">Send</th>
              <th className="px-3 py-2">Live</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-3 py-8 text-center text-stone-500">
                  No submissions match these filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-stone-100">
                  <td className="whitespace-nowrap px-3 py-2">{formatAdminDateTime(row.created_at)}</td>
                  <td className="px-3 py-2">{row.full_name ?? '—'}</td>
                  <td className="px-3 py-2">{row.phone_e164 ?? '—'}</td>
                  <td className="px-3 py-2">{row.district}</td>
                  <td className="px-3 py-2">{row.panchayat ?? '—'}</td>
                  <td className="px-3 py-2">{row.constituency_name ?? '—'}</td>
                  <td className="px-3 py-2 tabular-nums">{row.clause_count}</td>
                  <td className="px-3 py-2">{row.stageLabel}</td>
                  <td className="px-3 py-2">{row.sendMethodLabel}</td>
                  <td className="px-3 py-2">{row.is_test ? 'Test' : 'Live'}</td>
                  <td className="px-3 py-2">
                    <Link href={`/admin/submissions/${row.id}`} className={`text-emerald-800 underline ${adminFocus}`}>
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 lg:hidden">
        {rows.length === 0 ? (
          <EmptyState title="No submissions match these filters." body="Try clearing search or including test rows." />
        ) : (
          rows.map((row) => (
            <li key={row.id} className="rounded-md border border-stone-200 bg-white p-3 text-sm">
              <p className="font-medium">{row.full_name ?? '—'}</p>
              <p className="text-stone-600">
                {row.district} · {row.stageLabel} · {row.is_test ? 'Test' : 'Live'}
              </p>
              <p className="text-xs text-stone-500">{formatAdminDateTime(row.created_at)}</p>
              <Link href={`/admin/submissions/${row.id}`} className="mt-2 inline-block text-emerald-800 underline">
                View
              </Link>
            </li>
          ))
        )}
      </ul>

      <div className="flex items-center justify-between text-sm">
        <p>
          {total} total · page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          {page > 1 ? (
            <button type="button" className={adminBtnSecondary} onClick={() => setParam('page', String(page - 1))}>
              Previous
            </button>
          ) : null}
          {page < totalPages ? (
            <button type="button" className={adminBtnSecondary} onClick={() => setParam('page', String(page + 1))}>
              Next
            </button>
          ) : null}
        </div>
      </div>
    </div>
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
    <label>
      <span className="text-xs font-medium text-stone-500">{label}</span>
      <select className={adminInput} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option.value || 'all'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
