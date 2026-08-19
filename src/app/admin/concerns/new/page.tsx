import { ConcernEditor } from '@/components/admin/ConcernEditor'
import { EmptyState } from '@/components/admin/AdminPrimitives'
import { requireAdminCampaign } from '@/lib/admin/context'
import { assertAdminEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

export default async function NewConcernPage() {
  assertAdminEnv()
  const { campaign } = await requireAdminCampaign()
  if (!campaign) return <EmptyState title="No campaign selected." body="Create a campaign first." />
  return <ConcernEditor campaign={campaign} concern={{ campaign_id: campaign.id, is_active: true, sort_order: 0 }} />
}
