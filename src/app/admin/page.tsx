import { AdminDashboardShell } from '@/components/admin/AdminDashboardShell'
import { AdminSignOut } from '@/components/admin/AdminSignOut'
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

  try {
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
  } catch {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-12">
        <h1 className="text-2xl font-bold text-stone-900">Admin dashboard could not load</h1>
        <p className="mt-3 text-base text-stone-700">
          You are signed in as {session.email}. Refresh this page. If it still fails, the submissions list
          could not be read from the database.
        </p>
        <div className="mt-6">
          <AdminSignOut />
        </div>
      </div>
    )
  }
}
