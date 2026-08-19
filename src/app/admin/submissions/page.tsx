import { Suspense } from 'react'

import { EmptyState, ErrorState } from '@/components/admin/AdminPrimitives'
import { SubmissionsTable } from '@/components/admin/SubmissionsTable'
import { requireAdminCampaign } from '@/lib/admin/context'
import { parseAdminFilters } from '@/lib/admin/filters'
import { fetchAdminSubmissions, fetchFilterOptions } from '@/lib/admin/queries'
import { assertAdminEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return { title: 'Submissions — Admin', robots: { index: false, follow: false } }
}

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  assertAdminEnv()
  const { campaign } = await requireAdminCampaign()
  if (!campaign) return <EmptyState title="No campaign selected." body="Create a campaign first." />

  const filters = parseAdminFilters(await searchParams)
  try {
    const [list, options] = await Promise.all([
      fetchAdminSubmissions(campaign.id, filters),
      fetchFilterOptions(campaign.id),
    ])
    return (
      <Suspense fallback={<p className="text-sm text-stone-600">Loading submissions…</p>}>
        <SubmissionsTable
          rows={list.rows}
          total={list.total}
          page={list.page}
          pageSize={list.pageSize}
          filterOptions={options}
        />
      </Suspense>
    )
  } catch {
    return <ErrorState title="Unable to load submissions." body="The citizen database could not be queried." />
  }
}
