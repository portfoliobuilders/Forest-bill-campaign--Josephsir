'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import {
  archiveCampaign,
  createEmptyCampaign,
  deleteCampaign,
  duplicateCampaignFull,
  setCampaignStatus,
  type CampaignBoardRow,
} from '@/app/admin/campaign-actions'
import { ConfirmDialog, EmptyState, KpiCard } from '@/components/admin/AdminPrimitives'
import { adminBtnDanger, adminBtnPrimary, adminBtnSecondary, adminFocus, adminInput } from '@/components/admin/admin-ui'
import { formatAdminDate } from '@/lib/admin/format'
import { CAMPAIGN_STATUS_LABEL, type CampaignStatus } from '@/lib/campaign-status'

const FILTERS = ['all', 'active', 'draft', 'inactive', 'expired', 'archived'] as const

export function CampaignsBoard({ rows }: { rows: CampaignBoardRow[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all')
  const [q, setQ] = useState('')
  const [pending, startTransition] = useTransition()
  const [confirm, setConfirm] = useState<{ id: string; action: 'delete' | 'archive' } | null>(null)
  const [message, setMessage] = useState('')

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (filter !== 'all' && row.status !== filter) return false
      if (!q.trim()) return true
      const hay = `${row.title_en} ${row.title_ml} ${row.slug}`.toLowerCase()
      return hay.includes(q.trim().toLowerCase())
    })
  }, [rows, filter, q])

  const counts = {
    total: rows.length,
    active: rows.filter((row) => row.status === 'active').length,
    draft: rows.filter((row) => row.status === 'draft').length,
    expired: rows.filter((row) => row.status === 'expired').length,
    responses: rows.reduce((sum, row) => sum + row.submission_count, 0),
  }

  async function run(action: () => Promise<{ ok: boolean; error?: string; id?: string }>, next?: string) {
    const result = await action()
    if (!result.ok) {
      setMessage(result.error || 'Something went wrong.')
      return
    }
    setMessage('')
    if (next) router.push(next)
    else router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Campaigns</h1>
          <p className="mt-1 text-sm text-stone-600">Create, edit, and publish campaigns without changing code.</p>
        </div>
        <button
          type="button"
          className={adminBtnPrimary}
          disabled={pending}
          onClick={() => {
            startTransition(() => {
              void createEmptyCampaign().then((result) => {
                if (result.ok && result.id) router.push(`/admin/campaigns/${result.id}`)
                else if (!result.ok) setMessage(result.error)
              })
            })
          }}
        >
          + New Campaign
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Active Campaigns" value={counts.active} />
        <KpiCard label="Draft Campaigns" value={counts.draft} />
        <KpiCard label="Expired Campaigns" value={counts.expired} />
        <KpiCard label="Total Campaigns" value={counts.total} />
        <KpiCard label="Total Campaign Responses" value={counts.responses} hint="Non-test submissions" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input className={`${adminInput} mt-0 sm:max-w-xs`} placeholder="Search campaigns" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              className={`rounded-md px-3 py-2 text-sm ${adminFocus} ${filter === item ? 'bg-emerald-800 text-white' : 'bg-white text-stone-700 ring-1 ring-stone-200'}`}
              onClick={() => setFilter(item)}
            >
              {item === 'all' ? 'All' : CAMPAIGN_STATUS_LABEL[item]}
            </button>
          ))}
        </div>
      </div>
      {message ? <p className="text-sm text-red-800">{message}</p> : null}

      {filtered.length === 0 ? (
        <EmptyState title="No campaigns match." body="Create a campaign or clear the filters." />
      ) : (
        <div className="overflow-x-auto rounded-md border border-stone-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-3 py-2">Campaign</th>
                <th className="px-3 py-2">Malayalam</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Start</th>
                <th className="px-3 py-2">End</th>
                <th className="px-3 py-2">Concerns</th>
                <th className="px-3 py-2">Responses</th>
                <th className="px-3 py-2">Updated</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-stone-100 align-top">
                  <td className="px-3 py-3">
                    <Link href={`/admin/campaigns/${row.id}`} className={`font-medium text-emerald-800 ${adminFocus}`}>
                      {row.title_en}
                    </Link>
                    <p className="mt-0.5 font-mono text-xs text-stone-500">{row.slug}</p>
                  </td>
                  <td className="px-3 py-3 text-stone-700">{row.title_ml}</td>
                  <td className="px-3 py-3">{CAMPAIGN_STATUS_LABEL[row.status]}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{formatAdminDate(row.opens_at)}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{formatAdminDate(row.deadline_at)}</td>
                  <td className="px-3 py-3">{row.concern_count}</td>
                  <td className="px-3 py-3">{row.submission_count}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{formatAdminDate(row.updated_at || row.created_at)}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col items-stretch gap-1">
                      <Link href={`/admin/campaigns/${row.id}`} className={adminBtnSecondary}>
                        Edit
                      </Link>
                      <Link href={`/campaign/${row.slug}`} className={adminBtnSecondary} target="_blank">
                        View
                      </Link>
                      <button
                        type="button"
                        className={adminBtnSecondary}
                        onClick={() =>
                          void duplicateCampaignFull(row.id).then((result) => {
                            if (result.ok && result.id) router.push(`/admin/campaigns/${result.id}`)
                            else if (!result.ok) setMessage(result.error)
                          })
                        }
                      >
                        Duplicate
                      </button>
                      {row.status !== 'active' ? (
                        <button type="button" className={adminBtnSecondary} onClick={() => void run(() => setCampaignStatus(row.id, 'active', true))}>
                          Activate
                        </button>
                      ) : (
                        <button type="button" className={adminBtnSecondary} onClick={() => void run(() => setCampaignStatus(row.id, 'inactive', true))}>
                          Deactivate
                        </button>
                      )}
                      <button type="button" className={adminBtnSecondary} onClick={() => void run(() => setCampaignStatus(row.id, 'expired', true))}>
                        Mark Expired
                      </button>
                      <button type="button" className={adminBtnDanger} onClick={() => setConfirm({ id: row.id, action: row.submission_count > 0 ? 'archive' : 'delete' })}>
                        {row.submission_count > 0 ? 'Archive' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirm ? (
        <ConfirmDialog
          title={confirm.action === 'delete' ? 'Delete this campaign?' : 'Archive this campaign?'}
          confirmLabel={confirm.action === 'delete' ? 'Delete' : 'Archive'}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const id = confirm.id
            const action = confirm.action
            setConfirm(null)
            void run(() => (action === 'delete' ? deleteCampaign(id) : archiveCampaign(id)))
          }}
        >
          {confirm.action === 'delete'
            ? 'Are you sure you want to delete this campaign? This action may permanently remove campaign configuration.'
            : 'This campaign has submissions, so it will be archived instead of permanently deleted.'}
        </ConfirmDialog>
      ) : null}
    </div>
  )
}
