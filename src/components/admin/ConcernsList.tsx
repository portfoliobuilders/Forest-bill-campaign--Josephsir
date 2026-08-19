'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { duplicateConcern, reorderConcerns, setConcernActive } from '@/app/admin/cms-actions'
import { AdminPageHeader, EmptyState } from '@/components/admin/AdminPrimitives'
import { adminBtnSecondary, adminFocus } from '@/components/admin/admin-ui'

export function ConcernsList({
  campaignId,
  rows,
}: {
  campaignId: string
  rows: {
    id: string
    code: string
    section_ref: string | null
    title_ml: string
    title_en: string
    sort_order: number
    is_active: boolean
    usage_count: number
  }[]
}) {
  const router = useRouter()
  const [ordered, setOrdered] = useState(rows)

  async function persist(next: typeof rows) {
    setOrdered(next)
    await reorderConcerns(
      campaignId,
      next.map((row) => row.id),
    )
    router.refresh()
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= ordered.length) return
    const next = [...ordered]
    const current = next[index]
    next[index] = next[target]
    next[target] = current
    void persist(next)
  }

  if (rows.length === 0) {
    return (
      <div className="space-y-4">
        <AdminPageHeader
          title="Concerns"
          actions={
            <Link href="/admin/concerns/new" className={adminBtnSecondary}>
              New concern
            </Link>
          }
        />
        <EmptyState title="No concerns created." body="Add the first objection concern for this campaign." />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Concerns"
        description="Create, reorder, and disable objection points. Do not delete concerns that already appear in submissions."
        actions={
          <Link href="/admin/concerns/new" className={adminBtnSecondary}>
            New concern
          </Link>
        }
      />
      <div className="hidden overflow-hidden rounded-md border border-stone-200 bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-3 py-2">Order</th>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Section</th>
              <th className="px-3 py-2">Malayalam</th>
              <th className="px-3 py-2">English</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Selected</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((row, index) => (
              <tr key={row.id} className="border-b border-stone-100">
                <td className="px-3 py-2 font-mono text-xs">{String(index + 1).padStart(2, '0')}</td>
                <td className="px-3 py-2 font-mono text-xs">{row.code}</td>
                <td className="px-3 py-2">{row.section_ref ?? '—'}</td>
                <td className="px-3 py-2">{row.title_ml}</td>
                <td className="px-3 py-2">{row.title_en}</td>
                <td className="px-3 py-2">{row.is_active ? 'Active' : 'Disabled'}</td>
                <td className="px-3 py-2 tabular-nums">{row.usage_count}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <Link href={`/admin/concerns/${row.id}`} className={`text-emerald-800 underline ${adminFocus}`}>
                      Edit
                    </Link>
                    <button type="button" onClick={() => move(index, -1)}>
                      ↑
                    </button>
                    <button type="button" onClick={() => move(index, 1)}>
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await duplicateConcern(row.id)
                        router.refresh()
                      }}
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await setConcernActive(row.id, !row.is_active)
                        router.refresh()
                      }}
                    >
                      {row.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <Link href={`/admin/submissions?concern=${row.id}`} className="underline">
                      Usage
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-3 md:hidden">
        {ordered.map((row, index) => (
          <li key={row.id} className="rounded-md border border-stone-200 bg-white p-3 text-sm">
            <p className="font-medium">
              {String(index + 1).padStart(2, '0')} · {row.title_en}
            </p>
            <p className="text-stone-600">{row.title_ml}</p>
            <p className="mt-1 text-xs text-stone-500">
              {row.code} · {row.is_active ? 'Active' : 'Disabled'} · {row.usage_count} selected
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link href={`/admin/concerns/${row.id}`} className="underline">
                Edit
              </Link>
              <button type="button" onClick={() => move(index, -1)}>
                Move up
              </button>
              <button type="button" onClick={() => move(index, 1)}>
                Move down
              </button>
              <Link href={`/admin/submissions?concern=${row.id}`} className="underline">
                Usage
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
