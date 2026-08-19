import { Suspense } from 'react'

import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient'

export function AdminDashboardShell(props: React.ComponentProps<typeof AdminDashboardClient>) {
  return (
    <Suspense fallback={<p className="p-8 text-stone-600">Loading table…</p>}>
      <AdminDashboardClient {...props} />
    </Suspense>
  )
}
