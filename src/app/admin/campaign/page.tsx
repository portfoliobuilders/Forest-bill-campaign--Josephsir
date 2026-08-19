import { CampaignEditor } from '@/components/admin/CampaignEditor'
import { EmptyState } from '@/components/admin/AdminPrimitives'
import { requireAdminCampaign } from '@/lib/admin/context'
import { assertAdminEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return { title: 'Campaign — Admin', robots: { index: false, follow: false } }
}

export default async function AdminCampaignPage() {
  assertAdminEnv()
  const { campaign } = await requireAdminCampaign()
  if (!campaign) {
    return <EmptyState title="No campaign selected." body="Create a campaign first." />
  }
  return <CampaignEditor campaign={campaign} />
}
