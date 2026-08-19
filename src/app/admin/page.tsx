import { AdminDashboardShell } from '@/components/admin/AdminDashboardShell'
import { getAdminSession } from '@/lib/admin/auth'
import { parseAdminFilters } from '@/lib/admin/filters'
import {
  fetchAdminFunnel,
  fetchAdminSubmissions,
  fetchAdminSummary,
  fetchDeletionRequests,
  fetchFilterOptions,
  fetchNotifySignups,
} from '@/lib/admin/queries'
import { assertAdminEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return { title: 'Admin — ജനശബ്ദം', robots: { index: false, follow: false } }
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  assertAdminEnv()

  const session = await getAdminSession()
  if (!session) return null

  const filters = parseAdminFilters(await searchParams)
  const includeTests = filters.tests === 'include'

  const [list, summary, funnel, filterOptions, deletionRequests, notifySignups] = await Promise.all([
    fetchAdminSubmissions(filters),
    fetchAdminSummary(includeTests),
    fetchAdminFunnel(includeTests),
    fetchFilterOptions(),
    fetchDeletionRequests(),
    fetchNotifySignups(),
  ])

  return (
    <AdminDashboardShell
      rows={list.rows}
      total={list.total}
      page={list.page}
      pageSize={list.pageSize}
      summary={summary}
      funnel={funnel}
      filterOptions={filterOptions}
      deletionRequests={deletionRequests}
      notifySignups={notifySignups}
      adminEmail={session.email}
    />
  )
}
