import { ConcernEditor } from '@/components/admin/ConcernEditor'
import { EmptyState } from '@/components/admin/AdminPrimitives'
import { requireAdminCampaign } from '@/lib/admin/context'
import { fetchConcernById } from '@/lib/admin/queries'
import { assertAdminEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

export default async function ConcernDetailPage({ params }: { params: Promise<{ id: string }> }) {
  assertAdminEnv()
  const { campaign } = await requireAdminCampaign()
  if (!campaign) return <EmptyState title="No campaign selected." body="Create a campaign first." />
  const { id } = await params
  const concern = await fetchConcernById(id)
  if (!concern) return <EmptyState title="Concern not found." body="It may have been removed from this campaign." />
  return <ConcernEditor campaign={campaign} concern={concern} />
}
