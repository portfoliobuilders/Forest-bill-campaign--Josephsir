'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { markDeletionHandled } from '@/app/admin/actions'
import { AdminCard, AdminPageHeader, ConfirmDialog, EmptyState } from '@/components/admin/AdminPrimitives'
import { adminBtnSecondary } from '@/components/admin/admin-ui'
import { formatAdminDate } from '@/lib/admin/format'
import type { DeletionRequestRow, NotifySignupRow } from '@/lib/admin/queries'

export function RequestsView({
  deletionRequests,
  notifySignups,
}: {
  deletionRequests: DeletionRequestRow[]
  notifySignups: NotifySignupRow[]
}) {
  const router = useRouter()
  const [pendingId, setPendingId] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Data requests" description="Deletion requests and notify-me signups." />

      <AdminCard title="Deletion requests">
        {deletionRequests.length === 0 ? (
          <EmptyState title="No deletion requests." body="New requests from /delete will appear here." />
        ) : (
          <ul className="space-y-3">
            {deletionRequests.map((req) => (
              <li key={req.id} className="rounded-md border border-stone-200 p-3 text-sm">
                <p className="font-medium">{req.email}</p>
                <p className="text-stone-600">{req.reason || '—'}</p>
                <p className="mt-1 text-xs text-stone-500">
                  Requested {formatAdminDate(req.created_at)} · {req.matching_count} matching submissions
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <a
                    href={`/admin/submissions?q=${encodeURIComponent(req.email)}&tests=include`}
                    className={`${adminBtnSecondary}`}
                  >
                    View
                  </a>
                  {req.handled_at ? (
                    <p className="self-center text-emerald-800">Handled {formatAdminDate(req.handled_at)}</p>
                  ) : (
                    <button type="button" className={adminBtnSecondary} onClick={() => setPendingId(req.id)}>
                      Mark handled
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <AdminCard
        title="Notify signups"
        action={
          <a href="/api/admin/notify-export" className={adminBtnSecondary}>
            Export CSV
          </a>
        }
      >
        {notifySignups.length === 0 ? (
          <p className="text-sm text-stone-500">None yet.</p>
        ) : (
          <ul className="divide-y divide-stone-100 text-sm">
            {notifySignups.map((row) => (
              <li key={row.id} className="flex justify-between gap-3 py-2">
                <span>{row.email}</span>
                <span className="text-stone-500">{formatAdminDate(row.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      {pendingId ? (
        <ConfirmDialog
          title="Mark this deletion request handled?"
          confirmLabel="Mark handled"
          onCancel={() => setPendingId(null)}
          onConfirm={async () => {
            await markDeletionHandled(pendingId)
            setPendingId(null)
            router.refresh()
          }}
        >
          This does not silently delete citizen records. Confirm only after the erasure process is complete.
        </ConfirmDialog>
      ) : null}
    </div>
  )
}
