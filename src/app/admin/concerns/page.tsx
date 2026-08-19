import { ConcernsList } from '@/components/admin/ConcernsList'
import { EmptyState } from '@/components/admin/AdminPrimitives'
import { requireAdminCampaign } from '@/lib/admin/context'
import { fetchConcerns } from '@/lib/admin/queries'
import { assertAdminEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return { title: 'Concerns — Admin', robots: { index: false, follow: false } }
}

export default async function ConcernsPage() {
  assertAdminEnv()
  const { campaign } = await requireAdminCampaign()
  if (!campaign) return <EmptyState title="No campaign selected." body="Create a campaign first." />
  const rows = await fetchConcerns(campaign.id)
  return <ConcernsList campaignId={campaign.id} rows={rows} />
}
